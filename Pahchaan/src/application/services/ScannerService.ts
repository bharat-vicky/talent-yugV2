import {collection} from "@/infrastructure/transaction";
import { guestRepository } from "@/infrastructure/repositories/GuestRepository";
import { GuestService } from "./GuestService";

export interface ScanResult {
  success: boolean;
  status: "success" | "duplicate" | "warning" | "invalid" | "offline_queued";
  guest?: unknown; // Will type as GuestDocument on UI
  reason?: string;
}

export class ScannerService {
  /**
   * Validates and processes a scan payload (QR Code) or a manual check-in
   */
  static async processScan(
    workspaceId: string,
    eventId: string,
    actorId: string, // Scanner Operator
    payload: {
      qrData?: string;
      guestId?: string; // For manual check-in
    },
    direction: "in" | "out" = "in",
    location?: string,
    device: string = "Mobile Scanner"
  ): Promise<ScanResult> {
    if (direction !== "in" && direction !== "out") {
      return { success: false, status: "invalid", reason: "Invalid scan direction" };
    }

    // 1. Resolve ID
    let extractedId = payload.guestId;

    if (!extractedId && payload.qrData) {
      try {
        const parsed = JSON.parse(payload.qrData);
        extractedId = parsed.guestId || parsed.g || parsed.id;
      } catch {
        try {
          const url = new URL(payload.qrData);
          extractedId = url.searchParams.get("guestId") || url.searchParams.get("g") || url.searchParams.get("id") || undefined;
          if (!extractedId) {
            const match = url.pathname.match(/\/q\/([a-zA-Z0-9_-]+)/);
            if (match) {
              extractedId = match[1];
            }
          }
        } catch {
          // If it's not JSON and not a URL, assume the raw string itself might be the guestId
          extractedId = payload.qrData;
        }
      }
    }

    if (!extractedId) {
      return { success: false, status: "invalid", reason: `Invalid QR: Could not extract Guest ID from: ${payload.qrData}` };
    }

    let guest = await guestRepository.findById(extractedId);

    // If guest not found by ID, the extracted ID might be a QR shortId or Mongo _id
    if (!guest) {
      const { qrCodeRepository } = await import("@/infrastructure/repositories/QRRepositories");
      let qrCode = null;
      try {
        qrCode = await qrCodeRepository.findById(extractedId);
      } catch {}

      if (!qrCode) {
        qrCode = await qrCodeRepository.findOne({ shortId: extractedId, workspaceId, eventId });
      }

      if (!qrCode) {
        return { success: false, status: "invalid", reason: "Invalid Ticket: Not found in system" };
      }
      if (qrCode.workspaceId !== workspaceId || qrCode.eventId !== eventId) {
        return { success: false, status: "invalid", reason: "Ticket not found for this event" };
      }

      // We found a QR code! Let's check if it's assigned to any guest
      const assignedGuest = await guestRepository.findOne({ qrCodeId: qrCode._id!.toString(), eventId, workspaceId });

      if (assignedGuest) {
        // This QR code belongs to a guest, so use this guest!
        guest = assignedGuest;
      } else {
        // Unassigned Bulk Ticket logic
        if (String(qrCode.status) !== "published" && qrCode.status !== "active") {
          return { success: false, status: "invalid", reason: `Ticket status is ${qrCode.status}` };
        }

        const safeId = qrCode._id?.toString() || qrCode.shortId;
        const { ObjectId } = await import("mongodb");
        const client = await (await import("@/infrastructure/db")).default();
        const accepted = await (await collection("qr_codes")).updateOne(
          { _id: new ObjectId(safeId), workspaceId, eventId, status: { $in: ["active", "published"] }, admissionState: direction === "in" ? { $ne: "in" } : "in" },
          { $set: { admissionState: direction, lastAdmissionAt: new Date(), lastOperatorId: actorId } }
        );
        if (!accepted.modifiedCount) return { success: false, status: "duplicate", reason: "Ticket has already been processed in this direction" };

        // Log scan metrics
        await ScannerService.logScanMetrics(safeId, eventId, workspaceId);

        return {
          success: true,
          status: "success",
          guest: { firstName: qrCode.name || "Valid Ticket", lastName: "(Unassigned)" }
        };
      }
    }

    // Now we definitely have a guest object
    const finalGuestId = guest._id!.toString();

    if (guest.eventId !== eventId || guest.workspaceId !== workspaceId) {
      return { success: false, status: "invalid", reason: "Guest not found for this event" };
    }

    // 2. Business Validation
    if (!["approved", "checked_in", "checked_out"].includes(guest.status)) {
      return {
        success: false,
        status: "invalid",
        reason: `Access Denied: Ticket is ${guest.status}.`,
        guest
      };
    }

    // Check for duplicate entry
    if (direction === "in" && guest.status === "checked_in") {
      const lastCheckIn = guest.checkIns?.slice().reverse().find(c => c.direction === "in");
      const timeStr = lastCheckIn?.timestamp ? new Date(lastCheckIn.timestamp).toLocaleTimeString() : "earlier";
      return {
        success: false,
        status: "duplicate",
        reason: `Duplicate Scan: Attendee already checked in at ${timeStr}.`,
        guest
      };
    }

    // 3. Execute Check In via GuestService (which logs Audit and Realtime)
    try {
      const accepted = await GuestService.checkInGuest(workspaceId, eventId, actorId, finalGuestId, {
        direction,
        method: payload.guestId ? "manual" : "qr_scan",
        location,
        status: "success",
        operatorId: actorId
      });
      if (!accepted) {
        return { success: false, status: "duplicate", reason: "Ticket has already been processed in this direction.", guest };
      }
      await ScannerService.logScanMetrics(guest.qrCodeId || finalGuestId, eventId, workspaceId, device);

      // Fetch fresh guest to return
      const updatedGuest = await guestRepository.findById(finalGuestId);

      return {
        success: true,
        status: "success",
        guest: updatedGuest
      };
    } catch (e: unknown) {
      return {
        success: false,
        status: "warning",
        reason: `Failed to record check-in: ${(e as Error).message || String(e)}`,
        guest
      };
    }
  }

  /**
   * Helper to update QR Code scan counts and time-series analytics
   */
  private static async logScanMetrics(qrId: string, eventId: string, workspaceId: string, device: string = "Mobile Scanner") {
    try {
      const client = await (await import("@/infrastructure/db")).default();

      // Update the aggregate analytics (for "Total Scans (All Time)")
      await (await collection("qr_analytics")).updateOne(
        { qrId, eventId, workspaceId },
        { $inc: { totalScans: 1 } },
        { upsert: true }
      );

      // Update the QR document itself (for "Scan Count")
      const { qrCodeRepository } = await import("@/infrastructure/repositories/QRRepositories");
      // Find the document either by ID or shortId
      let qrCode = null;
      try {
        qrCode = await qrCodeRepository.findById(qrId);
      } catch {}

      if (!qrCode) {
        qrCode = await qrCodeRepository.findOne({ shortId: qrId, workspaceId, eventId });
      }

      if (qrCode && qrCode._id) {
        const { ObjectId } = await import("mongodb");
        await (await collection("qr_codes")).updateOne({ _id: new ObjectId(qrCode._id.toString()), workspaceId, eventId }, { $inc: { scanCount: 1 }, $set: { updatedAt: new Date() } });
      }

      // Log to qr_scans for time-series charts (Scan Volume Over Time)
      await (await collection("qr_scans")).insertOne({
        qrId,
        eventId,
        workspaceId,
        device: device || "Mobile Scanner",
        createdAt: new Date()
      });
    } catch (e) {
      console.error("Failed to log scan metrics:", e);
    }
  }
}
