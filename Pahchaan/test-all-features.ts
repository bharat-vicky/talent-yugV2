import getMongoClient from "./src/infrastructure/db";
import { userRepository } from "./src/infrastructure/repositories/UserRepository";
import { membershipRepository } from "./src/infrastructure/repositories/MembershipRepository";
import { registrationFormRepository } from "./src/infrastructure/repositories/RegistrationFormRepository";
import { guestRepository } from "./src/infrastructure/repositories/GuestRepository";
import { WorkspaceService } from "./src/application/services/WorkspaceService";
import { EventService } from "./src/application/services/EventService";
import { GuestService } from "./src/application/services/GuestService";
import { QRService } from "./src/application/services/QRService";
import { ScannerService } from "./src/application/services/ScannerService";
import { AnalyticsService } from "./src/application/services/AnalyticsService";
import { getActiveWorkspaceData } from "./src/lib/workspace";
import { FormField, Membership } from "./src/domain/types";

async function main() {
  // This upstream script deletes fixtures and writes data; refuse normal databases.
  const testDatabase = new URL(process.env.MONGODB_URI || "mongodb://localhost/invalid").pathname.slice(1);
  if (!testDatabase.startsWith("identity_test_") || !process.env.TEST_BASE_URL) {
    console.error("Use an isolated identity_test_* database and set TEST_BASE_URL. Prefer npm test for managed isolation.");
    process.exitCode = 1;
    return;
  }
  console.log("==================================================");
  console.log(" STARTING FULL PLATFORM END-TO-END FEATURE AUDIT ");
  console.log("==================================================\n");

  const results: { feature: string; status: "PASS" | "FAIL"; details?: string }[] = [];

  function record(feature: string, success: boolean, details?: string) {
    results.push({ feature, status: success ? "PASS" : "FAIL", details });
    console.log(`${success ? "✅ PASS" : "❌ FAIL"}: ${feature} ${details ? `(${details})` : ""}`);
  }

  try {
    // 1. DATABASE & MONGO CONNECTION
    const client = await getMongoClient();
    const db = client.db();
    const ping = await db.command({ ping: 1 });
    record("1. Database Connection", !!ping.ok, "MongoDB responding");

    // 2. USER AUTHENTICATION & CANONICAL USER ID
    const testEmail = "testuser@enterprise.com";
    await db.collection("users").deleteMany({ email: { $regex: new RegExp(`^${testEmail}$`, "i") } });
    
    // Create User
    const user = await userRepository.create({
      name: "Enterprise Admin",
      email: testEmail.toLowerCase(),
    });
    const userId = user._id as string;
    record("2. User Account Creation", !!userId, `User ID: ${userId}`);

    // 3. WORKSPACE LIFECYCLE
    const wsSlug = `test-org-${Date.now()}`;
    const workspace = await WorkspaceService.createWorkspace(
      userId,
      "Enterprise Tech Corp",
      wsSlug,
      "America/New_York"
    );
    const workspaceId = workspace._id as string;
    record("3. Workspace Creation", !!workspaceId, `Workspace: ${workspace.name} (${workspaceId})`);

    // Verify Owner Membership
    const memberships = await membershipRepository.findByUserId(userId);
    const isOwner = memberships.some((m: Membership) => m.workspaceId === workspaceId && m.role === "owner");
    record("4. Workspace RBAC Membership", isOwner, "Owner role assigned");

    // Verify Active Workspace Resolution (Cross-Device Sync Logic)
    const activeData = await getActiveWorkspaceData(userId);
    const resolvedMatches = activeData.activeWorkspace?._id === workspaceId;
    record("5. Active Workspace Resolution", resolvedMatches, `Active: ${activeData.activeWorkspace?.name}`);

    // 4. EVENT LIFECYCLE
    const eventSlug = `flagship-summit-${Date.now()}`;
    const startDate = new Date(Date.now() + 86400000);
    const endDate = new Date(Date.now() + 172800000);
    
    const event = await EventService.createEvent(
      userId,
      workspaceId,
      "Global Innovation Summit 2026",
      eventSlug,
      endDate,
      startDate,
      "Metropolitan Convention Center",
      "Annual flagship technology conference",
      undefined,
      1000,
      "Technology & Innovation"
    );
    const eventId = event._id as string;
    record("6. Event Creation", !!eventId, `Event ID: ${eventId}, Slug: ${event.slug}`);

    // Publish Event
    const publishedEvent = await EventService.updateStatus(userId, workspaceId, eventId, "published");
    record("7. Event Publishing", publishedEvent?.status === "published", `Status: ${publishedEvent?.status}`);

    // Duplicate Event
    const dupSlug = `${eventSlug}-copy`;
    const duplicatedEvent = await EventService.duplicateEvent(
      userId,
      workspaceId,
      eventId,
      "Global Innovation Summit 2026 (Copy)",
      dupSlug,
      startDate
    );
    record("8. Event Duplication", !!duplicatedEvent._id, `Duplicate ID: ${duplicatedEvent._id}`);

    // Query Events with Pagination & Filter
    const eventList = await EventService.getEvents(userId, workspaceId, { search: "Global", limit: 10 });
    record("9. Event Search & Listing", eventList.events.length >= 2, `Found ${eventList.events.length} events`);

    // 5. REGISTRATION FORM & PUBLIC SUBMISSION FLOW
    const form = await registrationFormRepository.getOrCreateForEvent(workspaceId, eventId);
    record("10. Registration Form Auto-Provisioning", !!form._id, `Form ID: ${form._id}, ${form.fields.length} default fields`);

    // Simulate Public API GET /api/r/[slug]
    const publicUrl = `${process.env.TEST_BASE_URL}/api/r/${event.uniqueSlug || event.slug}`;
    const publicRes = await fetch(publicUrl);
    const publicData = await publicRes.json();
    record("11. Public Registration Route (GET /api/r/[slug])", publicRes.ok && !!publicData.form, `Status ${publicRes.status}`);

    // Simulate Public Registration Form Submission (POST /api/r/[slug])
    const answers: Record<string, unknown> = {};
    const firstNameField = form.fields.find((f: FormField) => f.label.toLowerCase().includes("first"));
    const lastNameField = form.fields.find((f: FormField) => f.label.toLowerCase().includes("last"));
    const emailField = form.fields.find((f: FormField) => f.label.toLowerCase().includes("email"));
    
    if (firstNameField) answers[firstNameField.id] = "Alice";
    if (lastNameField) answers[lastNameField.id] = "Smith";
    if (emailField) answers[emailField.id] = "alice.smith@partner.com";

    const submitRes = await fetch(publicUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers })
    });
    const submitJson = await submitRes.json();
    record("12. Attendee Registration Submission (POST)", submitRes.ok && submitJson.success, `Result: ${submitJson.status}`);

    // 6. GUEST CRM & QR CODE ENGINE
    // Create Guest directly via GuestService
    const guest = await GuestService.createGuest(workspaceId, eventId, userId, {
      firstName: "David",
      lastName: "Miller",
      email: "david.miller@acme.com",
      status: "approved",
      notes: "VIP All-Access"
    });
    const guestId = guest._id as string;
    record("13. Guest CRM Creation", !!guestId, `Guest: ${guest.firstName} ${guest.lastName}`);

    // Generate QR Code for Guest
    const qrPayload = `https://identity.com/scan?guestId=${guestId}&eventId=${eventId}`;
    const qrCode = await QRService.createQR(
      userId,
      workspaceId,
      eventId,
      `Badge: David Miller`,
      {
        dotsOptions: { type: "square", color: "#111827" },
        backgroundOptions: { color: "#ffffff" },
      },
      true,
      qrPayload
    );
    const qrId = qrCode._id as string;
    record("14. Enterprise QR Studio Generation", !!qrId, `QR Code ID: ${qrId}`);

    // Attach QR to Guest
    await guestRepository.update(guestId, { qrCodeId: qrId });
    const updatedGuest = await guestRepository.findById(guestId);
    record("15. Guest Badge Association", updatedGuest?.qrCodeId === qrId, "QR ID successfully linked");

    // 7. LIVE QR SCANNING & CHECK-IN
    const scanResult = await ScannerService.processScan(
      workspaceId,
      eventId,
      userId,
      { guestId, qrData: qrCode.destinationUrl },
      "in",
      "Main Entrance Gate A",
      "Mobile Terminal"
    );
    record("16. Live QR Scanner Check-in", scanResult.success && scanResult.status === "success", `Status: ${scanResult.status}`);

    // Test Duplicate Scan Protection
    const duplicateScan = await ScannerService.processScan(
      workspaceId,
      eventId,
      userId,
      { guestId, qrData: qrCode.destinationUrl },
      "in",
      "Main Entrance Gate A",
      "Mobile Terminal"
    );
    record("17. Duplicate Scan Detection", duplicateScan.status === "duplicate", `Detected: ${duplicateScan.status}`);

    // 8. REAL-TIME ANALYTICS & KPIS
    const kpis = await AnalyticsService.getEventKPIs(eventId);
    record("18. Real-time KPI Dashboard", typeof kpis.totalGuests === "number" && kpis.checkedInGuests >= 1, `Checked In: ${kpis.checkedInGuests}/${kpis.totalGuests}`);

    const timeline = await AnalyticsService.getAttendanceTimeline(eventId);
    record("19. Timeline Traffic Aggregation", Array.isArray(timeline), `Data points: ${timeline.length}`);

    const funnel = await AnalyticsService.getRegistrationFunnel(eventId);
    record("20. Registration Funnel Analytics", Array.isArray(funnel), `Funnel steps: ${funnel.length}`);

    const scannerMetrics = await AnalyticsService.getScannerMetrics(eventId);
    record("21. Scanner Operator Performance", Array.isArray(scannerMetrics), `Operators: ${scannerMetrics.length}`);

    // 9. SECURITY & AUDIT LOGGING
    const auditLogs = await db.collection("audit_logs").find({ workspaceId }).toArray();
    record("22. Security & Audit Logging", auditLogs.length >= 3, `${auditLogs.length} audit trail events logged`);

    console.log("\n==================================================");
    console.log(" AUDIT SUMMARY ");
    console.log("==================================================");
    const passCount = results.filter(r => r.status === "PASS").length;
    console.log(`Total Features Tested: ${results.length}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${results.length - passCount}`);
    if (passCount !== 22) process.exitCode = 1;
    console.log("==================================================\n");

  } catch (err) {
    console.error("FATAL ERROR IN TEST SUITE:", err);
    process.exitCode = 1;
  } finally {
    const client = await getMongoClient().catch(() => null);
    await client?.close();
  }
}

main();
