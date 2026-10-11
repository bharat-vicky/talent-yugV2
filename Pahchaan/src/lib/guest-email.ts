import type { Event } from "@/domain/types";

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]!);

export function guestEmail(event: Event, guestName: string, customMessage?: string) {
  const date = new Date(event.date);
  const when = Number.isNaN(date.getTime()) ? "Date to be confirmed" : new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(date) + " (IST)";
  const venue = event.venue || "Venue to be confirmed";
  const message = customMessage || `Thank you for registering for ${event.name}. We're looking forward to welcoming you!`;
  const instructions = "Save this email or download the attached QR image. Show your personal QR at the entrance for a smooth check-in. This pass belongs to you—please keep it private.";
  return {
    subject: `You're on the guest list — your pass to ${event.name.replace(/[\r\n]/g, " ")}`,
    text: `Hi ${guestName},\n\n${message}\n\nYour personal check-in QR is attached.\n\n${event.name}\nDate: ${when}\nVenue: ${venue}\n\n${instructions}\n\nSee you there,\nThe ${event.name} team\nPowered by Pahchaan · TalentYug`,
    html: `<!doctype html><html><body style="margin:0;background:#f3f5ef;font-family:Arial,sans-serif;color:#184b3f"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:560px;background:#fffdf7;border:1px solid #dce3d6;border-radius:20px" cellpadding="0" cellspacing="0"><tr><td style="padding:36px 28px;background:#184b3f;color:#fffdf7;border-radius:20px 20px 0 0"><p style="font-size:12px;letter-spacing:3px;color:#e5ebc9">PAHCHAAN · BY TALENTYUG</p><h1 style="font-family:Georgia,serif;font-size:32px;font-weight:normal;margin:20px 0 8px">You're on the guest list.</h1><p style="margin:0;color:#e5ebc9">A warm welcome starts here.</p></td></tr><tr><td style="padding:28px"><p>Hi ${escape(guestName)},</p><p style="line-height:1.7">${escape(message).replace(/\n/g, "<br>")}</p><h2 style="font-size:22px">${escape(event.name)}</h2><p style="line-height:1.8"><strong>Date</strong><br>${escape(when)}<br><br><strong>Venue</strong><br>${escape(venue)}</p><div style="text-align:center;background:#f3f5ef;border-radius:16px;padding:24px"><p style="font-size:12px;letter-spacing:2px">YOUR PERSONAL CHECK-IN QR</p><img src="cid:check-in-qr" width="240" height="240" alt="Your check-in QR. Download Check-in-QR.png if images are hidden." style="display:block;max-width:100%;margin:auto"><p style="font-size:13px">A pass. A scan. You're in.</p></div><p style="font-size:14px;line-height:1.7">${escape(instructions)}</p><p style="line-height:1.7">See you there,<br><strong>The ${escape(event.name)} team</strong></p></td></tr><tr><td style="padding:20px 28px;border-top:1px solid #dce3d6;font-size:12px;color:#667567">Sent for your event registration.<br>Powered by Pahchaan · TalentYug</td></tr></table></td></tr></table></body></html>`,
  };
}
