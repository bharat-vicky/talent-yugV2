"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Clock, Shield, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WorkspaceInvite } from "@/domain/types";

export function PendingInvitationsList({ workspaceId, currentUserRole }: { workspaceId: string, currentUserRole: string }) {
  const queryClient = useQueryClient();

  const { data: invites, isLoading, error } = useQuery({
    queryKey: ['workspace-invites', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/workspaces/${workspaceId}/invites`);
      if (!res.ok) throw new Error("Failed to fetch invitations");
      return (await res.json()) as WorkspaceInvite[];
    },
    refetchInterval: 5000, // Poll every 5 seconds for real-time feel
    enabled: currentUserRole === 'owner' || currentUserRole === 'admin',
  });

  const deleteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetch(`/pahchaan/api/workspaces/${workspaceId}/invites/${inviteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke invitation");
      }
      return inviteId;
    },
    onSuccess: (deletedInviteId) => {
      queryClient.setQueryData(
        ['workspace-invites', workspaceId],
        (old: WorkspaceInvite[] | undefined) => old?.filter(i => i._id !== deletedInviteId)
      );
      toast.success("Invitation revoked");
    }
  });

  if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return null;
  if (isLoading) {
    return (
      <section className="flex flex-col gap-0 rounded-2xl border border-zinc-200 border-dashed bg-white shadow-sm overflow-hidden opacity-70">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 border-dashed">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">Pending Invitations</h2>
            <p className="text-sm text-muted-foreground mt-1">Invites that have not been accepted yet.</p>
          </div>
        </div>
        <div className="p-10 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      </section>
    );
  }

  if (error) {
    return null; // Or show error state
  }

  return (
    <section className="flex flex-col gap-0 rounded-2xl border border-zinc-200 border-dashed bg-white shadow-sm overflow-hidden opacity-70">
      <div className="flex items-center justify-between p-6 border-b border-zinc-100 border-dashed">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">Pending Invitations</h2>
          <p className="text-sm text-muted-foreground mt-1">Invites that have not been accepted yet.</p>
        </div>
      </div>
      
      {!invites || invites.length === 0 ? (
        <div className="p-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <Mail className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-600 mb-1">No pending invitations</p>
          <p className="text-xs text-muted-foreground max-w-sm">When you invite team members, they will appear here until they accept the invitation.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {invites.map((invite, index) => (
            <div key={invite._id as string} className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 ${index !== invites.length - 1 ? 'border-b border-zinc-100 border-dashed' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{invite.email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5">Invited {new Date(invite.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end w-full sm:w-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-xs font-medium text-zinc-700 capitalize border border-zinc-200/60">
                  {invite.role === 'owner' && <Shield className="w-3.5 h-3.5 text-zinc-900" />}
                  {invite.role}
                </span>
                
                {['owner', 'admin'].includes(currentUserRole) && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => deleteMutation.mutate(invite._id as string)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending && deleteMutation.variables === invite._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
