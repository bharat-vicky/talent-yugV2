/* eslint-disable @typescript-eslint/no-require-imports */
// Real repositories/services and route handlers, an ephemeral MongoDB, and
// injected sessions. No .env file is loaded and no production database is used.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const root = path.resolve(__dirname, "..");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request.startsWith("@/")) request = path.join(root, "src", request.slice(2));
  return resolve.call(this, request, ...args);
};
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(compiled.outputText, filename);
};
let session = null;
const load = Module._load;
Module._load = function (request, ...args) {
  const original = load.call(this, request, ...args);
  if (request === "next-auth") return { ...original, __esModule: true, getServerSession: async () => session };
  return original;
};
const results = [];
async function test(name, fn) {
  const start = performance.now();
  try {
    await fn();
    results.push({ name, status: "PASS", milliseconds: Math.round(performance.now() - start) });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, status: "FAIL", error: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}
function request(url, body, method = "POST") {
  return new Request(`http://localhost${url}`, { method, ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
}
function context(params) { return { params: Promise.resolve(params) }; }

async function main() {
  let mongo, client;
  try {
    const cached = path.join(root, "node_modules/.cache/mongodb-memory-server/mongod-x64-win32-8.2.6.exe");
    mongo = await MongoMemoryReplSet.create({
      binary: fs.existsSync(cached) ? { systemBinary: cached, version: "8.2.6" } : {},
      replSet: { count: 1, storageEngine: "wiredTiger" },
    });
    process.env.MONGODB_URI = mongo.getUri(`identity_test_${Date.now()}`);
    process.env.AUTH_SECRET = "isolated-test-secret-never-used-in-production";
    process.env.NODE_ENV = "test";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.SMTP_HOST;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM;
    delete process.env.JOB_ENCRYPTION_KEY;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    const from = file => require(path.join(root, "src", file));
    client = await from("infrastructure/db.ts").default();
    const db = client.db();
    const { authOptions } = from("lib/auth.ts");
    const credentials = authOptions.providers.find(p => p.id === "credentials").options.authorize;
    const { exactEmailPattern } = from("lib/email.ts");
    const { WorkspaceService } = from("application/services/WorkspaceService.ts");
    const { EventService } = from("application/services/EventService.ts");
    const { GuestService } = from("application/services/GuestService.ts");
    const { ScannerService } = from("application/services/ScannerService.ts");
    const { QRService } = from("application/services/QRService.ts");
    const { RegistrationService } = from("application/services/RegistrationService.ts");
    const { AnalyticsService } = from("application/services/AnalyticsService.ts");
    const { RBACService } = from("application/services/RBACService.ts");
    const { ApiKeyService } = from("application/services/ApiKeyService.ts");
    const { WebhookService } = from("application/services/WebhookService.ts");
    const { getActiveWorkspaceData } = from("lib/workspace.ts");
    const { userRepository } = from("infrastructure/repositories/UserRepository.ts");
    const { membershipRepository } = from("infrastructure/repositories/MembershipRepository.ts");
    const { eventRepository } = from("infrastructure/repositories/EventRepository.ts");
    const { guestRepository } = from("infrastructure/repositories/GuestRepository.ts");
    const { qrCodeRepository } = from("infrastructure/repositories/QRRepositories.ts");
    const { registrationFormRepository } = from("infrastructure/repositories/RegistrationFormRepository.ts");
    const { registrationSubmissionRepository } = from("infrastructure/repositories/RegistrationSubmissionRepository.ts");
    const { inviteRepository } = from("infrastructure/repositories/InviteRepository.ts");
    const { apiKeyRepository } = from("infrastructure/repositories/ApiKeyRepository.ts");
    const eventRoute = from("app/api/events/[eventId]/route.ts");
    const guestRoute = from("app/api/events/[eventId]/guests/[guestId]/route.ts");
    const workspaceRoute = from("app/api/workspaces/active/route.ts");
    const publicRoute = from("app/api/r/[...slug]/route.ts");
    const memberRoute = from("app/api/workspaces/[id]/members/[memberId]/route.ts");

    await test("Database ping", async () => assert.equal((await db.command({ ping: 1 })).ok, 1));
    await test("Email lookup escapes regex metacharacters", () => {
      const pattern = exactEmailPattern(" Jane+tag@Example.com ");
      assert(pattern.test("jane+tag@example.com"));
      assert(!pattern.test("janetag@exampleXcom"));
    });
    await test("Login cannot create an unknown account", async () => assert.equal(await credentials({ email: "unknown@example.com", password: "anything" }), null));
    await test("Signup rejects short passwords", async () => assert.equal(await credentials({ email: "short@example.com", password: "short", mode: "signup" }), null));
    await test("Credentials reject bcrypt truncation", async () => assert.equal(await credentials({ email: "long@example.com", password: "x".repeat(73), mode: "signup" }), null));
    const password = "A long testing password 2026";
    let owner;
    await test("Signup persists a password hash and normalized email", async () => {
      owner = await from("application/services/AccountService.ts").AccountService.createPasswordUser(" Owner@Example.com ", password);
      owner.id = owner._id.toString();
      assert(owner?.id);
      const stored = await db.collection("users").findOne({ email: "owner@example.com" });
      assert(stored.passwordHash.startsWith("$2"));
      assert.notEqual(stored.passwordHash, password);
      assert.equal(stored.emailVerified, null);
    });
    await test("Incorrect password is rejected", async () => assert.equal(await credentials({ email: "owner@example.com", password: "wrong password" }), null));
    await test("Unverified password account cannot sign in", async () => assert.equal(await credentials({ email: "owner@example.com", password }), null));
    const { AccountService } = from("application/services/AccountService.ts");
    await test("Verification token is expiring and single use", async () => {
      await AccountService.requestToken("owner@example.com", "verify");
      const encrypted = await db.collection("jobs").findOne({workspaceId:"account"});
      const job = {payload: from("lib/job-encryption.ts").decryptJobPayload(encrypted.encryptedPayload)};
      assert(job.payload.html.includes("/pahchaan/verify-email?token="));
      const token = job.payload.html.match(/token=([a-f0-9]{64})/)[1];
      const record = await db.collection("auth_tokens").findOne({userId:owner.id});
      assert(record.expiresAt > new Date()); assert.notEqual(record.digest,token);
      await AccountService.consumeToken(token,"verify",password);
      await assert.rejects(AccountService.consumeToken(token,"verify",password));
    });
    await test("Correct password accepts mixed-case email", async () => assert.equal((await credentials({ email: "OWNER@EXAMPLE.COM", password })).id, owner.id));
    await test("Signup cannot overwrite an existing password", async () => assert.equal(await credentials({ email: "owner@example.com", password: "another long password", mode: "signup" }), null));
    const foreignUser = await userRepository.create({ name: "Other owner", email: "other@example.com", emailVerified: new Date() });
    const viewer = await userRepository.create({ email: "viewer@example.com", emailVerified: new Date() });
    await test("Legacy account without a password cannot use arbitrary credentials", async () => assert.equal(await credentials({ email: "other@example.com", password }), null));
    await test("Google login requires a verified email", async () => assert.equal(await authOptions.callbacks.signIn({ user: { email: "owner@example.com" }, account: { provider: "google" }, profile: { email_verified: false } }), false));
    await test("Login signup mode cannot bypass registration controls", async () => {
      assert.equal(await credentials({email:"bypass@example.com", password, mode:"signup"}), null);
      assert.equal(await db.collection("users").countDocuments({email:"bypass@example.com"}), 0);
    });
    await test("Registration service enforces password bounds", async () => {
      await assert.rejects(AccountService.createPasswordUser("short-service@example.com", "short"));
      await assert.rejects(AccountService.createPasswordUser("long-service@example.com", "😀".repeat(30)));
    });
    const googleLogin = (email, subject, user = {email}, claims = {}) => authOptions.callbacks.signIn({ user, account: {provider:"google", providerAccountId:subject, type:"oauth"}, profile:{email_verified:true,...claims} });
    await test("Google cannot link an existing account using a non-authoritative email", async () => {
      assert.equal(await googleLogin("owner@example.com", "new-google-subject"), "/pahchaan/login?error=AccountLinkRequired");
      assert.equal(await db.collection("accounts").countDocuments({providerAccountId:"new-google-subject"}), 0);
    });
    await test("Verified Gmail links to the same password account without losing credentials", async () => {
      const pending = await AccountService.createPasswordUser("password-owner@gmail.com", password);
      await db.collection("users").updateOne({_id:pending._id},{$set:{emailVerified:new Date()}});
      const before = await db.collection("users").findOne({_id:pending._id});
      const user = {email:pending.email};
      assert.equal(await googleLogin(pending.email,"gmail-password-owner",user),true);
      assert.equal(user.id,pending._id.toString());
      assert.equal(await googleLogin(pending.email,"gmail-password-owner"),true);
      const after = await db.collection("users").findOne({_id:pending._id});
      assert.equal(after.passwordHash,before.passwordHash);
      assert.equal(after.sessionVersion,before.sessionVersion);
      assert.equal((await credentials({email:pending.email,password})).id,pending._id.toString());
      assert.equal(await db.collection("users").countDocuments({email:pending.email}),1);
      assert.equal(await db.collection("accounts").countDocuments({userId:pending._id,provider:"google"}),1);
      assert.equal(await googleLogin(pending.email,"different-google-subject"),"/pahchaan/login?error=AccountLinkRequired");
    });
    await test("Verified Google Workspace identity links to an existing account", async () => {
      const user={email:"owner@example.com"};
      assert.equal(await googleLogin(user.email,"workspace-owner",user,{hd:"example.com"}),true);
      assert.equal(user.id,owner.id);
      assert.equal((await credentials({email:user.email,password})).id,owner.id);
    });
    await test("New Google identity persists once across repeated sign-ins", async () => {
      assert.equal(await googleLogin("google-new@example.com", "google-new"), true);
      assert.equal(await googleLogin("google-new@example.com", "google-new"), true);
      assert.equal(await db.collection("accounts").countDocuments({providerAccountId:"google-new"}), 1);
    });
    await test("Linked Google subject remains canonical if provider email changes", async () => {
      const previous = await db.collection("users").findOne({email:"google-new@example.com"});
      const user = {email:"google-renamed@example.com"};
      assert.equal(await googleLogin(user.email,"google-new",user), true);
      assert.equal(user.id, previous._id.toString());
    });
    await test("Google rejects dangling provider links instead of recreating accounts", async () => {
      const account = await db.collection("accounts").findOne({providerAccountId:"google-new"});
      await db.collection("users").deleteOne({_id:account.userId});
      assert.equal(await googleLogin("google-new@example.com", "google-new"), "/pahchaan/login?error=AccountUnavailable");
    });
    await test("Google reclaim of an unverified signup removes old password and tokens", async () => {
      const pending = await AccountService.createPasswordUser("pending-google@example.com", password);
      await AccountService.requestToken(pending.email,"verify");
      assert.equal(await googleLogin(pending.email,"pending-google"),true);
      const user = await db.collection("users").findOne({_id:pending._id});
      assert(!user.passwordHash); assert(user.emailVerified);
      assert.equal(await db.collection("auth_tokens").countDocuments({userId:pending._id.toString()}),0);
    });
    await test("Resend cooldown preserves the recently sent verification link", async () => {
      const pending = await AccountService.createPasswordUser("resend@example.com", password);
      await AccountService.requestToken(pending.email,"verify");
      const token = await db.collection("auth_tokens").findOne({userId:pending._id.toString()});
      await AccountService.requestToken(pending.email,"verify");
      assert.equal((await db.collection("auth_tokens").findOne({userId:pending._id.toString()})).digest,token.digest);
    });
    await test("Verification replaces a pre-registered password with the email owner's password", async () => {
      const pending = await AccountService.createPasswordUser("pre-registered@example.com",password);
      await AccountService.requestToken(pending.email,"verify");
      const jobs=await db.collection("jobs").find({workspaceId:"account"}).toArray();
      const payload=jobs.map(j=>from("lib/job-encryption.ts").decryptJobPayload(j.encryptedPayload)).find(p=>p.to===pending.email);
      await AccountService.consumeToken(payload.html.match(/token=([a-f0-9]{64})/)[1],"verify",password+" owner");
      assert.equal(await credentials({email:pending.email,password}),null);
      assert((await credentials({email:pending.email,password:password+" owner"})).id);
    });
    await test("Reset invalidates outstanding verification links as well", async () => {
      const pending = await AccountService.createPasswordUser("reset-all@example.com", password);
      await AccountService.requestToken(pending.email,"verify");
      await AccountService.requestToken(pending.email,"reset");
      const jobs=await db.collection("jobs").find({workspaceId:"account"}).toArray();
      const payload=jobs.map(j=>from("lib/job-encryption.ts").decryptJobPayload(j.encryptedPayload)).find(p=>p.to===pending.email && p.subject==="Reset your password");
      await AccountService.consumeToken(payload.html.match(/token=([a-f0-9]{64})/)[1],"reset",password+" changed");
      assert.equal(await db.collection("auth_tokens").countDocuments({userId:pending._id.toString()}),0);
    });
    await test("Post-login redirects reject outside origins and auth loops", async () => {
      const {safeAuthDestination}=from("lib/auth-navigation.ts");
      for(const url of ["https://evil.example/", "//evil.example", "/pahchaan/api/auth/signin", "/pahchaan/login", "/pahchaan/dashboard/../../login", "javascript:alert(1)", "/\\evil.example"])
        assert.equal(safeAuthDestination(url,"https://example.com"),"/pahchaan/dashboard");
      assert.equal(safeAuthDestination("/pahchaan/events/new?tab=guests","https://example.com"),"/pahchaan/events/new?tab=guests");
      assert.equal(safeAuthDestination("/pahchaan/invite?token=example","https://example.com"),"/pahchaan/invite?token=example");
      assert.equal(await authOptions.callbacks.redirect({url:"/pahchaan/login",baseUrl:"https://example.com"}),"https://example.com/pahchaan/login");
      assert.equal(await authOptions.callbacks.redirect({url:"https://evil.example/pahchaan/login",baseUrl:"https://example.com"}),"https://example.com/pahchaan/dashboard");
    });
    await test("JWT uses canonical authenticated user ID", async () => assert.equal((await authOptions.callbacks.jwt({ token: {}, user: owner })).sub, owner.id));
    await test("Deleted users are not recreated by JWT refresh", async () => {
      const token = await authOptions.callbacks.jwt({ token: { email: "deleted@example.com", name: "Deleted", sub: "stale" } });
      assert.equal(token.sub, undefined);
      assert.equal(await db.collection("users").countDocuments({ email: "deleted@example.com" }), 0);
    });
    const a = await WorkspaceService.createWorkspace(owner.id, "Workspace A", "workspace-a", "Asia/Kolkata");
    const b = await WorkspaceService.createWorkspace(foreignUser._id, "Workspace B", "workspace-b", "UTC");
    const second = await WorkspaceService.createWorkspace(owner.id, "Workspace A2", "workspace-a2", "UTC");
    await membershipRepository.create({ workspaceId: a._id, userId: viewer._id, role: "viewer" });
    await test("Workspace creator receives owner role", async () => assert(await RBACService.checkPermission(owner.id, a._id, "owner")));
    await test("Foreign tenant cannot obtain workspace permissions", async () => assert.equal(await RBACService.checkPermission(owner.id, b._id, "viewer"), false));
    await test("Viewer cannot manage an event", async () => assert.equal(await RBACService.checkPermission(viewer._id, a._id, "manager"), false));
    session = { user: { id: owner.id } };
    await test("Active workspace persists in database and cookie", async () => {
      const response = await workspaceRoute.POST(request("/api/workspaces/active", { workspaceId: a._id }));
      assert.equal(response.status, 200);
      assert(response.headers.get("set-cookie").includes(a._id));
      assert.equal((await getActiveWorkspaceData(owner.id)).activeWorkspace._id, a._id);
    });
    await test("Workspace switching blocks foreign membership", async () => assert.equal((await workspaceRoute.POST(request("/api/workspaces/active", { workspaceId: b._id }))).status, 403));
    await test("Cross-device workspace resolution uses database preference", async () => {
      await workspaceRoute.POST(request("/api/workspaces/active", { workspaceId: second._id }));
      assert.equal((await getActiveWorkspaceData(owner.id)).activeWorkspace._id, second._id);
    });
    await test("Deleted workspace fallback uses its own membership", async () => {
      const { ObjectId } = require("mongodb");
      const deleted = new ObjectId().toString();
      await membershipRepository.create({ workspaceId: deleted, userId: owner.id, role: "viewer" });
      await userRepository.update(owner.id, { lastActiveWorkspaceId: deleted });
      const data = await getActiveWorkspaceData(owner.id);
      assert.equal(data.activeMembership.workspaceId, data.activeWorkspace._id);
      await userRepository.update(owner.id, { lastActiveWorkspaceId: a._id });
    });
    const start = new Date(Date.now() + 86400000), end = new Date(Date.now() + 172800000);
    const event = await EventService.createEvent(owner.id, a._id, "Summit A", "summit-a", end, start, "Venue", "Description", undefined, 100);
    const other = await EventService.createEvent(foreignUser._id, b._id, "Summit B", "summit-b", end, start);
    await test("Event creation provisions settings", async () => assert(await db.collection("event_settings").findOne({ eventId: event._id, workspaceId: a._id })));
    await test("Owner can read event API", async () => assert.equal((await eventRoute.GET(request(`/api/events/${event._id}`, undefined, "GET"), context({ eventId: event._id }))).status, 200));
    await test("Foreign event API read is forbidden", async () => assert.equal((await eventRoute.GET(request(`/api/events/${other._id}`, undefined, "GET"), context({ eventId: other._id }))).status, 403));
    await test("Foreign event update is rejected", async () => assert.rejects(EventService.updateEvent(owner.id, a._id, other._id, { name: "Hijacked" })));
    await test("Event update cannot reassign tenant", async () => {
      await EventService.updateEvent(owner.id, a._id, event._id, { workspaceId: b._id, name: "Summit A edited" });
      assert.equal((await eventRepository.findById(event._id)).workspaceId, a._id);
    });
    await test("Invalid event status transition is rejected", async () => assert.rejects(EventService.updateStatus(owner.id, a._id, event._id, "completed")));
    await test("Event publishing works", async () => assert.equal((await EventService.updateStatus(owner.id, a._id, event._id, "published")).status, "published"));
    await test("Event duplication preserves tenant", async () => assert.equal((await EventService.duplicateEvent(owner.id, a._id, event._id, "Duplicate", "summit-copy", start)).workspaceId, a._id));
    await test("Event listing is scoped and paginated", async () => {
      const data = await EventService.getEvents(owner.id, a._id, { limit: 1 });
      assert.equal(data.events.length, 1);
      assert(data.total >= 2);
      assert(data.events.every(e => e.workspaceId === a._id));
    });
    const form = await registrationFormRepository.getOrCreateForEvent(a._id, event._id);
    await test("Public registration returns form without automation settings", async () => {
      const response = await publicRoute.GET(request("/api/r/summit-a", undefined, "GET"), context({ slug: ["summit-a"] }));
      assert.equal(response.status, 200);
      assert.equal((await response.json()).form.settings.autoApprove, undefined);
    });
    const answers = Object.fromEntries(form.fields.filter(f => f.required).map(f => [f.id, f.type === "email" ? "attendee@example.com" : "Alice"]));
    await test("Registration provisions guest and QR", async () => {
      const submission = await RegistrationService.submitRegistration(event._id, answers);
      const saved = await registrationSubmissionRepository.findById(submission._id);
      assert.equal(saved.status, "approved");
      assert(saved.guestId);
      assert((await guestRepository.findById(saved.guestId)).qrCodeId);
      const job = await db.collection('jobs').findOne({type:'email',eventId:event._id});
      assert(job);
      const payload = from('lib/job-encryption.ts').decryptJobPayload(job.encryptedPayload);
      assert.equal(payload.to, 'attendee@example.com');
      assert(payload.subject.includes(event.name));
      assert(payload.text.includes('keep it private'));
      assert(payload.html.includes('cid:check-in-qr'));
      assert.equal(payload.attachments[0].cid, 'check-in-qr');
      const png = Buffer.from(payload.attachments[0].content, 'base64');
      assert.equal(png.subarray(1,4).toString(), 'PNG');
      const expected = await require('qrcode').toBuffer(JSON.stringify({guestId:saved.guestId}), {type:'png',width:600,margin:4,errorCorrectionLevel:'M'});
      assert.deepEqual(png, expected);
    });
    await test("Registration retries enqueue one unique QR email", async () => {
      const retryAnswers = {...answers, [form.fields.find(f=>f.type==='email').id]:'qr-email-retry@example.com'};
      const first = await RegistrationService.submitRegistration(event._id, retryAnswers, undefined, 'registration-retry-123');
      const second = await RegistrationService.submitRegistration(event._id, retryAnswers, undefined, 'registration-retry-123');
      assert.equal(first._id, second._id);
      const jobs = await db.collection('jobs').find({type:'email',eventId:event._id}).toArray();
      const decode = from('lib/job-encryption.ts').decryptJobPayload;
      assert.equal(jobs.filter(j=>decode(j.encryptedPayload).to==='qr-email-retry@example.com').length,1);
    });
    await test("Manual approval queues QR only after admission approval", async () => {
      await registrationFormRepository.update(form._id,{settings:{...form.settings,autoApprove:false}});
      const manualAnswers={...answers,[form.fields.find(f=>f.type==='email').id]:'manual@example.com'};
      const submission=await RegistrationService.submitRegistration(event._id,manualAnswers);
      const decode=from('lib/job-encryption.ts').decryptJobPayload;
      const count=async()=> (await db.collection('jobs').find({type:'email',eventId:event._id}).toArray()).filter(j=>decode(j.encryptedPayload).to==='manual@example.com').length;
      assert.equal(submission.status,'pending'); assert.equal(await count(),0);
      await RegistrationService.approveSubmission(a._id,event._id,submission._id,owner.id);
      await RegistrationService.approveSubmission(a._id,event._id,submission._id,owner.id);
      assert.equal(await count(),1);
      await registrationFormRepository.update(form._id,{settings:form.settings});
    });
    await test("Guest email safely escapes names and custom content",async()=>{
      const message=from('lib/guest-email.ts').guestEmail({...event,name:'<script>Event</script>'},'<img onerror=alert(1)>','<script>message</script>');
      assert(!message.html.includes('<script>')); assert(!message.html.includes('<img onerror'));
      assert(message.html.includes('&lt;script&gt;'));
    });
    // Readiness assertions stay visible if a regression reopens these gaps.
    await test("READINESS: public registration rejects missing required fields", async () => assert.rejects(RegistrationService.submitRegistration(event._id, {})));
    await test("READINESS: duplicate email policy rejects repeated registration", async () => assert.rejects(RegistrationService.submitRegistration(event._id, answers)));
    await test("READINESS: draft events hide their public form", async () => assert.equal((await publicRoute.GET(request("/api/r/summit-b", undefined, "GET"), context({ slug: ["summit-b"] }))).status, 404));
    const pending = await registrationSubmissionRepository.create({ workspaceId: b._id, eventId: other._id, formId: "other", status: "pending", answers: {}, submittedAt: new Date() });
    for (const operation of ["approveSubmission", "rejectSubmission", "waitlistSubmission"]) {
      await test(`Registration ${operation} rejects foreign submission`, async () => assert.rejects(RegistrationService[operation](a._id, event._id, pending._id, owner.id)));
    }
    const guest = await GuestService.createGuest(a._id, event._id, owner.id, { firstName: "David", lastName: "Miller", status: "approved" });
    const foreignGuest = await GuestService.createGuest(b._id, other._id, foreignUser._id, { firstName: "Other", status: "approved" });
    await test("Guest update rejects foreign ID", async () => assert.equal((await guestRoute.PATCH(request("/guest", { notes: "Hijacked" }, "PATCH"), context({ eventId: event._id, guestId: foreignGuest._id }))).status, 404));
    await test("Guest update cannot overwrite tenant or scan history", async () => {
      await guestRoute.PATCH(request("/guest", { notes: "Useful note", workspaceId: b._id, checkIns: [{}], status: "checked_in" }, "PATCH"), context({ eventId: event._id, guestId: guest._id }));
      const saved = await guestRepository.findById(guest._id);
      assert.equal(saved.workspaceId, a._id);
      assert.equal(saved.status, "approved");
      assert.equal(saved.checkIns.length, 0);
      assert.equal(saved.notes, "Useful note");
    });
    await test("Bulk guest updates affect only the requested event", async () => {
      assert.equal(await guestRepository.updateManyStatus([guest._id, foreignGuest._id], "rejected", a._id, event._id), 1);
      assert.equal((await guestRepository.findById(foreignGuest._id)).status, "approved");
      await guestRepository.update(guest._id, { status: "approved" });
    });
    await test("Guest approval rejects foreign event", async () => assert.rejects(GuestService.approveGuest(a._id, event._id, owner.id, foreignGuest._id)));
    const qr = await QRService.createQR(owner.id, a._id, event._id, "David badge", {}, true, `https://example.com/?guestId=${guest._id}`);
    await guestRepository.update(guest._id, { qrCodeId: qr._id });
    await test("Malformed QR is invalid rather than a server exception", async () => assert.equal((await ScannerService.processScan(a._id, event._id, owner.id, { qrData: "not-a-ticket" })).status, "invalid"));
    await test("QR URL resolves guest and checks in", async () => assert.equal((await ScannerService.processScan(a._id, event._id, owner.id, { qrData: qr.destinationUrl })).status, "success"));
    await test("Sequential duplicate check-in is rejected", async () => assert.equal((await ScannerService.processScan(a._id, event._id, owner.id, { guestId: guest._id })).status, "duplicate"));
    await test("Check-out permits a later check-in", async () => {
      assert.equal((await ScannerService.processScan(a._id, event._id, owner.id, { guestId: guest._id }, "out")).status, "success");
      assert.equal((await ScannerService.processScan(a._id, event._id, owner.id, { guestId: guest._id }, "in")).status, "success");
    });
    const concurrentGuest = await GuestService.createGuest(a._id, event._id, owner.id, { firstName: "Concurrent", status: "approved" });
    await test("Twenty concurrent gates accept a guest exactly once", async () => {
      const scans = await Promise.all(Array.from({ length: 20 }, () => ScannerService.processScan(a._id, event._id, owner.id, { guestId: concurrentGuest._id })));
      assert.equal(scans.filter(s => s.success).length, 1);
      assert.equal((await guestRepository.findById(concurrentGuest._id)).checkIns.length, 1);
      assert.equal(await db.collection("qr_scans").countDocuments({ qrId: concurrentGuest._id }), 1);
    });
    const pendingGuest = await GuestService.createGuest(a._id, event._id, owner.id, { status: "pending" });
    await test("Pending guest cannot enter", async () => assert.equal((await ScannerService.processScan(a._id, event._id, owner.id, { guestId: pendingGuest._id })).status, "invalid"));
    await test("Scanner rejects foreign guest", async () => assert.equal((await ScannerService.processScan(a._id, event._id, owner.id, { guestId: foreignGuest._id })).status, "invalid"));
    const foreignQR = await QRService.createQR(foreignUser._id, b._id, other._id, "Foreign unassigned ticket", {});
    await qrCodeRepository.update(foreignQR._id, { status: "active" });
    await test("Scanner rejects foreign unassigned QR by MongoDB ID", async () => assert.equal((await ScannerService.processScan(a._id, event._id, owner.id, { qrData: foreignQR._id })).status, "invalid"));
    await test("Scanner rejects invalid direction", async () => assert.equal((await ScannerService.processScan(a._id, event._id, owner.id, { guestId: guest._id }, "sideways")).status, "invalid"));
    await test("Attendance KPI and timelines include accepted scans", async () => {
      assert((await AnalyticsService.getEventKPIs(event._id)).checkedInGuests >= 2);
      assert((await AnalyticsService.getAttendanceTimeline(event._id)).length > 0);
      assert(Array.isArray(await AnalyticsService.getRegistrationFunnel(event._id)));
      assert(Array.isArray(await AnalyticsService.getScannerMetrics(event._id)));
    });
    const key = await ApiKeyService.generateKey(a._id, "Integration", owner.id);
    await test("API key validates against stored hash", async () => assert.equal((await ApiKeyService.validateKey(key.plaintextKey)).workspaceId, a._id));
    await test("API key checks the final secret character", async () => {
      const last = key.plaintextKey.slice(-1);
      assert.equal(await ApiKeyService.validateKey(key.plaintextKey.slice(0, -1) + (last === "0" ? "1" : "0")), null);
    });
    await test("Malformed API key is rejected", async () => assert.equal(await ApiKeyService.validateKey("idf_live_invalid_secret"), null));
    await test("API key revocation rejects foreign workspace", async () => assert.rejects(ApiKeyService.revokeKey(key.apiKey._id, b._id)));
    await test("Revoked API key cannot authenticate", async () => {
      await ApiKeyService.revokeKey(key.apiKey._id, a._id);
      assert.equal(await ApiKeyService.validateKey(key.plaintextKey), null);
    });
    await test("Legacy truncated bcrypt API key requires regeneration", async () => {
      const legacy = await ApiKeyService.generateKey(a._id, "Legacy", owner.id);
      await apiKeyRepository.update(legacy.apiKey._id, { hash: await require("bcrypt").hash(legacy.plaintextKey, 10) });
      assert.equal(await ApiKeyService.validateKey(legacy.plaintextKey), null);
    });
    const hook = await WebhookService.registerWebhook(b._id, "Foreign hook", "https://example.com/hook", ["guest.created"]);
    await test("Webhook deletion rejects foreign workspace", async () => assert.rejects(WebhookService.deleteWebhook(hook._id, a._id)));
    const invite = await inviteRepository.create({ workspaceId: a._id, email: "other@example.com", role: "member", token: "unique-test-token", status: "pending", expiresAt: new Date(Date.now() + 86400000), invitedBy: owner.id });
    await test("Invitation rejects an unintended recipient", async () => assert.rejects(WorkspaceService.acceptInvite(invite.token, viewer._id)));
    await test("Invitation grants membership to intended recipient", async () => assert.equal((await WorkspaceService.acceptInvite(invite.token, foreignUser._id)).workspaceId, a._id));
    await test("Consumed invitation cannot be reused", async () => assert.rejects(WorkspaceService.acceptInvite(invite.token, foreignUser._id)));
    const bOwner = (await membershipRepository.findByUserId(foreignUser._id)).find(m => m.workspaceId === b._id);
    await test("Member update rejects foreign workspace ID", async () => assert.equal((await memberRoute.PATCH(request("/member", { role: "viewer" }, "PATCH"), context({ id: a._id, memberId: bOwner._id }))).status, 404));
    const aOwner = (await membershipRepository.findByUserId(owner.id)).find(m => m.workspaceId === a._id);
    await test("Last workspace owner cannot be deleted", async () => assert.equal((await memberRoute.DELETE(request("/member", undefined, "DELETE"), context({ id: a._id, memberId: aOwner._id }))).status, 409));
    await test("Debug endpoints expose no database records", async () => {
      for (const file of ["app/api/debug/route.ts", "app/api/debug/cleanup/route.ts"]) assert.equal((await from(file).GET()).status, 404);
    });
    session = null;
    await test("Unauthenticated event route returns 401", async () => assert.equal((await eventRoute.GET(request("/event", undefined, "GET"), context({ eventId: event._id }))).status, 401));
    await test("Unauthenticated workspace switch returns 401", async () => assert.equal((await workspaceRoute.POST(request("/workspace", { workspaceId: a._id }))).status, 401));
    const presetsRoute = from("app/api/events/form-presets/route.ts");
    await test("Unauthenticated form presets cannot be read or created", async () => {
      assert.equal((await presetsRoute.GET(request("/presets", undefined, "GET"))).status, 401);
      assert.equal((await presetsRoute.POST(request("/presets", { name: "Anonymous" }))).status, 401);
    });
    session = { user: { id: foreignUser._id } };
    const foreignPreset = await (await presetsRoute.POST(request("/presets", { name: "Private preset" }))).json();
    const foreignPresetId = foreignPreset.data._id;
    session = { user: { id: owner.id } };
    await test("Custom form presets do not leak across users", async () => {
      const data = await (await presetsRoute.GET(request("/presets", undefined, "GET"))).json();
      assert(!data.data.some(preset => preset._id === foreignPresetId));
    });
    const { NextRequest } = require("next/server");
    await test("Custom preset deletion rejects a foreign user", async () => assert.equal((await presetsRoute.DELETE(new NextRequest(`http://localhost/presets?id=${foreignPresetId}`, { method: "DELETE" }))).status, 404));
    session = null;
    await test("Audit trail records workspace, event, and check-in actions", async () => {
      for (const action of ["WORKSPACE_CREATED", "EVENT_CREATED", "GUEST_CHECKED_IN"]) assert(await db.collection("audit_logs").findOne({ action, workspaceId: a._id }));
    });
    await require("./hardening.cjs")({ from, db, test, assert, owner, a, b, event, other, answers, password, setSession: value => { session = value; } });
    await require("./registration-otp.cjs")({from,db,test,assert,event,other,form,answers,publicRoute,request,context});
    await require("./capacity.cjs")({from,db,test,assert,event,owner,setSession: value => {session=value;}});
    if (process.argv.includes("--http")) {
      const { spawn } = require("node:child_process");
      const net = require("node:net");
      const port = await new Promise((resolvePort, reject) => {
        const probe = net.createServer();
        probe.on("error", reject);
        probe.listen(0, "127.0.0.1", () => {
          const assigned = probe.address().port;
          probe.close(() => resolvePort(assigned));
        });
      });
      const base = `http://127.0.0.1:${port}/pahchaan`;
      const server = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "-p", String(port), "-H", "127.0.0.1"], {
        cwd: root, windowsHide: true,
        env: { ...process.env, NODE_ENV: "production", NEXTAUTH_URL: `${base}/api/auth`, NEXTAUTH_URL_INTERNAL: `${base}/api/auth`, NEXT_PUBLIC_APP_URL: base, NEXTAUTH_SECRET: "", JOB_ENCRYPTION_KEY: "", SMTP_HOST: "127.0.0.1", SMTP_USER: "isolated-test", SMTP_PASS: "isolated-test", SMTP_FROM: "test@example.test", AUTH_GOOGLE_ID: "test", AUTH_GOOGLE_SECRET: "test", GOOGLE_CLIENT_ID: "test", GOOGLE_CLIENT_SECRET: "test" },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let logs = "";
      server.stdout.on("data", chunk => { logs += chunk; });
      server.stderr.on("data", chunk => { logs += chunk; });
      server.on("error", error => { logs += error.message; });
      const jar = new Map();
      async function http(url, options = {}, withCookies = false, cookieJar = jar) {
        const response = await fetch(base + url, {
          ...options, redirect: "manual",
          headers: { ...options.headers, ...(withCookies ? { Cookie: Array.from(cookieJar, ([key, value]) => `${key}=${value}`).join("; ") } : {}) },
          signal: AbortSignal.timeout(15000),
        });
        if (withCookies) {
          for (const cookie of response.headers.getSetCookie()) {
            const pair = cookie.split(";")[0];
            cookieJar.set(pair.slice(0, pair.indexOf("=")), pair.slice(pair.indexOf("=") + 1));
          }
        }
        return response;
      }
      try {
        let ready = false;
        for (let attempt = 0; attempt < 50; attempt++) {
          try { await http("/api/auth/session"); ready = true; break; } catch { await new Promise(resolveReady => setTimeout(resolveReady, 200)); }
        }
        assert(ready, `Production server failed to start: ${logs.slice(-2000)}`);
        await test("HTTP landing assets and links use the Pahchaan base path", async () => {
          const page = await (await http("")).text();
          assert(page.includes('href="/pahchaan/login"'));
          assert(page.includes('href="/pahchaan/signup"'));
          const assets = [...page.matchAll(/(?:src|href)="(\/pahchaan\/_next\/static\/[^"<>]+)"/g)].map(match => match[1]);
          assert(assets.length > 0);
          for (const asset of new Set(assets)) assert.equal((await fetch(new URL(base).origin + asset.replace(/&amp;/g, "&"))).status, 200);
          assert.equal((await http("/pahchaan.svg")).status, 200);
        });
        for (const url of ["", "/login", "/signup", "/terms", "/privacy", "/robots.txt", "/sitemap.xml"]) {
          await test(`HTTP public page ${url}`, async () => assert.equal((await http(url)).status, 200));
        }
        for (const url of ["/dashboard", "/events", "/workspace/settings", "/profile"]) {
          await test(`HTTP unauthenticated redirect ${url}`, async () => {
            const response = await http(url);
            assert([302, 307].includes(response.status));
            assert(response.headers.get("location").includes("/pahchaan/login"));
          });
        }
        await test("HTTP legacy signIn redirect", async () => {
          const response = await http("/signIn");
          assert.equal(response.status, 307);
          assert(response.headers.get("location").includes("/login"));
        });
        for (const url of ["/api/events?workspaceId=" + a._id, "/api/workspaces/active"]) {
          await test(`HTTP unauthenticated API ${url.split("?")[0]}`, async () => assert.equal((await http(url)).status, 401));
        }
        for (const url of ["/api/debug", "/api/debug/cleanup"]) {
          await test(`HTTP disabled ${url}`, async () => assert.equal((await http(url)).status, 404));
        }
        await test("HTTP public registration form", async () => {
          const response = await http("/api/r/summit-a");
          assert.equal(response.status, 200);
          assert((await response.json()).form.fields.length >= 3);
        });
        await test("HTTP invalid registration returns client error", async () => assert.equal((await http("/api/r/summit-a", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: {} }) })).status, 400));
        await test("HTTP production registration renders PNG and queues one pass",async()=>{
          const compiledAnswers={...answers,[form.fields.find(f=>f.type==='email').id]:'compiled-qr@example.test'};
          const otpResponse=await http('/api/registration/email-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:'summit-a',email:'compiled-qr@example.test',action:'send'})});
          assert.equal(otpResponse.status,202);const challenge=(await otpResponse.json()).challenge;
          const otpJob=await db.collection('jobs').findOne({type:'email',eventId:event._id},{sort:{createdAt:-1}});
          const otpPayload=from('lib/job-encryption.ts').decryptJobPayload(otpJob.encryptedPayload);
          const code=otpPayload.text.match(/code is (\d{6})/)[1];
          const verified=await http('/api/registration/email-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:'summit-a',email:'compiled-qr@example.test',action:'verify',challenge,code})});
          assert.equal(verified.status,200);const emailProof=(await verified.json()).proof;
          const options={method:'POST',headers:{'Content-Type':'application/json',Origin:new URL(base).origin,'Idempotency-Key':'compiled-email-retry'},body:JSON.stringify({answers:compiledAnswers,emailProof})};
          for(let i=0;i<2;i++){
            const response=await http('/api/r/summit-a',options);
            assert.equal(response.status,200,await response.clone().text());
            assert.equal((await response.json()).status,'approved');
          }
          const decode=from('lib/job-encryption.ts').decryptJobPayload;
          const jobs=(await db.collection('jobs').find({type:'email',eventId:event._id}).toArray()).map(j=>decode(j.encryptedPayload)).filter(j=>j.to==='compiled-qr@example.test' && j.attachments);
          assert.equal(jobs.length,1); assert.equal(jobs[0].attachments[0].contentType,'image/png');
        });
        await test("HTTP real credentials reject wrong password", async () => {
          const csrf = await (await http("/api/auth/csrf", {}, true)).json();
          const response = await http("/api/auth/callback/credentials", {
            method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ csrfToken: csrf.csrfToken, email: "owner@example.com", password: "wrong", callbackUrl: base + "/dashboard", json: "true" }),
          }, true);
          const data = await response.json();
          assert(data.url.includes("error=CredentialsSignin"));
        });
        await test("HTTP real credentials create valid session", async () => {
          const csrf = await (await http("/api/auth/csrf", {}, true)).json();
          const response = await http("/api/auth/callback/credentials", {
            method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ csrfToken: csrf.csrfToken, email: "owner@example.com", password, callbackUrl: base + "/dashboard", json: "true" }),
          }, true);
          assert(!(await response.json()).url.includes("error="));
          const actual = await (await http("/api/auth/session", {}, true)).json();
          assert.equal(actual.user.id, owner.id);
        });
        await test("HTTP proxy accepts AUTH_SECRET session", async () => assert.equal((await http("/dashboard", {}, true)).status, 200));
        await test("HTTP authenticated event list", async () => assert.equal((await http("/api/events?workspaceId=" + a._id, {}, true)).status, 200));
        await test("HTTP authenticated cross-tenant event read is forbidden", async () => assert.equal((await http("/api/events/" + other._id, {}, true)).status, 403));
        if (process.argv.includes("--browser")) await require("./browser.cjs")({ base, db, test, assert, event, a, second, password });
        await test("HTTP sign-out clears the session and returns to login", async () => {
          const csrf = await (await http("/api/auth/csrf", {}, true)).json();
          const response = await http("/api/auth/signout", {
            method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
            body:new URLSearchParams({csrfToken:csrf.csrfToken,callbackUrl:base+"/login",json:"true"}),
          },true);
          assert.equal((await response.json()).url,base+"/login");
          assert.equal((await (await http("/api/auth/session",{},true)).json()).user,undefined);
          assert.equal((await http("/api/events?workspaceId="+a._id,{},true)).status,401);
        });
        // Independent cookie jars represent browsers on separate devices.
        const devices = Array.from({length:5}, () => new Map());
        await test("HTTP one account stays signed in on five independent devices", async () => {
          for (const device of devices) {
            const csrf = await (await http("/api/auth/csrf",{},true,device)).json();
            const response = await http("/api/auth/callback/credentials", {
              method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
              body:new URLSearchParams({csrfToken:csrf.csrfToken,email:"owner@example.com",password,callbackUrl:base+"/dashboard",json:"true"}),
            },true,device);
            assert(!(await response.json()).url.includes("error="));
          }
          const sessions = await Promise.all(devices.map(async device =>
            (await http("/api/auth/session",{},true,device)).json()));
          for (const actual of sessions) assert.equal(actual.user.id,owner.id);
          const responses = await Promise.all(devices.map(device =>
            http("/api/events?workspaceId="+a._id,{},true,device)));
          for (const response of responses) assert.equal(response.status,200);
          assert.equal(new Set(devices.map(device=>device.get("next-auth.session-token"))).size,5);
        });
        await test("HTTP signing out one device preserves the other four sessions", async () => {
          const csrf = await (await http("/api/auth/csrf",{},true,devices[0])).json();
          await http("/api/auth/signout", {
            method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
            body:new URLSearchParams({csrfToken:csrf.csrfToken,callbackUrl:base+"/login",json:"true"}),
          },true,devices[0]);
          assert.equal((await (await http("/api/auth/session",{},true,devices[0])).json()).user,undefined);
          for (const device of devices.slice(1)) {
            assert.equal((await (await http("/api/auth/session",{},true,device)).json()).user.id,owner.id);
            assert.equal((await http("/api/events?workspaceId="+a._id,{},true,device)).status,200);
          }
        });
        await test("HTTP password reset invalidates all old device sessions", async () => {
          await AccountService.requestToken("owner@example.com","reset");
          const jobs = await db.collection("jobs").find({workspaceId:"account"}).sort({createdAt:-1}).toArray();
          const payload = jobs.filter(job=>job.encryptedPayload)
            .map(job=>from("lib/job-encryption.ts").decryptJobPayload(job.encryptedPayload))
            .find(mail=>mail.to==="owner@example.com" && mail.subject==="Reset your password");
          assert(payload);
          await AccountService.consumeToken(payload.html.match(/token=([a-f0-9]{64})/)[1],"reset",password+" changed");
          for (const device of devices.slice(1)) {
            assert.equal((await http("/api/events?workspaceId="+a._id,{},true,device)).status,401);
            assert(!(await (await http("/api/auth/session",{},true,device)).json()).user?.id);
          }
        });
      } finally {
        server.kill();
        await new Promise(resolveExit => {
          if (server.exitCode !== null) return resolveExit();
          server.once("exit", resolveExit);
        });
        fs.mkdirSync(path.join(root, "docs/test-results"), { recursive: true });
        fs.writeFileSync(path.join(root, "docs/test-results/production-server.log"), logs);
      }
    }
    if (process.argv.includes("--readiness")) {
      // Preserve evidence of known launch blockers separately from regression
      // checks. These assertions intentionally stay red until the gaps close.
      const limited = await EventService.createEvent(owner.id, a._id, "Limited", "limited-test", end, start, undefined, undefined, undefined, 1);
      await EventService.updateStatus(owner.id, a._id, limited._id, "published");
      const limitedForm = await registrationFormRepository.getOrCreateForEvent(a._id, limited._id);
      await registrationFormRepository.update(limitedForm._id, { settings: { ...limitedForm.settings, capacity: 1, autoApprove: false, createGuest: false, generateQR: false } });
      await test("LAUNCH BLOCKER: concurrent registrations obey capacity one", async () => {
        const attempted = await Promise.allSettled(Array.from({ length: 20 }, (_, index) => RegistrationService.submitRegistration(limited._id,
          Object.fromEntries(limitedForm.fields.filter(f => f.required).map(f => [f.id, f.type === "email" ? `capacity${index}@example.com` : "Guest"]))
        )));
        const accepted = attempted.filter(result => result.status === "fulfilled").length;
        assert.equal(accepted, 1, `${accepted} of 20 submissions accepted for capacity 1 with waitlist disabled`);
      });
      await test("LAUNCH BLOCKER: unknown public slug cannot resolve another event", async () => assert.equal(await eventRepository.findByUniqueSlug("nonexistent-link-summit"), null));
      const ticket = await QRService.createQR(owner.id, a._id, event._id, "Unassigned", {});
      await qrCodeRepository.update(ticket._id, { status: "active" });
      await test("LAUNCH BLOCKER: unassigned ticket rejects repeat entry", async () => {
        assert.equal((await ScannerService.processScan(a._id, event._id, owner.id, { qrData: ticket._id })).status, "success");
        assert.equal((await ScannerService.processScan(a._id, event._id, owner.id, { qrData: ticket._id })).status, "duplicate");
      });
      await test("LAUNCH BLOCKER: concurrent signup creates one canonical account", async () => {
        await Promise.all(Array.from({ length: 5 }, () => AccountService.createPasswordUser("concurrent-signup@example.com", password)));
        assert.equal(await db.collection("users").countDocuments({ email: "concurrent-signup@example.com" }), 1);
      });
    }
  } catch (error) {
    console.error(error);
    results.push({ name: "Suite setup/execution", status: "FAIL", error: error.message });
  } finally {
    if (client) await client.close();
    if (mongo) await mongo.stop();
    const failed = results.filter(r => r.status === "FAIL").length;
    const report = { date: new Date().toISOString(), scope: "Isolated MongoDB integration and direct route-handler tests; injected sessions" + (process.argv.includes("--http") ? "; production HTTP smoke tests and real credential sessions" : "") + (process.argv.includes("--browser") ? "; real Chrome browser checks" : "; no browser checks") + "; no external provider delivery", total: results.length, passed: results.length - failed, failed, results };
    fs.mkdirSync(path.join(root, "docs/test-results"), { recursive: true });
    const reportPath = process.argv.includes("--browser") && process.argv.includes("--readiness") ? "docs/test-results/pahchaan-all.json" : process.argv.includes("--readiness") ? "docs/test-results/readiness.json" : "docs/test-results/platform.json";
    fs.writeFileSync(path.join(root, reportPath), JSON.stringify(report, null, 2) + "\n");
    console.log(`\n${report.passed}/${report.total} passed; ${failed} failed. Temporary database stopped.`);
    process.exitCode = failed ? 1 : 0;
  }
}
main();
