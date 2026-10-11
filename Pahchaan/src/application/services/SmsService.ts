import { Event } from "@/domain/types";
import { JobQueueService } from "./JobQueue";
export class SmsService {
  static async sendSms(workspaceId: string, to: string, message: string, eventId?:string): Promise<void> {
    if (!/^\+[1-9]\d{6,14}$/.test(to)) throw new Error("SMS requires a phone number in international format");
    await JobQueueService.enqueue("sms", { workspaceId, eventId, to, message });
  }
  static async deliver(payload: Record<string, unknown>) {
    const account = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM;
    if (!account || !token || !from || !/^AC[a-fA-F0-9]{32}$/.test(account)) throw new Error("SMS delivery is not configured");
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`, {
      method: "POST", signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Basic ${Buffer.from(`${account}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: from, To: String(payload.to), Body: String(payload.message) })
    });
    if (!response.ok) throw new Error(`SMS provider returned ${response.status}`);
    return { accepted: true };
  }
  static async sendGuestBadge(workspaceId: string, event: Event, to: string, guestName: string, badgeUrl: string) {
    await this.sendSms(workspaceId, to, `Hi ${guestName}, welcome to ${event.name}! Your badge: ${badgeUrl}`,event._id?.toString());
  }
}
