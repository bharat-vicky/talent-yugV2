"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { QueryProvider } from "./query-provider";
import { WorkspaceProvider } from "./workspace-provider";

import { SmoothScrollProvider } from "./smooth-scroll-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <AuthProvider>
        <QueryProvider>
          <WorkspaceProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </WorkspaceProvider>
        </QueryProvider>
      </AuthProvider>
    </SmoothScrollProvider>
  );
}
