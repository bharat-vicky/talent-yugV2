import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveWorkspaceData } from "@/lib/workspace";
import { membershipRepository } from "@/infrastructure/repositories/MembershipRepository";
import { userRepository } from "@/infrastructure/repositories/UserRepository";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { format } from "date-fns";
import { GeneralSettingsForm } from "./components/GeneralSettingsForm";
import { DeleteWorkspaceButton } from "@/components/dashboard/DeleteWorkspaceButton";

export const dynamic = "force-dynamic";

export default async function WorkspaceSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { activeWorkspace } = await getActiveWorkspaceData(session.user.id);
  if (!activeWorkspace) return null;

  const allMemberships = await membershipRepository.findByWorkspaceId(activeWorkspace._id!.toString());
  const ownerMembership = allMemberships.find(m => m.role === "owner") || allMemberships[0];
  const ownerUser = await userRepository.findById(ownerMembership.userId);

  const createdAt = activeWorkspace.createdAt ? format(new Date(activeWorkspace.createdAt), "MMM yyyy") : "Unknown";

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-10 pb-12">
      
      {/* 1. Workspace Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border/50">
        <div className="flex items-center gap-6">
          <Avatar className="w-20 h-20 border border-border/50 shadow-sm rounded-2xl">
            {activeWorkspace.logo ? (
              <AvatarImage src={activeWorkspace.logo} alt={activeWorkspace.name} className="object-cover" />
            ) : null}
            <AvatarFallback className="text-3xl rounded-2xl bg-muted/50 text-muted-foreground font-medium">
              {activeWorkspace.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{activeWorkspace.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1.5">
              <span>pahchaan / {activeWorkspace.slug}</span>
              <span className="text-border/50">•</span>
              <span>Owned by {ownerUser?.name || "Unknown"}</span>
              <span className="text-border/50">•</span>
              <span>Created {createdAt}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 flex flex-col gap-10">
          
          {/* 2. General Information Card */}
          <GeneralSettingsForm workspace={{ _id: activeWorkspace._id!.toString(), name: activeWorkspace.name, slug: activeWorkspace.slug }} />

          {/* 3. Workspace Preferences */}
          {/* Kept out for now as the user explicitly asked to "Remove Language, Date Format, Timezone unless they are already implemented and actively used elsewhere in the application." */}
          {/* In Identify, we don't actively use Date Format / Timezone globally right now, but the user plan had it. The latest prompt from the user said "Remove: Website, Language, Date Format, Timezone unless they are already implemented". Let's omit them to follow the latest instructions closely. */}

        </div>

        <div className="lg:col-span-1 flex flex-col gap-10">
          
          {/* 4. Members Summary Preview */}
          <section className="flex flex-col gap-5 p-6 rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Members</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage your team access.</p>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-zinc-200">
                  <AvatarImage src={ownerUser?.image || ""} />
                  <AvatarFallback className="bg-zinc-100 text-zinc-600 text-sm">
                    {ownerUser?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{ownerUser?.name || "Unknown"}</span>
                  <span className="text-xs text-zinc-500">{allMemberships.length} Total Members</span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-zinc-200/50 hover:bg-zinc-200/50 text-zinc-700 font-medium px-2 py-0.5 border-none">
                Owner
              </Badge>
            </div>
            
            <div className="pt-2">
              <Link href="/workspace/settings/team" className="w-full">
                <Button variant="outline" className="w-full justify-center h-10 bg-white border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-sm">
                  Manage Members &rarr;
                </Button>
              </Link>
            </div>
          </section>

          {/* 5. Danger Zone */}
          <section className="flex flex-col gap-5 p-6 rounded-2xl border border-red-200/60 bg-red-50/30 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-red-600">Danger Zone</h2>
              <p className="text-sm text-red-600/80 mt-1">This action cannot be undone.</p>
            </div>
            
            <div className="pt-2 border-t border-red-200/60">
              <DeleteWorkspaceButton workspaceId={activeWorkspace._id!.toString()} />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
