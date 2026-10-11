import {literalSearch,validatePage} from "@/lib/query";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import {
  eventSettingsRepository,
  scannerSettingsRepository,
  registrationSettingsRepository,
  brandingSettingsRepository,
  qrConfigurationRepository,
  guestConfigurationRepository,
  notificationSettingsRepository
} from "@/infrastructure/repositories/SettingsRepositories";
import { AuditService } from "./AuditService";
import { RBACService } from "./RBACService";
import { DataLifecycleService } from "./DataLifecycleService";
import { EventStatus } from "@/domain/types";

const VALID_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  draft: ["scheduled", "published", "cancelled", "archived"],
  scheduled: ["published", "cancelled", "draft"],
  published: ["live", "paused", "cancelled", "archived"],
  live: ["paused", "completed"],
  paused: ["live", "completed", "cancelled"],
  completed: ["archived"],
  archived: ["draft", "published"],
  cancelled: ["draft", "archived"],
};

export interface GetEventsOptions {
  status?: EventStatus | EventStatus[];
  search?: string;
  isFavorite?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  venue?: string;
  owner?: string;
  date?: string;
}

export class EventService {
  static async createEvent(
    userId: string,
    workspaceId: string,
    name: string,
    slug: string,
    endDate: Date,
    date: Date,
    venue?: string,
    description?: string,
    templateId?: string,
    maxCapacity?: number,
    category?: string
  ) {
    await RBACService.requirePermission(userId, workspaceId, "manager");

    const event = await eventRepository.create({
      workspaceId,
      name,
      slug,
      category: category || null,
      description: description || null,
      templateId: templateId || null,
      status: "draft",
      endDate,
      date,
      venue: venue || null,
    });

    const eventId = event._id as string;

    await Promise.all([
      eventSettingsRepository.create({ eventId, workspaceId, isPublic: false, maxCapacity: maxCapacity || 0 }),
      scannerSettingsRepository.create({ eventId, workspaceId, offlineEnabled: true, autoSync: true }),
      registrationSettingsRepository.create({ eventId, workspaceId, requireApproval: false, allowWaitlist: false }),
      brandingSettingsRepository.create({ eventId, workspaceId, primaryColor: "#000000" }),
      qrConfigurationRepository.create({ eventId, workspaceId, style: "squares", fgColor: "#000000", bgColor: "#ffffff" }),
      guestConfigurationRepository.create({ eventId, workspaceId, collectPhone: false, collectOrganization: false, customFields: [] }),
      notificationSettingsRepository.create({ eventId, workspaceId, emailAlerts: true, dailyDigest: true, webhookUrl: null })
    ]);

    await AuditService.log(userId, "EVENT_CREATED", { name, slug, status: "draft" }, workspaceId);

    return event;
  }


  static async updateEvent(userId: string, workspaceId: string, eventId: string, updates: Record<string, unknown>) {
    await RBACService.requirePermission(userId, workspaceId, "manager");
    const existing = await eventRepository.findById(eventId);
    if (!existing || existing.workspaceId !== workspaceId) throw new Error("Event not found or unauthorized");
    const editable = new Set(["name", "slug", "description", "category", "date", "endDate", "venue", "maxCapacity"]);
    updates = Object.fromEntries(Object.entries(updates).filter(([key]) => editable.has(key)));

    // Prevent updating status directly through updateEvent
    if (updates.status) delete updates.status;

    const { maxCapacity, ...eventUpdates } = updates;

    const event = await eventRepository.update(eventId, eventUpdates as Partial<import("@/domain/types").Event>);

    if (maxCapacity !== undefined) {
      const settings = await eventSettingsRepository.findOne({ eventId });
      if (settings && settings._id) {
        await eventSettingsRepository.update(settings._id.toString(), { maxCapacity: Number(maxCapacity) });
      }
    }

    await AuditService.log(userId, "EVENT_UPDATED", { eventId, updates }, workspaceId);
    return event;
  }

  static async updateStatus(userId: string, workspaceId: string, eventId: string, newStatus: EventStatus) {
    await RBACService.requirePermission(userId, workspaceId, "manager");

    const event = await eventRepository.findById(eventId);
    if (!event) throw new Error("Event not found");
    if (event.workspaceId !== workspaceId) throw new Error("Unauthorized");

    const currentStatus = event.status;
    const allowed = VALID_TRANSITIONS[currentStatus]?.includes(newStatus);

    if (!allowed) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    const updatedEvent = await eventRepository.update(eventId, { status: newStatus });

    // Generate appropriate audit log based on transition
    let action = "EVENT_UPDATED";
    if (newStatus === "published") action = "EVENT_PUBLISHED";
    else if (newStatus === "archived") action = "EVENT_ARCHIVED";
    else if (newStatus === "draft" && currentStatus === "archived") action = "EVENT_RESTORED";
    else action = "EVENT_STATUS_CHANGED";

    await AuditService.log(userId, action, { eventId, oldStatus: currentStatus, newStatus }, workspaceId);

    return updatedEvent;
  }

  static async duplicateEvent(userId: string, workspaceId: string, eventId: string, newName: string, newSlug: string, newDate: Date) {
    await RBACService.requirePermission(userId, workspaceId, "manager");

    const originalEvent = await eventRepository.findById(eventId);
    if (!originalEvent || originalEvent.workspaceId !== workspaceId) {
      throw new Error("Event not found or unauthorized");
    }

    // 1. Create new event
    const duplicatedEvent = await eventRepository.create({
      workspaceId,
      name: newName,
      slug: newSlug,
      description: originalEvent.description,
      templateId: originalEvent.templateId,
      status: "draft",
      endDate: originalEvent.endDate,
      date: newDate,
      venue: originalEvent.venue,
    });

    const newEventId = duplicatedEvent._id as string;

    // 2. Fetch original settings
    const [
      eventSettings,
      scannerSettings,
      registrationSettings,
      brandingSettings,
      qrConfig,
      guestConfig
    ] = await Promise.all([
      eventSettingsRepository.findMany({ eventId }),
      scannerSettingsRepository.findMany({ eventId }),
      registrationSettingsRepository.findMany({ eventId }),
      brandingSettingsRepository.findMany({ eventId }),
      qrConfigurationRepository.findMany({ eventId }),
      guestConfigurationRepository.findMany({ eventId }),
      notificationSettingsRepository.findMany({ eventId }),
    ]);

    // 3. Clone settings (stripping _id and updating eventId)

    const cloneDoc = (docs: any[]) => {
      if (!docs.length) return {};
      const doc = { ...docs[0] };
      delete doc._id;
      delete doc.createdAt;
      delete doc.updatedAt;
      return { ...doc, eventId: newEventId, workspaceId };
    };

    await Promise.all([

      eventSettings.length ? eventSettingsRepository.create(cloneDoc(eventSettings) as any) : eventSettingsRepository.create({ eventId: newEventId, workspaceId, isPublic: false }),

      scannerSettings.length ? scannerSettingsRepository.create(cloneDoc(scannerSettings) as any) : scannerSettingsRepository.create({ eventId: newEventId, workspaceId, offlineEnabled: true, autoSync: true }),

      registrationSettings.length ? registrationSettingsRepository.create(cloneDoc(registrationSettings) as any) : registrationSettingsRepository.create({ eventId: newEventId, workspaceId, requireApproval: false, allowWaitlist: false }),

      brandingSettings.length ? brandingSettingsRepository.create(cloneDoc(brandingSettings) as any) : brandingSettingsRepository.create({ eventId: newEventId, workspaceId, primaryColor: "#000000" }),

      qrConfig.length ? qrConfigurationRepository.create(cloneDoc(qrConfig) as any) : qrConfigurationRepository.create({ eventId: newEventId, workspaceId, style: "squares", fgColor: "#000000", bgColor: "#ffffff" }),

      guestConfig.length ? guestConfigurationRepository.create(cloneDoc(guestConfig) as any) : guestConfigurationRepository.create({ eventId: newEventId, workspaceId, collectPhone: false, collectOrganization: false, customFields: [] }),

      notificationSettingsRepository.create(cloneDoc(await notificationSettingsRepository.findMany({ eventId })) as any || { eventId: newEventId, workspaceId, emailAlerts: true, dailyDigest: true, webhookUrl: null })
    ]);

    await AuditService.log(userId, "EVENT_DUPLICATED", { originalEventId: eventId, newEventId }, workspaceId);

    return duplicatedEvent;
  }

  static async deleteEvent(userId: string, workspaceId: string, eventId: string) {
    await RBACService.requirePermission(userId, workspaceId, "admin"); // Deletion requires admin

    const event = await eventRepository.findById(eventId);
    if (!event || event.workspaceId !== workspaceId) throw new Error("Event not found or unauthorized");

    await DataLifecycleService.removeEvent(workspaceId, eventId);
    await AuditService.log(userId, "EVENT_DELETED", { eventId, name: event.name }, workspaceId);
    return true;
  }

  static async getEvents(userId: string, workspaceId: string, options: GetEventsOptions) {
    await RBACService.requirePermission(userId, workspaceId, "viewer");

    const {
      status,
      search,
      isFavorite,
      page = 1,
      limit = 20,
      sortBy = "date",
      sortOrder = "desc",
      venue,
      date,
    } = options;


    validatePage(page,limit);
    const query: Record<string, any> = { workspaceId };

    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    } else {
      query.status = { $ne: "archived" };
    }

    if (search) {
      query.$or = [
        { name: { $regex: literalSearch(search), $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { venue: { $regex: search, $options: "i" } },
      ];
    }

    if (venue) {
      query.venue = venue;
    }

    if (date) {
      // Basic date matching (could be expanded to ranges)
      query.date = { $gte: new Date(date) };
    }

    if (options.sortBy === "venue" && options.search) {
        // Venue search handled above. If venue specific filter provided:
    }

    if (isFavorite) {
      // Need to fetch user memberships first
      const { membershipRepository } = await import("@/infrastructure/repositories/MembershipRepository");
      const memberships = await membershipRepository.findByUserId(userId);
      const membership = memberships.find(m => m.workspaceId === workspaceId);
      if (membership?.favoriteEventIds?.length) {
        const { ObjectId } = await import("mongodb");
        query._id = { $in: membership.favoriteEventIds.map(id => {
          return new ObjectId(id);
        }) };
      } else {
        // user requested favorites but has none, return empty
        return { events: [], total: 0, page, limit, totalPages: 0 };
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { eventRepository } = await import("@/infrastructure/repositories/EventRepository");

    // Instead of findMany, we need a custom method for pagination, but for now we can fetch all and slice, or ideally add pagination to MongoRepository
    // For proper scalability, let's implement pagination in MongoRepository next, but for now use getCollection

    // Access collection directly to avoid rewriting repository for now
    const client = await (await import("@/infrastructure/db")).default();
    const collection = client.db().collection("events");

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [events, total] = await Promise.all([
      collection.find(query).sort(sort).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query)
    ]);

    return {
      events: events.map(e => ({ ...e, _id: e._id.toString() })) as unknown as import("@/domain/types").Event[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async favoriteEvent(userId: string, workspaceId: string, eventId: string) {
    await RBACService.requirePermission(userId, workspaceId, "viewer");
    const { membershipRepository } = await import("@/infrastructure/repositories/MembershipRepository");

    const memberships = await membershipRepository.findByUserId(userId);
    const membership = memberships.find(m => m.workspaceId === workspaceId);
    if (!membership) throw new Error("Unauthorized");

    const favoriteEventIds = membership.favoriteEventIds || [];
    if (!favoriteEventIds.includes(eventId)) {
      favoriteEventIds.push(eventId);
      await membershipRepository.update(membership._id as string, { favoriteEventIds });
      await AuditService.log(userId, "FAVORITE_ADDED", { eventId }, workspaceId);
    }
    return true;
  }

  static async unfavoriteEvent(userId: string, workspaceId: string, eventId: string) {
    await RBACService.requirePermission(userId, workspaceId, "viewer");
    const { membershipRepository } = await import("@/infrastructure/repositories/MembershipRepository");

    const memberships = await membershipRepository.findByUserId(userId);
    const membership = memberships.find(m => m.workspaceId === workspaceId);
    if (!membership) throw new Error("Unauthorized");

    const favoriteEventIds = membership.favoriteEventIds || [];
    const index = favoriteEventIds.indexOf(eventId);
    if (index > -1) {
      favoriteEventIds.splice(index, 1);
      await membershipRepository.update(membership._id as string, { favoriteEventIds });
      await AuditService.log(userId, "FAVORITE_REMOVED", { eventId }, workspaceId);
    }
    return true;
  }
}
