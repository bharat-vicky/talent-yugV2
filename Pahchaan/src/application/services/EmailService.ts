import nodemailer from "nodemailer";
import { Event } from "@/domain/types";
import { JobQueueService } from "./JobQueue";
import QRCode from "qrcode";
import { badgeAttachment } from "@/lib/badge-attachment";
import { guestEmail } from "@/lib/guest-email";
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]!);
type Attachment = {filename:string;path?:string;content?:string|Buffer;contentType?:string;cid?:string};
export class EmailService {
  static async sendEmail(workspaceId:string,to:string,subject:string,html:string,attachments?:Attachment[],eventId?:string,text?:string,queueOptions?:{priority?:number;deliveryDeadline?:Date}):Promise<void> {
    if (attachments?.some(item=>item.path)) throw new Error("File-path attachments are not allowed");
    await JobQueueService.enqueue("email",{workspaceId,eventId,to,subject,html,text,attachments:attachments?.map(item=>({...item,content:Buffer.isBuffer(item.content)?item.content.toString("base64"):item.content,encoding:Buffer.isBuffer(item.content)?"base64":undefined}))},queueOptions);
  }
  static async deliver(payload:Record<string,unknown>):Promise<void> {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM) throw new Error("SMTP delivery is not configured");
    const transporter = nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_PORT==="465",requireTLS:process.env.SMTP_PORT!=="465",connectionTimeout:10000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
    const mail = payload as unknown as {to:string;subject:string;html:string;attachments?:Array<{filename:string;content:string;encoding?:"base64";contentType?:string}>};
    await transporter.sendMail({from:process.env.SMTP_FROM,...mail});
  }
  static async sendWorkspaceInvite(workspaceId:string,to:string,role:string,token:string) {
    const base=process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
    if(!base) throw new Error("App URL must be configured");
    await this.sendEmail(workspaceId,to,"Workspace invitation",`<p>You are invited as ${escape(role)}.</p><p><a href="${escape(new URL(`/pahchaan/invite?token=${token}`,base).toString())}">Review invitation</a></p>`);
  }
  static async sendRegistrationConfirmation(workspaceId:string,eventName:string,to:string) {await this.sendEmail(workspaceId,to,`Registration received: ${eventName}`,`<p>Your registration for ${escape(eventName)} has been received.</p>`);}
  static async sendApprovalNotification(workspaceId:string,eventName:string,to:string,qrUrl:string) {
    const url=new URL(qrUrl);if(!["https:","http:"].includes(url.protocol))throw new Error("Invalid badge URL");
    await this.sendEmail(workspaceId,to,`Approved for ${eventName}`,`<p>You are approved for ${escape(eventName)}.</p><p><a href="${escape(url.toString())}">View ticket</a></p>`);
  }
  static async sendRejectionNotification(workspaceId:string,eventName:string,to:string) {await this.sendEmail(workspaceId,to,`Update regarding ${eventName}`,"<p>We are unable to approve your registration at this time.</p>");}
  static async sendGuestBadge(workspaceId:string,event:Event,to:string,guestName:string,qrData:string,attachment?:string,customMessage?:string) {
    const attachments:Attachment[]=[{filename:"Check-in-QR.png",content:await QRCode.toBuffer(qrData,{type:"png",width:600,margin:4,errorCorrectionLevel:"M"}),contentType:"image/png",cid:"check-in-qr"}];
    if(attachment) attachments.push(badgeAttachment(attachment));
    const message=guestEmail(event,guestName,customMessage);
    await this.sendEmail(workspaceId,to,message.subject,message.html,attachments,event._id?.toString(),message.text);
  }
}
