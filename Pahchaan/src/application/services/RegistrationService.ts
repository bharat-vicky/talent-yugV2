import { registrationFormRepository } from "@/infrastructure/repositories/RegistrationFormRepository";
import { registrationSubmissionRepository } from "@/infrastructure/repositories/RegistrationSubmissionRepository";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { eventSettingsRepository } from "@/infrastructure/repositories/SettingsRepositories";
import { GuestService } from "./GuestService";
import { AuditService } from "./AuditService";
import { RealtimeService } from "./RealtimeService";
import { EventNotificationService } from "./EventNotificationService";
import { RegistrationSubmission } from "@/domain/types";
import { assertRegistrationOpen, RegistrationError, validateRegistrationAnswers } from "@/lib/registration-validation";
import { exactEmailPattern } from "@/lib/email";
import { lockEvent, withTransaction } from "@/infrastructure/transaction";
import { guestRepository } from "@/infrastructure/repositories/GuestRepository";
import crypto from "node:crypto";
import { EmailService } from "./EmailService";

export class RegistrationService {
  
  /**
   * Process a new public registration submission
   */
  static async submitRegistration(
    eventId: string,
    answers: Record<string, unknown>,
    deviceMetadata?: RegistrationSubmission["deviceMetadata"],
    idempotencyKey?: string
  ): Promise<RegistrationSubmission> {
    return withTransaction(async () => {
      await lockEvent(eventId);
      const requestHash = crypto.createHash("sha256").update(JSON.stringify(answers)).digest("hex");
      if (idempotencyKey) {
        if (!/^[a-zA-Z0-9_-]{8,128}$/.test(idempotencyKey)) throw new RegistrationError("Invalid retry key");
        const existing = await registrationSubmissionRepository.findOne({ eventId, idempotencyKey });
        if (existing) {
          if (existing.requestHash !== requestHash) throw new RegistrationError("Retry key was already used for different answers", 409);
          return existing;
        }
      }
      const created = await this.submit(eventId, answers, deviceMetadata);
      if (idempotencyKey) await registrationSubmissionRepository.update(created._id as string, { idempotencyKey, requestHash });
      return created;
    });
  }

  private static async submit(eventId: string, answers: Record<string, unknown>, deviceMetadata?: RegistrationSubmission["deviceMetadata"]): Promise<RegistrationSubmission> {
    const event = await eventRepository.findById(eventId);
    if (!event) throw new Error("Event not found");

    const form = await registrationFormRepository.findByEventId(eventId);
    if (!form) throw new Error("Registration form not configured for this event");
    assertRegistrationOpen(event, form);
    answers = validateRegistrationAnswers(form.fields, answers);
    if (form.settings.duplicateEmailPolicy !== "allow") {
      const emailField = form.fields.find(field => field.type === "email");
      const email = emailField && answers[emailField.id];
      if (emailField && typeof email === "string") {
        const existing = await registrationSubmissionRepository.findOne({
          eventId,
          [`answers.${emailField.id}`]: { $regex: exactEmailPattern(email) },
        });
        if (existing) throw new RegistrationError("This email is already registered", 409);
      }
    }

    if (form.settings.duplicatePhonePolicy !== "allow") {
      const field = form.fields.find(field => field.type === "phone");
      const phone = field && answers[field.id];
      if (field && typeof phone === "string" && phone.trim()) {
        const canonical = phone.replace(/[ ()-]/g, "");
        answers[field.id] = canonical;
        const existing = await registrationSubmissionRepository.findOne({ eventId, [`answers.${field.id}`]: canonical });
        if (existing) throw new RegistrationError("This phone number is already registered. Contact the organizer to update your details.", 409);
      }
    }

    const eventSettings = await eventSettingsRepository.findOne({ eventId });
    const capacity = form.settings.capacity ?? eventSettings?.maxCapacity;

    // Capacity Check
    if (capacity) {
      const currentCount = await registrationSubmissionRepository.countByEventId(eventId, { status: { $in: ["approved", "pending"] } });
      if (currentCount >= capacity && !form.settings.allowWaitlist) {
        throw new RegistrationError("Registration is full", 409);
      }
    }

    const isWaitlisted = capacity 
      ? (await registrationSubmissionRepository.countByEventId(eventId, { status: { $in: ["approved", "pending"] } })) >= capacity 
      : false;

    // Duplicate Check logic would go here (e.g. check duplicate email in submissions)
    
    // Status determination
    let initialStatus: "pending" | "approved" | "waitlisted" = "pending";
    if (isWaitlisted) {
      initialStatus = "waitlisted";
    } else if (form.settings.autoApprove) {
      initialStatus = "approved";
    }

    const submission: Omit<RegistrationSubmission, "_id"> = {
      workspaceId: event.workspaceId,
      eventId,
      formId: form._id as string,
      status: initialStatus,
      answers,
      deviceMetadata,
      submittedAt: new Date()
    };

    const created = await registrationSubmissionRepository.create(submission);

    await AuditService.log(
      "system",
      "REGISTRATION_SUBMITTED",
      { eventId, submissionId: created._id },
      event.workspaceId
    );

    const guestName = `${answers.firstName || ""} ${answers.lastName || ""}`.trim() || (answers.name as string) || (answers.email as string) || "Attendee";
    await EventNotificationService.createNotification({
      eventId,
      workspaceId: event.workspaceId,
      type: "registration",
      title: "New Attendee Registered",
      message: `${guestName} registered for ${event.name}`,
      details: {
        submissionId: created._id,
        status: initialStatus,
        email: answers.email,
        name: guestName,
      },
    });

    await RealtimeService.notifyRegistrationSubmitted(eventId, created);

    // Automation Pipeline
    if (initialStatus === "approved") {
      await this.processApproval(event.workspaceId, eventId, created._id as string, form, created, "system");
    }

    return created;
  }

  /**
   * Approve a pending submission and trigger Guest Provisioning pipeline
   */
  static async approveSubmission(
    workspaceId: string,
    eventId: string,
    submissionId: string,
    actorId: string
  ): Promise<void> {
    return withTransaction(async () => {
      await lockEvent(eventId);
      await this.approve(workspaceId, eventId, submissionId, actorId);
    });
  }

  private static async approve(workspaceId: string, eventId: string, submissionId: string, actorId: string): Promise<void> {
    const submission = await registrationSubmissionRepository.findById(submissionId);
    if (!submission) throw new Error("Submission not found");
    if (submission.workspaceId !== workspaceId || submission.eventId !== eventId) throw new Error("Submission not found for this event");
    if (submission.status === "approved") return; // Idempotent

    const form = await registrationFormRepository.findByEventId(eventId);
    if (!form) throw new Error("Form not found");
    const settings = await eventSettingsRepository.findOne({ eventId });
    const capacity = form.settings.capacity ?? settings?.maxCapacity;
    if (capacity && submission.status !== "pending") {
      const occupied = await registrationSubmissionRepository.countByEventId(eventId, { status: { $in: ["approved", "pending"] } });
      if (occupied >= capacity) throw new RegistrationError("Registration is full", 409);
    }

    await registrationSubmissionRepository.update(submissionId, {
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: actorId
    });

    await AuditService.log(
      actorId,
      "REGISTRATION_APPROVED",
      { eventId, submissionId },
      workspaceId
    );

    await this.processApproval(workspaceId, eventId, submissionId, form, submission, actorId);
  }

  /**
   * Internal pipeline to create Guest and QR code upon approval
   */
  private static async processApproval(
    workspaceId: string,
    eventId: string,
    submissionId: string,
    form: { settings: { createGuest?: boolean; generateQR?: boolean }; fields: Array<{ id: string; label: string; type: string }> },
    submission: RegistrationSubmission,
    actorId: string
  ) {
    if (!form.settings.createGuest) return;
    if (submission.guestId) {
      await GuestService.approveGuest(workspaceId, eventId, actorId, submission.guestId, !!form.settings.generateQR);
      await this.emailBadge(workspaceId, eventId, submission.guestId, !!form.settings.generateQR);
      return;
    }

    // Map answers to Guest model
    // In a real app, form fields would have mapped semantic tags (e.g. isEmail, isFirstName)
    // For now, we best-effort map based on typical field labels or types from answers
    let email = "", firstName = "Guest", lastName = "", phone = "", organization = "", title = "";
    
    for (const field of form.fields) {
      const answer = submission.answers[field.id];
      if (typeof answer !== "string" || !answer.trim()) continue;
      
      const label = field.label.toLowerCase();
      if (field.type === "email" || label.includes("email")) email = answer;
      else if (field.type === "phone" || label.includes("phone") || label.includes("mobile")) phone = answer;
      else if (label.includes("first")) firstName = answer;
      else if (label.includes("last")) lastName = answer;
      else if (label.includes("name")) firstName = answer;
      else if (label.includes("org") || label.includes("company")) organization = answer;
      else if (label.includes("role") || label.includes("title") || label.includes("job") || label.includes("position") || label.includes("designation")) title = answer;
    }

    // Direct key fallback for custom form payloads
    for (const [key, val] of Object.entries(submission.answers || {})) {
      if (!val || typeof val !== "string") continue;
      const strVal = val.trim();
      if (!strVal) continue;
      
      const lowerKey = key.toLowerCase();
      if (!phone && (lowerKey.includes("phone") || lowerKey.includes("mobile") || lowerKey.includes("contact") || lowerKey.includes("tel"))) phone = strVal;
      else if (!title && (lowerKey.includes("role") || lowerKey.includes("title") || lowerKey.includes("job") || lowerKey.includes("position") || lowerKey.includes("designation"))) title = strVal;
      else if (!organization && (lowerKey.includes("company") || lowerKey.includes("org") || lowerKey.includes("organization") || lowerKey.includes("business") || lowerKey.includes("corp") || lowerKey.includes("work"))) organization = strVal;
      else if (!email && lowerKey.includes("email")) email = strVal;
    }

    const guest = await GuestService.createGuest(workspaceId, eventId, actorId, {
      firstName,
      lastName,
      email,
      phone,
      organization,
      title,
      customData: submission.answers,
      status: "approved"
    });

    // Link guest back to submission
    await registrationSubmissionRepository.update(submissionId, { guestId: guest._id as string });

    // Generate QR if enabled
    if (form.settings.generateQR) {
      await GuestService.approveGuest(workspaceId, eventId, actorId, guest._id as string, true);
      await this.emailBadge(workspaceId, eventId, guest._id as string, true);
    }
  }

  // This outbox write shares the registration transaction: a retry cannot
  // create another guest, QR, or email job. Delivery happens after commit.
  private static async emailBadge(workspaceId: string, eventId: string, guestId: string, generateQR: boolean) {
    if (!generateQR) return;
    const guest = await guestRepository.findById(guestId);
    const event = await eventRepository.findById(eventId);
    if (!guest?.email || !guest.qrCodeId || !event) return;
    await EmailService.sendGuestBadge(workspaceId, event, guest.email,
      `${guest.firstName} ${guest.lastName}`.trim(), JSON.stringify({ guestId }));
  }

  static async rejectSubmission(workspaceId:string,eventId:string,submissionId:string,actorId:string):Promise<void> {
    return this.changeReview(workspaceId,eventId,submissionId,actorId,"rejected");
  }
  static async waitlistSubmission(workspaceId:string,eventId:string,submissionId:string,actorId:string):Promise<void> {
    return this.changeReview(workspaceId,eventId,submissionId,actorId,"waitlisted");
  }
  private static async changeReview(workspaceId:string,eventId:string,submissionId:string,actorId:string,status:"rejected"|"waitlisted") {
    await withTransaction(async()=>{
      await lockEvent(eventId);
      const submission=await registrationSubmissionRepository.findById(submissionId);
      if(!submission || submission.workspaceId!==workspaceId || submission.eventId!==eventId)throw new Error("Submission not found for this event");
      if(submission.guestId){
        const guest=await guestRepository.findById(submission.guestId);
        if(!guest || guest.workspaceId!==workspaceId || guest.eventId!==eventId)throw new Error("Linked guest not found for this event");
        if(guest.status==="checked_in")throw new RegistrationError("Check the guest out before changing admission status",409);
        await guestRepository.update(submission.guestId,{status:"pending"});
      }
      await registrationSubmissionRepository.update(submissionId,{status,reviewedAt:new Date(),reviewedBy:actorId});
      await AuditService.log(actorId,status==="rejected"?"REGISTRATION_REJECTED":"REGISTRATION_WAITLISTED",{eventId,submissionId},workspaceId);
      await RealtimeService.broadcast(`event_${eventId}`,"registration_reviewed",{submissionId,status});
    });
  }
}
