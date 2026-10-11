"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function DeleteWorkspaceButton({ workspaceId }: { workspaceId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you absolutely sure you want to delete this workspace? This action cannot be undone and will permanently delete all events, members, and data associated with it.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/pahchaan/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to delete workspace");
      
      toast.success("Workspace deleted successfully");
      
      // Clear active workspace cookie
      document.cookie = "active-workspace-id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      
      // Redirect to dashboard (which will redirect to onboarding if no workspaces left)
      window.location.href = "/pahchaan/dashboard";
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      variant="destructive" 
      onClick={handleDelete}
      disabled={isDeleting}
      className="w-full justify-center h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      Delete Workspace
    </Button>
  );
}
