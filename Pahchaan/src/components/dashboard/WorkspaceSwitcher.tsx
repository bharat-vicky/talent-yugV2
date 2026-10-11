"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Workspace } from "@/domain/types";

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  isSidebarCollapsed?: boolean;
  className?: string;
}

export function WorkspaceSwitcher({ workspaces, activeWorkspace, isSidebarCollapsed = false, className }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSelect = async (workspaceId: string) => {
    // Set cookie to remember the active workspace immediately

    setOpen(false);

    // Persist to backend MongoDB so phone and laptop stay 100% in sync
    try {
      const response = await fetch("/pahchaan/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (!response.ok) throw new Error("Workspace switch rejected");
    } catch (e) {
      console.error("Failed to persist active workspace to backend:", e);
      return;
    }

    // Refresh view
    if (window.location.pathname.startsWith("/pahchaan/events/") && window.location.pathname !== "/pahchaan/events/create") {
      window.location.assign("/pahchaan/events");
    } else {
      window.location.reload();
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger render={
        <Button
          variant="outline"
          role="combobox"
          className={className || `w-full h-10 font-normal ${isSidebarCollapsed ? "px-0 justify-center" : "justify-between px-3"}`}
        />
      }>
        <div className="flex items-center gap-2 truncate">
          {activeWorkspace.logo ? (
            <Image src={activeWorkspace.logo} alt="" width={20} height={20} className="shrink-0 rounded-sm" />
          ) : (
            <div className="w-5 h-5 shrink-0 rounded-sm bg-muted flex items-center justify-center text-[10px] font-medium uppercase">
              {activeWorkspace.name.substring(0, 1)}
            </div>
          )}
          {!isSidebarCollapsed && <span className="truncate">{activeWorkspace.name}</span>}
        </div>
        {!isSidebarCollapsed && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[240px]" align={isSidebarCollapsed ? "start" : "center"} side={isSidebarCollapsed ? "right" : "bottom"}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Your Workspaces
          </DropdownMenuLabel>
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws._id as string}
              onClick={() => handleSelect(ws._id as string)}
              className="flex items-center gap-2 cursor-pointer py-2"
            >
              {ws.logo ? (
                <Image src={ws.logo} alt="" width={16} height={16} className="shrink-0 rounded-sm" />
              ) : (
                <div className="w-4 h-4 shrink-0 rounded-sm bg-muted flex items-center justify-center text-[8px] font-medium uppercase">
                  {ws.name.substring(0, 1)}
                </div>
              )}
              <span className="truncate flex-1 font-medium">{ws.name}</span>
              {activeWorkspace._id === ws._id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setOpen(false);
            router.push('/onboarding');
          }}
          className="cursor-pointer py-2 text-primary focus:text-primary focus:bg-primary/10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
