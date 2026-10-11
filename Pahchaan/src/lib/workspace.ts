import { cookies } from "next/headers";
import { membershipRepository } from "@/infrastructure/repositories/MembershipRepository";
import { workspaceRepository } from "@/infrastructure/repositories/WorkspaceRepository";
import getMongoClient from "@/infrastructure/db";
import { ObjectId } from "mongodb";
import { Workspace, Membership } from "@/domain/types";

export async function getActiveWorkspaceData(userId: string): Promise<{
  memberships: Membership[];
  activeMembership: Membership | null;
  activeWorkspace: Workspace | null;
  validWorkspaces: Workspace[];
}> {
  const memberships = await membershipRepository.findByUserId(userId);
  if (!memberships.length) {
    return { memberships: [], activeMembership: null, activeWorkspace: null, validWorkspaces: [] };
  }

  // 1. Check database for canonical lastActiveWorkspaceId (cross-device source of truth)
  let dbLastActiveWorkspaceId: string | undefined;
  try {
    const client = await getMongoClient();
    let userQuery: Record<string, unknown> = { _id: userId };
    if (ObjectId.isValid(userId)) {
      userQuery = { $or: [{ _id: new ObjectId(userId) }, { _id: userId }] };
    }
    const dbUser = await client.db().collection("users").findOne(userQuery);
    if (dbUser?.lastActiveWorkspaceId) {
      dbLastActiveWorkspaceId = dbUser.lastActiveWorkspaceId.toString();
    }
  } catch (e) {
    console.error("Error retrieving user lastActiveWorkspaceId:", e);
  }

  // 2. Check cookie (fallback for offline or if DB does not have lastActiveWorkspaceId yet)
  let savedWorkspaceId: string | undefined;
  try {
    const cookieStore = await cookies();
    savedWorkspaceId = cookieStore.get('active-workspace-id')?.value;
  } catch {
    // Outside Next.js request scope
  }

  // Database lastActiveWorkspaceId takes precedence to keep phone and laptop in perfect sync!
  // If not found in DB, fallback to cookie savedWorkspaceId, then the first membership.
  const targetWorkspaceId = dbLastActiveWorkspaceId || savedWorkspaceId;
  let activeMembership = memberships[0];

  if (targetWorkspaceId) {
    const found = memberships.find(m => m.workspaceId.toString() === targetWorkspaceId);
    if (found) {
      activeMembership = found;
    }
  }

  // If DB didn't have lastActiveWorkspaceId recorded, persist it now for seamless multi-device sync
  if (!dbLastActiveWorkspaceId && activeMembership) {
    try {
      const client = await getMongoClient();
      let userQuery: Record<string, unknown> = { _id: userId };
      if (ObjectId.isValid(userId)) {
        userQuery = { $or: [{ _id: new ObjectId(userId) }, { _id: userId }] };
      }
      await client.db().collection("users").updateOne(userQuery, {
        $set: { lastActiveWorkspaceId: activeMembership.workspaceId.toString(), updatedAt: new Date() }
      });
    } catch {}
  }

  const allWorkspaces = await Promise.all(
    memberships.map(m => workspaceRepository.findById(m.workspaceId))
  );
  const validWorkspaces = allWorkspaces.filter((w): w is Workspace => w !== null);
  const activeWorkspace = validWorkspaces.find(w => w._id === activeMembership.workspaceId) || validWorkspaces[0] || null;
  // A deleted workspace's membership must not supply the role for the fallback.
  const resolvedMembership = activeWorkspace
    ? memberships.find(m => m.workspaceId === activeWorkspace._id?.toString()) || null
    : null;

  return {
    memberships,
    activeMembership: resolvedMembership,
    activeWorkspace,
    validWorkspaces,
  };
}
