import { collection } from "@/infrastructure/transaction";
export class RealtimeService {
  static async broadcast(channel: string, event: string, payload: unknown): Promise<void> {
    await (await collection("realtime_events")).insertOne({ channel, event, payload, createdAt: new Date(), expiresAt: new Date(Date.now() + 3600000) });
  }
  static async notifyGuestUpdated(eventId: string, guestId: string, status: string) { await this.broadcast(`event_${eventId}`, "guest_updated", { guestId, status }); }
  static async notifyCheckIn(eventId: string, guestId: string, record: unknown) { await this.broadcast(`event_${eventId}`, "guest_checked_in", { guestId, record }); }
  static async notifyDashboardMetrics(eventId: string, metrics: unknown) { await this.broadcast(`event_${eventId}`, "metrics_updated", metrics); }
  static async notifyRegistrationSubmitted(eventId: string, submission: unknown) { await this.broadcast(`event_${eventId}`, "registration_submitted", { submission }); }
}
