import { eventNotificationRepository } from "@/infrastructure/repositories/EventNotificationRepository";
import { notificationSettingsRepository } from "@/infrastructure/repositories/SettingsRepositories";
import { EventNotification, NotificationType } from "@/domain/types";
import { RealtimeService } from "./RealtimeService";
import { AuditService } from "./AuditService";

export class EventNotificationService {
  /**
   * Dispatches a notification for an event. Respects event notification settings.
   */
  static async createNotification(params: {
    eventId: string;
    workspaceId: string;
    type: NotificationType;
    title: string;
    message: string;
    details?: Record<string, unknown>;
  }): Promise<EventNotification | null> {
    const { eventId, workspaceId, type, title, message, details = {} } = params;

    try {
      // Check notification settings for this event
      const settingsList = await notificationSettingsRepository.findMany({ eventId });
      const settings = settingsList[0];

      if (settings) {
        if (type === "registration" && settings.notifyOnRegistration === false) return null;
        if (type === "qr_scanned" && settings.notifyOnScan === false) return null;
        if (type === "report_exported" && settings.notifyOnExport === false) return null;
        if (type === "guests_imported" && settings.notifyOnImport === false) return null;
        if (type === "qr_generated" && settings.notifyOnQRGen === false) return null;
      }

      const notification = await eventNotificationRepository.create({
        eventId,
        workspaceId,
        type,
        title,
        message,
        details,
        read: false,
      });

      // Broadcast to real-time feed
      await RealtimeService.broadcast(`event_${eventId}`, "notification_created", {
        notification,
      });

      // Log in audit log
      await AuditService.log(
        "system",
        `NOTIFICATION_${type.toUpperCase()}`,
        {
          eventId,
          title,
          message,
          ...details,
        },
        workspaceId
      );

      return notification;
    } catch (error) {
      console.error("Failed to create event notification:", error);
      return null;
    }
  }

  static async getFeed(
    eventId: string,
    options?: { limit?: number; type?: string; unreadOnly?: boolean }
  ) {
    const [notifications, unreadCount, settingsList] = await Promise.all([
      eventNotificationRepository.findByEvent(eventId, options),
      eventNotificationRepository.countUnread(eventId),
      notificationSettingsRepository.findMany({ eventId }),
    ]);

    const settings = settingsList[0] || {
      showDashboardBadge: true,
      notifyOnRegistration: true,
      notifyOnScan: true,
      notifyOnExport: true,
      notifyOnImport: true,
      notifyOnQRGen: true,
    };

    return {
      notifications,
      unreadCount,
      showDashboardBadge: settings.showDashboardBadge ?? true,
      settings,
    };
  }

  static async markAsRead(id: string, eventId: string) {
    const notification = await eventNotificationRepository.findById(id);
    if (!notification || notification.eventId !== eventId) throw new Error("Notification not found for this event");
    return eventNotificationRepository.markAsRead(id);
  }

  static async markAllAsRead(eventId: string) {
    return eventNotificationRepository.markAllAsRead(eventId);
  }

  static async deleteNotification(id: string, eventId: string) {
    const notification = await eventNotificationRepository.findById(id);
    if (!notification || notification.eventId !== eventId) throw new Error("Notification not found for this event");
    return eventNotificationRepository.delete(id);
  }

  static async clearAll(eventId: string) {
    return eventNotificationRepository.clearAll(eventId);
  }
}
