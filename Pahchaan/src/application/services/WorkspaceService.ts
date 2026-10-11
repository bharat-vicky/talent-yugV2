import { workspaceRepository } from "@/infrastructure/repositories/WorkspaceRepository";
import { membershipRepository } from "@/infrastructure/repositories/MembershipRepository";
import { workspaceSettingsRepository, brandingSettingsRepository, scannerSettingsRepository, registrationSettingsRepository } from "@/infrastructure/repositories/SettingsRepositories";
import { inviteRepository } from "@/infrastructure/repositories/InviteRepository";
import { userRepository } from "@/infrastructure/repositories/UserRepository";
import { AuditService } from "./AuditService";
import { RealtimeService } from "./RealtimeService";
import { EmailService } from "./EmailService";
import crypto from "crypto";
import { normalizeEmail } from "@/lib/email";
import { collection, withTransaction } from "@/infrastructure/transaction";
import { DataLifecycleService } from "./DataLifecycleService";
import { ObjectId } from "mongodb";

export class WorkspaceService {
  static async createWorkspace(userId: string, name: string, slug: string, timezone: string, logo?: string) {
    // 1. Check if slug exists
    const existing = await workspaceRepository.findBySlug(slug);
    if (existing) {
      throw new Error("Workspace slug already exists.");
    }

    // 2. Create Workspace
    const workspace = await workspaceRepository.create({
      name,
      slug,
      timezone,
      logo,
    });

    const workspaceId = workspace._id as string;

    // 3. Create Owner Membership
    await membershipRepository.create({
      userId,
      workspaceId,
      role: "owner",
    });

    // Also update user's lastActiveWorkspaceId in database
    try {
      const client = await (await import("@/infrastructure/db")).default();
      const { ObjectId } = await import("mongodb");
      const userQuery: Record<string, unknown> = ObjectId.isValid(userId)
        ? { $or: [{ _id: new ObjectId(userId) }, { _id: userId }] }
        : { _id: userId };
      await client.db().collection("users").updateOne(userQuery, {
        $set: { lastActiveWorkspaceId: workspaceId }
      });
    } catch {}

    // 4. Provision Default Settings
    await workspaceSettingsRepository.create({
      workspaceId,
      theme: "system",
      accentColor: "#000000",
      features: ["events", "guests", "analytics"],
    });

    await brandingSettingsRepository.create({
      workspaceId,
      primaryColor: "#000000",
    });

    await scannerSettingsRepository.create({
      workspaceId,
      offlineEnabled: false,
      autoSync: true,
    });

    await registrationSettingsRepository.create({
      workspaceId,
      requireApproval: false,
      allowWaitlist: false,
    });

    // 5. Audit Log
    await AuditService.log(userId, "WORKSPACE_CREATED", { name, slug }, workspaceId);

    return workspace;
  }

  static async inviteMember(
    workspaceId: string,
    email: string,
    role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer',
    invitedBy: string
  ) {
    // 1. Check if user is already a member
    const user = await userRepository.findOne({ email });
    if (user) {
      const existingMemberships = await membershipRepository.findMany({ workspaceId, userId: user._id as string });
      if (existingMemberships.length > 0) {
        throw new Error("User is already a member of this workspace.");
      }
    }

    // 2. Invalidate existing pending invites for this email + workspace
    await inviteRepository.invalidateByEmailAndWorkspace(email, workspaceId);

    // 3. Generate token and create invite
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const invite = await inviteRepository.create({
      workspaceId,
      email,
      role,
      token,
      invitedBy,
      status: "pending",
      expiresAt
    });

    // 4. Audit Log
    await AuditService.log(invitedBy, "INVITE_CREATED", { email, role }, workspaceId);

    // 5. Broadcast real-time event (for optimistic UI updates/polling to pick up)
    await RealtimeService.broadcast(`workspace_${workspaceId}`, "invite_created", { inviteId: invite._id });

    // 6. Send the actual email
    await EmailService.sendWorkspaceInvite(workspaceId, email, role, token);

    return invite;
  }

  static async acceptInvite(token: string, userId: string) {
    return withTransaction(() => this.consumeInvite(token, userId));
  }

  private static async consumeInvite(token: string, userId: string) {
    // 1. Find pending invite
    const invite = await inviteRepository.findByToken(token);
    if (!invite) throw new Error("Invalid or expired invite token.");
    const user = await userRepository.findById(userId);
    if (!user?.emailVerified || !user?.email || normalizeEmail(user.email) !== normalizeEmail(invite.email)) {
      throw new Error("Sign in with the email address this invitation was sent to.");
    }

    if (new Date() > new Date(invite.expiresAt)) {
      await inviteRepository.update(invite._id as string, { status: "expired" });
      throw new Error("Invite has expired.");
    }

    // 2. Check for existing membership to prevent duplicates
    const existingMemberships = await membershipRepository.findMany({
      userId,
      workspaceId: invite.workspaceId
    });

    if (existingMemberships.length > 0) {
      // User is already a member! Do not consume the invite, tell them they need to log out.
      throw new Error("You are already a member of this workspace. If you are trying to accept an invite for a different account, please sign out first.");
    }

    // 3. Create membership
    await membershipRepository.create({
      userId,
      workspaceId: invite.workspaceId,
      role: invite.role,
    });

    // 4. Update invite status
    const consumed = await (await collection("workspace_invites")).updateOne({ _id: new ObjectId(invite._id), status: "pending", expiresAt: { $gt: new Date() } }, { $set: { status: "accepted" } });
    if (!consumed.modifiedCount) throw new Error("Invitation already used or expired");

    // 5. Audit Log
    await AuditService.log(userId, "INVITE_ACCEPTED", { inviteId: invite._id }, invite.workspaceId);

    // 6. Broadcast real-time event
    await RealtimeService.broadcast(`workspace_${invite.workspaceId}`, "invite_accepted", { inviteId: invite._id, userId });

    return { workspaceId: invite.workspaceId };
  }

  static async revokeInvite(workspaceId: string, inviteId: string, userId: string) {
    const invite = await inviteRepository.findById(inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.workspaceId !== workspaceId) throw new Error("Invite does not belong to this workspace");

    await inviteRepository.delete(inviteId);

    // Audit Log
    await AuditService.log(userId, "INVITE_REVOKED", { inviteId, email: invite.email }, workspaceId);

    // Broadcast real-time event
    await RealtimeService.broadcast(`workspace_${workspaceId}`, "invite_revoked", { inviteId });

    return true;
  }

  static async deleteWorkspace(userId: string, workspaceId: string) {
    // 1. Verify user is owner
    const memberships = await membershipRepository.findMany({ workspaceId, userId, role: "owner" });
    if (memberships.length === 0) {
      throw new Error("Only workspace owners can delete a workspace.");
    }

    await DataLifecycleService.removeWorkspace(workspaceId);
    // Audit Log
    await AuditService.log(userId, "WORKSPACE_DELETED", { workspaceId }, workspaceId);

    return true;
  }
}
