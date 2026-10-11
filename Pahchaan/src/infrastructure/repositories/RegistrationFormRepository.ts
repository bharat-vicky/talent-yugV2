import { MongoRepository } from "./MongoRepository";
import { RegistrationForm } from "@/domain/types";
import { ObjectId } from "mongodb";

class RegistrationFormRepositoryImpl extends MongoRepository<RegistrationForm> {
  constructor() {
    super("registration_forms");
  }

  async findByEventId(eventId: string): Promise<RegistrationForm | null> {
    return this.findOne({ eventId });
  }

  // Find or create default form
  async getOrCreateForEvent(workspaceId: string, eventId: string): Promise<RegistrationForm> {
    const existing = await this.findByEventId(eventId);
    if (existing) return existing;

    const defaultForm: Omit<RegistrationForm, "_id"> = {
      workspaceId,
      eventId,
      fields: [
        {
          id: "field_" + new ObjectId().toString(),
          type: "text",
          label: "First Name",
          required: true,
          hidden: false,
          readOnly: false,
          width: "half"
        },
        {
          id: "field_" + new ObjectId().toString(),
          type: "text",
          label: "Last Name",
          required: true,
          hidden: false,
          readOnly: false,
          width: "half"
        },
        {
          id: "field_" + new ObjectId().toString(),
          type: "email",
          label: "Email Address",
          required: true,
          hidden: false,
          readOnly: false,
          width: "full"
        },
        {
          id: "field_" + new ObjectId().toString(),
          type: "phone",
          label: "Phone Number",
          required: false,
          hidden: false,
          readOnly: false,
          width: "full"
        },
        {
          id: "field_" + new ObjectId().toString(),
          type: "text",
          label: "Role/Title",
          required: false,
          hidden: false,
          readOnly: false,
          width: "half"
        },
        {
          id: "field_" + new ObjectId().toString(),
          type: "text",
          label: "Company",
          required: false,
          hidden: false,
          readOnly: false,
          width: "half"
        }
      ],
      settings: {
        allowWaitlist: false,
        autoApprove: true,
        duplicateEmailPolicy: "reject",
        duplicatePhonePolicy: "allow",
        generateQR: true,
        createGuest: true
      },
      branding: {
        primaryColor: "#184b3f",
        showEventDescription: true,
        showDateLocation: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const doc = await this.create(defaultForm);
    return doc;
  }
}

export const registrationFormRepository = new RegistrationFormRepositoryImpl();
