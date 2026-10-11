import { ObjectId } from "mongodb";
import { collection, withTransaction } from "@/infrastructure/transaction";
const eventCollections = ["event_settings","scanner_settings","registration_settings","branding_settings","qr_configurations","guest_configurations","notification_settings","registration_forms","registration_submissions","guests","guest_groups","qr_codes","qr_versions","qr_downloads","qr_batches","scan_records","offline_receipts","qr_scans","qr_analytics","event_notifications"];
export class DataLifecycleService {
  static async removeEvent(workspaceId: string, eventId: string) {
    return withTransaction(async () => {
      for (const name of eventCollections) await (await collection(name)).deleteMany({workspaceId,eventId});
      await (await collection("jobs")).deleteMany({workspaceId,eventId});
      await (await collection("realtime_events")).deleteMany({channel:`event_${eventId}`});
      await (await collection("events")).deleteOne({_id:new ObjectId(eventId),workspaceId});
    });
  }
  static async removeWorkspace(workspaceId: string) {
    return withTransaction(async () => {
      const events = await (await collection("events")).find({workspaceId}).toArray();
      for (const event of events) await this.removeEvent(workspaceId,event._id.toString());
      for (const name of [...eventCollections,"memberships","workspace_invites","workspace_settings","api_keys","webhooks","qr_templates","event_templates","stored_files"]) await (await collection(name)).deleteMany({workspaceId});
      await (await collection("jobs")).deleteMany({workspaceId});
      await (await collection("realtime_events")).deleteMany({channel:`workspace_${workspaceId}`});
      await (await collection("users")).updateMany({lastActiveWorkspaceId:workspaceId},{$unset:{lastActiveWorkspaceId:""}});
      await (await collection("workspaces")).deleteOne({_id:new ObjectId(workspaceId)});
    });
  }
}
