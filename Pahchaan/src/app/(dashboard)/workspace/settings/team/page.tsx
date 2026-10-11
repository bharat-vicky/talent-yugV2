import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveWorkspaceData } from "@/lib/workspace";
import { membershipRepository } from "@/infrastructure/repositories/MembershipRepository";
import { userRepository } from "@/infrastructure/repositories/UserRepository";
import { Button } from "@/components/ui/button";
import { Shield, MoreVertical } from "lucide-react";
import { InviteMemberModal } from "./components/InviteMemberModal";
import { PendingInvitationsList } from "./components/PendingInvitationsList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MemberActions } from "./components/MemberActions";

export default async function TeamSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { activeWorkspace } = await getActiveWorkspaceData(session.user.id);
  if (!activeWorkspace) return null;

  const allMemberships = await membershipRepository.findMany({ workspaceId: activeWorkspace._id!.toString() });
  
  // Fetch user details for all members
  const memberDetails = await Promise.all(allMemberships.map(async (m) => {
    let user = await userRepository.findById(m.userId);
    
    // Fallback to session data if the current user's DB record is missing
    if (!user && m.userId === session.user?.id) {
      user = {
        _id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      };
    }
    
    return {
      membership: m,
      user
    };
  }));

  const currentUserMembership = allMemberships.find(m => m.userId === session.user?.id);
  const currentUserRole = currentUserMembership?.role || 'member';

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-10 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage who has access to this workspace and their roles.</p>
        </div>
        {['owner', 'admin'].includes(currentUserRole) && (
          <InviteMemberModal workspaceId={activeWorkspace._id!.toString()} />
        )}
      </div>

      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-0 rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Active Members</h2>
              <p className="text-sm text-muted-foreground mt-1">Users currently in the workspace.</p>
            </div>
            <Badge variant="secondary" className="bg-zinc-200/50 text-zinc-700 font-medium px-2 py-0.5 border-none">
              {allMemberships.length} Collaborators
            </Badge>
          </div>
          
          <div className="flex flex-col">
            {memberDetails.map(({ membership: m, user }, index) => {
              const isCurrentUser = m.userId === session.user?.id;
              
              return (
                <div key={m._id!.toString()} className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 ${index !== memberDetails.length - 1 ? 'border-b border-zinc-100' : ''}`}>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border border-zinc-200">
                      <AvatarImage src={user?.image || ""} />
                      <AvatarFallback className="bg-zinc-100 text-zinc-600 font-medium">
                        {user?.name ? user.name.charAt(0) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {user?.name || "Unknown User"}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold text-zinc-500 border-zinc-200 px-1.5 py-0">You</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{user?.email || `ID: ${m.userId.substring(0,8)}`}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end w-full sm:w-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-xs font-medium text-zinc-700 capitalize border border-zinc-200/60">
                      {m.role === 'owner' && <Shield className="w-3.5 h-3.5 text-zinc-900" />}
                      {m.role}
                    </span>
                    <MemberActions 
                      membershipId={m._id!.toString()} 
                      workspaceId={activeWorkspace._id!.toString()}
                      currentRole={m.role}
                      currentUserRole={currentUserRole}
                      isCurrentUser={isCurrentUser}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <PendingInvitationsList 
          workspaceId={activeWorkspace._id!.toString()} 
          currentUserRole={currentUserRole} 
        />
      </div>
    </div>
  );
}
