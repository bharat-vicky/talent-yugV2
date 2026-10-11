import { MongoRepository } from "./MongoRepository";
import { RegistrationSubmission } from "@/domain/types";

class RegistrationSubmissionRepositoryImpl extends MongoRepository<RegistrationSubmission> {
  constructor() {
    super("registration_submissions");
  }

  async findByEventId(eventId: string, query: Record<string, unknown> = {}, pagination?: {skip:number; limit:number}): Promise<RegistrationSubmission[]> {
    const col = await this.getCollection();
    const cursor = col.find({eventId, ...query}).sort({submittedAt: -1, _id: -1});
    if (pagination) cursor.skip(pagination.skip).limit(pagination.limit);
    const results = await cursor.toArray();
    return results.map(r => ({ ...r, _id: r._id.toString() })) as unknown as RegistrationSubmission[];
  }

  async countByEventId(eventId: string, query: Record<string, unknown> = {}): Promise<number> {
    const col = await this.getCollection();
    return col.countDocuments({ eventId, ...query });
  }

  async findByFormId(formId: string): Promise<RegistrationSubmission[]> {
    const col = await this.getCollection();
    const results = await col.find({ formId }).sort({ submittedAt: -1 }).toArray();
    return results.map(r => ({ ...r, _id: r._id.toString() })) as unknown as RegistrationSubmission[];
  }
}

export const registrationSubmissionRepository = new RegistrationSubmissionRepositoryImpl();
