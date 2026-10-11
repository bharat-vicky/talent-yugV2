"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoreVertical, Check, Trash2, Shield, User } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface MemberActionsProps {
  membershipId: string;
  workspaceId: string;
  currentRole: string;
  currentUserRole: string;
  isCurrentUser: boolean;
}

export function MemberActions({ membershipId, workspaceId, currentRole, currentUserRole, isCurrentUser }: MemberActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const updateRole = async (newRole: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/pahchaan/api/workspaces/${workspaceId}/members/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        toast.success(`Role updated to ${newRole}`);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update role");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async () => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/pahchaan/api/workspaces/${workspaceId}/members/${membershipId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Member removed");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: "manager", label: "Manager", icon: Shield },
    { id: "member", label: "Member", icon: User },
    { id: "viewer", label: "Viewer", icon: User }
  ];

  // RBAC checks for frontend UI
  // Owner can edit anyone (including duplicate memberships of themselves, but NOT their own owner membership)
  // Admin can edit managers, members, viewers (but not owners)
  // Manager can edit members, viewers (but not owners, admins, managers)
  const canManage = () => {
    // Prevent modifying the owner membership of the current user
    if (isCurrentUser && currentRole === 'owner') return false;
    
    // Normal checks
    if (currentUserRole === 'owner') return true;
    if (isCurrentUser) return false; // Other roles cannot edit their own memberships here
    
    if (currentUserRole === 'admin' && currentRole !== 'owner') return true;
    if (currentUserRole === 'manager' && ['member', 'viewer'].includes(currentRole)) return true;
    return false;
  };

  if (!canManage()) {
    // If they can't manage, we just don't render the MoreVertical dropdown button
    // But since the design might look weird if the column is totally empty, we can just return null
    // or return a disabled button. Let's return null to keep it clean.
    return <div className="w-8 h-8"></div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" disabled={isLoading} />
      }>
        <MoreVertical className="w-4 h-4" />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Edit Role</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {roles.map((r) => (
                <DropdownMenuItem 
                  key={r.id} 
                  onClick={() => updateRole(r.id)}
                  className="flex items-center justify-between"
                  disabled={isLoading}
                >
                  <div className="flex items-center">
                    <r.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>{r.label}</span>
                  </div>
                  {currentRole === r.id && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        
        {!isCurrentUser && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive" 
              onClick={removeMember}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Member
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
