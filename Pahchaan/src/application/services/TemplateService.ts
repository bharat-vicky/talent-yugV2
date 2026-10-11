import { eventTemplateRepository, TemplateSearchOptions } from "@/infrastructure/repositories/EventTemplateRepository";
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
import { registrationFormRepository } from "@/infrastructure/repositories/RegistrationFormRepository";
import { AuditService } from "./AuditService";
import { RBACService } from "./RBACService";
import { EventTemplate, TemplateModule, TemplateVisibility } from "@/domain/types";
import { EventService } from "./EventService";

export class TemplateService {
  static async searchTemplates(userId: string, workspaceId: string, options: TemplateSearchOptions) {
    await RBACService.requirePermission(userId, workspaceId, "viewer");
    return eventTemplateRepository.searchTemplates({ ...options, workspaceId });
  }

  static async getTemplateById(userId: string, workspaceId: string, templateId: string) {
    await RBACService.requirePermission(userId, workspaceId, "viewer");
    const template = await eventTemplateRepository.findById(templateId);
    if (!template) throw new Error("Template not found");
    if (template.workspaceId !== workspaceId && !template.isOfficial) {
      throw new Error("Unauthorized to access this template");
    }
    return template;
  }

  static async createTemplate(
    userId: string,
    workspaceId: string,
    data: Partial<EventTemplate>
  ) {
    await RBACService.requirePermission(userId, workspaceId, "manager");

    const template = await eventTemplateRepository.create({
      workspaceId,
      name: data.name || "Untitled Template",
      description: data.description || "",
      category: data.category || "Custom",
      thumbnail: data.thumbnail || null,
      coverImage: data.coverImage || null,
      tags: data.tags || [],
      visibility: data.visibility || "workspace",
      status: "published",
      isOfficial: false,
      createdBy: userId,
      favoriteCount: 0,
      usageCount: 0,
      modules: data.modules || [],
      settingsSnapshot: data.settingsSnapshot || {},
    });

    await AuditService.log(userId, "TEMPLATE_CREATED", { templateId: template._id }, workspaceId);
    return template;
  }

  static async duplicateTemplate(userId: string, workspaceId: string, templateId: string) {
    const template = await this.getTemplateById(userId, workspaceId, templateId);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const { _id, createdAt, updatedAt, favoriteCount, usageCount, ...rest } = template as any;
    
    return this.createTemplate(userId, workspaceId, {
      ...rest,
      name: `${template.name} (Copy)`,
      isOfficial: false,
      visibility: "workspace", // Copies should default to workspace to avoid public clutter
    });
  }

  static async updateTemplate(userId: string, workspaceId: string, templateId: string, data: Partial<EventTemplate>) {
    await RBACService.requirePermission(userId, workspaceId, "manager");
    const template = await this.getTemplateById(userId, workspaceId, templateId);
    if (template.isOfficial) throw new Error("Cannot modify official templates");

    const editable = new Set(["name", "description", "category", "thumbnail", "coverImage", "tags", "visibility", "status", "modules"]);
    const safeData = Object.fromEntries(Object.entries(data).filter(([key]) => editable.has(key)));
    const updated = await eventTemplateRepository.update(templateId, {
      ...safeData,
      updatedBy: userId,
      updatedAt: new Date()
    });

    await AuditService.log(userId, "TEMPLATE_UPDATED", { templateId }, workspaceId);
    return updated;
  }

  static async archiveTemplate(userId: string, workspaceId: string, templateId: string) {
    return this.updateTemplate(userId, workspaceId, templateId, { status: "archived" });
  }

  static async restoreTemplate(userId: string, workspaceId: string, templateId: string) {
    return this.updateTemplate(userId, workspaceId, templateId, { status: "published" });
  }

  static async deleteTemplate(userId: string, workspaceId: string, templateId: string) {
    await RBACService.requirePermission(userId, workspaceId, "admin");
    const template = await this.getTemplateById(userId, workspaceId, templateId);
    if (template.isOfficial) throw new Error("Cannot delete official templates");

    await eventTemplateRepository.delete(templateId);
    await AuditService.log(userId, "TEMPLATE_DELETED", { templateId }, workspaceId);
    return true;
  }

  static async favoriteTemplate(userId: string, workspaceId: string, templateId: string) {
    await this.getTemplateById(userId, workspaceId, templateId);
    // In a real app we'd track per-user favorites in a junction table,
    // but for now we just increment the global count per the instructions.
    await eventTemplateRepository.incrementFavorite(templateId);
    return true;
  }

  static async saveEventAsTemplate(
    userId: string,
    workspaceId: string,
    eventId: string,
    modules: TemplateModule[],
    templateData: { name: string, description: string, category: string, visibility: TemplateVisibility, thumbnail?: string }
  ) {
    await RBACService.requirePermission(userId, workspaceId, "manager");

    const event = await eventRepository.findById(eventId);
    if (!event || event.workspaceId !== workspaceId) throw new Error("Event not found");

    // Fetch settings based on selected modules
    const settingsSnapshot: EventTemplate["settingsSnapshot"] = {};

    if (modules.includes("event_settings")) {
      const settings = await eventSettingsRepository.findOne({ eventId });
      if (settings) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        const { _id, eventId: _, workspaceId: __, createdAt, updatedAt, ...rest } = settings as any;
        settingsSnapshot.event = rest;
      }
    }

    if (modules.includes("branding")) {
      const branding = await brandingSettingsRepository.findOne({ eventId });
      if (branding) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        const { _id, eventId: _, workspaceId: __, createdAt, updatedAt, ...rest } = branding as any;
        settingsSnapshot.branding = rest;
      }
    }

    if (modules.includes("registration_settings")) {
      const reg = await registrationSettingsRepository.findOne({ eventId });
      if (reg) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        const { _id, eventId: _, workspaceId: __, createdAt, updatedAt, ...rest } = reg as any;
        settingsSnapshot.registration = rest;
      }
    }

    if (modules.includes("registration_form")) {
      const form = await registrationFormRepository.findOne({ eventId });
      if (form) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        const { _id, eventId: _, workspaceId: __, createdAt, updatedAt, ...rest } = form as any;
        settingsSnapshot.registrationForm = rest;
      }
    }

    if (modules.includes("scanner_config")) {
      const scanner = await scannerSettingsRepository.findOne({ eventId });
      if (scanner) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        const { _id, eventId: _, workspaceId: __, createdAt, updatedAt, ...rest } = scanner as any;
        settingsSnapshot.scanner = rest;
      }
    }

    if (modules.includes("qr_config")) {
      const qr = await qrConfigurationRepository.findOne({ eventId });
      if (qr) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        const { _id, eventId: _, workspaceId: __, createdAt, updatedAt, ...rest } = qr as any;
        settingsSnapshot.qr = rest;
      }
    }

    if (modules.includes("guest_config")) {
      const guest = await guestConfigurationRepository.findOne({ eventId });
      if (guest) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        const { _id, eventId: _, workspaceId: __, createdAt, updatedAt, ...rest } = guest as any;
        settingsSnapshot.guest = rest;
      }
    }

    if (modules.includes("notification_config")) {
      const notif = await notificationSettingsRepository.findOne({ eventId });
      if (notif) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        const { _id, eventId: _, workspaceId: __, createdAt, updatedAt, ...rest } = notif as any;
        settingsSnapshot.notification = rest;
      }
    }

    return this.createTemplate(userId, workspaceId, {
      ...templateData,
      modules,
      settingsSnapshot,
    });
  }

  static async createEventFromTemplate(
    userId: string,
    workspaceId: string,
    templateId: string,
    eventData: { name: string, slug: string, endDate: Date, date: Date, venue?: string }
  ) {
    const template = await this.getTemplateById(userId, workspaceId, templateId);
    
    // Increment template usage
    await eventTemplateRepository.incrementUsage(templateId);

    // Create the base event
    const event = await EventService.createEvent(
      userId,
      workspaceId,
      eventData.name,
      eventData.slug,
      eventData.endDate,
      eventData.date,
      eventData.venue,
      template.description,
      templateId
    );

    const eventId = event._id as string;
    const snap = template.settingsSnapshot || {};

    // For any module that was saved in the template, update the default documents created by EventService
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateSetting = async (repo: any, data: any) => {
      const doc = await repo.findOne({ eventId });
      if (doc && doc._id) await repo.update(doc._id, Object.fromEntries(Object.entries(data).filter(([key]) => !["_id","workspaceId","eventId","createdAt","updatedAt"].includes(key) && !key.startsWith("$") && !key.includes("."))));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promises: Promise<any>[] = [];

    if (snap.event) promises.push(updateSetting(eventSettingsRepository, snap.event));
    if (snap.branding) promises.push(updateSetting(brandingSettingsRepository, snap.branding));
    if (snap.registration) promises.push(updateSetting(registrationSettingsRepository, snap.registration));
    
    if (snap.registrationForm) {
      // EventService doesn't create a default registration form, so we create one if the template has it
      promises.push(registrationFormRepository.create({
        ...snap.registrationForm,
        eventId,
        workspaceId
      }));
    }

    if (snap.scanner) promises.push(updateSetting(scannerSettingsRepository, snap.scanner));
    if (snap.qr) promises.push(updateSetting(qrConfigurationRepository, snap.qr));
    if (snap.guest) promises.push(updateSetting(guestConfigurationRepository, snap.guest));
    if (snap.notification) promises.push(updateSetting(notificationSettingsRepository, snap.notification));

    await Promise.all(promises);

    await AuditService.log(userId, "EVENT_CREATED_FROM_TEMPLATE", { eventId, templateId }, workspaceId);
    return event;
  }
}
