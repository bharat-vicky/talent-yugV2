import { EmailService } from "./EmailService";
import { SmsService } from "./SmsService";
import { RealtimeService } from "./RealtimeService";
import { GuestDocument, Event } from "@/domain/types";
export class NotificationService {
  static async sendGuestInvitation(workspaceId:string,event:Event,guest:GuestDocument,qrData:string,attachment?:string,customMessage?:string) {
    const guestName=`${guest.firstName} ${guest.lastName}`;
    if(guest.email)await EmailService.sendGuestBadge(workspaceId,event,guest.email,guestName,qrData,attachment,customMessage);
    const sendSms = !!(guest.phone && /^\+[1-9]\d{6,14}$/.test(guest.phone) && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
    if(sendSms)await SmsService.sendSms(workspaceId,guest.phone!,`Hi ${guestName}, you are registered for ${event.name}. Please check your email or contact the organizer for your badge.`,event._id?.toString());
    await RealtimeService.broadcast(`event_${event._id}`,"notification_queued",{type:"guest_badge",guestId:guest._id,channels:[guest.email?"email":null,sendSms?"sms":null].filter(Boolean)});
  }
}
