"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "General", href: "/workspace/settings" },
  { name: "Team", href: "/workspace/settings/team" },
];

export function WorkspaceSettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6 border-b border-border/50 px-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "pb-3 text-sm font-medium transition-colors border-b-2",
              isActive 
                ? "border-foreground text-foreground" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
