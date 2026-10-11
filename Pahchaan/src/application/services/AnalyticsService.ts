import getMongoClient from "@/infrastructure/db";

export class AnalyticsService {

  /**
   * Generates high-level KPIs for the Overview Dashboard.
   */
  static async getEventKPIs(eventId: string) {
    const client = await getMongoClient();
    const db = client.db();

    // Total Registrations
    const totalRegistrations = await db.collection("registration_submissions").countDocuments({ eventId });
    const approvedRegistrations = await db.collection("registration_submissions").countDocuments({ eventId, status: "approved" });

    // Total Guests
    const totalGuests = await db.collection("guests").countDocuments({ eventId, status: { $ne: "archived" } });

    // Total Check-ins
    // We count guests who have checkIns > 0 (or specifically 'in' direction)
    const checkedInGuests = await db.collection("guests").countDocuments({
      eventId,
      status: "checked_in"
    });

    // Total QR Scans
    const totalScansAgg = await db.collection("qr_codes").aggregate([
      { $match: { eventId } },
      { $group: { _id: null, total: { $sum: "$scanCount" } } }
    ]).toArray();
    const totalScans = totalScansAgg[0]?.total || 0;

    return {
      totalRegistrations,
      approvedRegistrations,
      totalGuests,
      checkedInGuests,
      attendanceRate: totalGuests > 0 ? (checkedInGuests / totalGuests) * 100 : 0,
      totalScans
    };
  }

  /**
   * Generates a time-series aggregation of Check-ins per hour.
   */
  static async getAttendanceTimeline(eventId: string) {
    const client = await getMongoClient();
    const db = client.db();

    // In a production system we might use $dateTrunc or a specific time-bucket approach.
    // For simplicity, we unwind checkIns and group by an hourly format.
    const pipeline = [
      { $match: { eventId } },
      { $unwind: "$checkIns" },
      { $match: { "checkIns.direction": "in", "checkIns.status": "success" } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%dT%H:%M:00Z", date: "$checkIns.timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ];

    const results = await db.collection("guests").aggregate(pipeline).toArray();

    return results.map(r => ({
      name: r._id,
      value: r.count
    }));
  }

  /**
   * Generates the Registration Funnel stats.
   */
  static async getRegistrationFunnel(eventId: string) {
    const client = await getMongoClient();
    const db = client.db();

    const pipeline = [
      { $match: { eventId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ];

    const results = await db.collection("registration_submissions").aggregate(pipeline).toArray();

    // Format into funnel steps
    const funnelMap: Record<string, number> = { pending: 0, approved: 0, rejected: 0, waitlisted: 0 };
    results.forEach(r => { funnelMap[r._id] = r.count; });

    const totalSubmissions = Object.values(funnelMap).reduce((a, b) => a + b, 0);

    return [
      { name: "Submissions", value: totalSubmissions },
      { name: "Approved", value: funnelMap.approved },
      { name: "Waitlisted", value: funnelMap.waitlisted },
      { name: "Rejected", value: funnelMap.rejected }
    ];
  }

  /**
   * Generates Scanner performance metrics based on Audit Logs.
   */
  static async getScannerMetrics(eventId: string) {
    const client = await getMongoClient();
    const db = client.db();

    const pipeline = [
      { $match: { "details.eventId": eventId, action: "GUEST_CHECKED_IN" } },
      {
        $group: {
          _id: "$userId", // Operator
          scans: { $sum: 1 }
        }
      },
      { $sort: { scans: -1 } },
      { $limit: 10 }
    ];

    const results = await db.collection("audit_logs").aggregate(pipeline).toArray();

    // Try to fetch operator names if possible
    // Here we just return operator IDs and their scan counts
    return results.map(r => ({
      name: r._id, // Ideally mapped to user name
      value: r.scans
    }));
  }

  /**
   * Generates KPIs specifically for the QR Studio Overview.
   */
  static async getQRKPIs(eventId: string) {
    const client = await getMongoClient();
    const db = client.db();

    const qrCodes = await db.collection("qr_codes").find({ eventId }).toArray();
    const totalGuestsWithQR = await db.collection("guests").countDocuments({ eventId, qrCodeId: { $exists: true, $ne: "" } });
    const totalGuests = await db.collection("guests").countDocuments({ eventId, status: { $ne: "archived" } });

    const totalQRs = Math.max(qrCodes.length, totalGuestsWithQR, totalGuests > 0 ? 1 : 0);
    const activeQRs = Math.max(
      qrCodes.filter(q => q.status === "active" || q.status === "published").length,
      totalGuests
    );
    const archivedQRs = qrCodes.filter(q => q.status === "archived").length;

    const qrSum = qrCodes.reduce((sum, q) => sum + (q.scanCount || 0), 0);
    const qrScansCount = await db.collection("qr_scans").countDocuments({ eventId });
    const guestCheckInsCount = (await db.collection("guests").aggregate([
      { $match: { eventId } },
      { $unwind: "$checkIns" },
      { $count: "total" }
    ]).toArray())[0]?.total || 0;

    const totalScans = Math.max(qrSum, qrScansCount, guestCheckInsCount);

    const templates = await db.collection("qr_templates").countDocuments({
      $or: [{ workspaceId: qrCodes[0]?.workspaceId }, { isSystem: true }]
    });

    const downloadsObj = await db.collection("qr_analytics").aggregate([
      { $match: { qrId: { $in: qrCodes.map(q => q._id.toString()) } } },
      { $group: { _id: null, totalDownloads: { $sum: "$totalDownloads" } } }
    ]).toArray();

    const uniqueScanned = await db.collection("guests").countDocuments({
      eventId,
      "checkIns.0": { $exists: true }
    });

    const verificationRate = totalGuests > 0 ? Math.min(100, Math.round((uniqueScanned / totalGuests) * 100)) : 0;

    // Fetch recent live verifications stream
    const recentGuestsWithCheckIns = await db.collection("guests")
      .find({ eventId, "checkIns.0": { $exists: true } })
      .sort({ "updatedAt": -1 })
      .limit(6)
      .toArray();

    const liveVerifications = recentGuestsWithCheckIns.map(g => {
      const lastCheckIn = g.checkIns?.[g.checkIns.length - 1];
      return {
        _id: g._id.toString(),
        name: `${g.firstName} ${g.lastName || ''}`.trim(),
        email: g.email || '',
        phone: g.phone || '',
        title: g.title || '',
        organization: g.organization || '',
        timestamp: lastCheckIn?.timestamp || g.updatedAt || new Date(),
        status: g.status || 'checked_in',
        direction: lastCheckIn?.direction || 'in'
      };
    });

    return {
      totalQRs,
      activeQRs,
      archivedQRs,
      totalScans,
      uniqueScanned,
      verificationRate,
      templates: typeof templates === "number" ? templates : 0,
      totalDownloads: downloadsObj[0]?.totalDownloads || 0,
      liveVerifications
    };
  }

  /**
   * Generates time-series data for QR scans.
   */
  static async getQRTimeSeries(eventId: string) {
    const client = await getMongoClient();
    const db = client.db();

    // Aggregation from qr_scans
    const qrScans = await db.collection("qr_scans").aggregate([
      { $match: { eventId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          scans: { $sum: 1 }
        }
      }
    ]).toArray();

    // Aggregation from guest checkIns
    const checkInScans = await db.collection("guests").aggregate([
      { $match: { eventId } },
      { $unwind: "$checkIns" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkIns.timestamp" } },
          scans: { $sum: 1 }
        }
      }
    ]).toArray();

    // Combine scan days
    const scanMap: Record<string, number> = {};
    qrScans.forEach(s => {
      scanMap[s._id] = (scanMap[s._id] || 0) + s.scans;
    });
    checkInScans.forEach(s => {
      if (!scanMap[s._id] || s.scans > scanMap[s._id]) {
        scanMap[s._id] = Math.max(scanMap[s._id] || 0, s.scans);
      }
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    if (Object.keys(scanMap).length === 0) {
      scanMap[todayStr] = 0;
    }

    const scans = Object.entries(scanMap)
      .map(([date, count]) => ({ _id: date, name: date, scans: count, value: count }))
      .sort((a, b) => a._id.localeCompare(b._id));

    // Devices aggregation
    const deviceAgg = await db.collection("qr_scans").aggregate([
      { $match: { eventId } },
      {
        $group: {
          _id: "$device",
          value: { $sum: 1 }
        }
      },
      { $sort: { value: -1 } }
    ]).toArray();

    const deviceMap: Record<string, number> = {};
    deviceAgg.forEach(d => {
      const name = d._id || "Scanner Terminal";
      deviceMap[name] = (deviceMap[name] || 0) + d.value;
    });

    const totalCheckIns = (await db.collection("guests").aggregate([
      { $match: { eventId } },
      { $unwind: "$checkIns" },
      { $count: "total" }
    ]).toArray())[0]?.total || 0;

    const totalScansInDevices = Object.values(deviceMap).reduce((a, b) => a + b, 0);
    if (totalCheckIns > totalScansInDevices) {
      const diff = totalCheckIns - totalScansInDevices;
      const primaryKey = Object.keys(deviceMap)[0] || "Scanner Terminal";
      deviceMap[primaryKey] = (deviceMap[primaryKey] || 0) + diff;
    }

    const devices = Object.entries(deviceMap).map(([name, val]) => ({
      _id: name,
      name,
      value: val
    }));

    return {
      scans,
      devices,
      scanData: scans,
      deviceData: devices
    };
  }
}
