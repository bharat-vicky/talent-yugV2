"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { workspaceRepository } from "@/infrastructure/repositories/WorkspaceRepository";
import { membershipRepository } from "@/infrastructure/repositories/MembershipRepository";
import { revalidatePath } from "next/cache";

export async function updateWorkspace(workspaceId: string, data: { name: string; slug: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Unauthorized" };

    const memberships = await membershipRepository.findByUserId(session.user.id);
    const membership = memberships.find(m => m.workspaceId === workspaceId);
    if (!membership || membership.role !== "owner") {
      return { error: "Only workspace owners can update settings" };
    }

    // Check slug uniqueness if it changed
    const existing = await workspaceRepository.findById(workspaceId);
    if (!existing) return { error: "Workspace not found" };

    if (existing.slug !== data.slug) {
      const slugTaken = await workspaceRepository.findBySlug(data.slug);
      if (slugTaken) return { error: "Slug is already taken" };
    }

    await workspaceRepository.update(workspaceId, {
      name: data.name,
      slug: data.slug,
      updatedAt: new Date(),
    });

    revalidatePath("/workspace/settings");
    revalidatePath("/workspace/settings/team");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update workspace", error);
    return { error: "An unexpected error occurred" };
  }
}
