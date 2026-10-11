"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Library, Palette, LayoutTemplate, Download, BarChart, Settings } from "lucide-react";
import { useEvent } from "@/providers/event-provider";

export default function QRStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { event } = useEvent();
  const eventId = event._id;

  const tabs = [
    { name: "Overview", href: `/events/${eventId}/qr`, icon: LayoutDashboard },
    { name: "Library", href: `/events/${eventId}/qr/library`, icon: Library },
    { name: "Templates", href: `/events/${eventId}/qr/templates`, icon: LayoutTemplate },
    { name: "Downloads", href: `/events/${eventId}/qr/downloads`, icon: Download },
    { name: "Analytics", href: `/events/${eventId}/qr/analytics`, icon: BarChart },
  ];

  const isDesignStudio = pathname.includes("/design");

  return (
    <div className="flex flex-col bg-background h-screen">
      {/* QR Studio Header Navigation (Hidden in Design Studio) */}
      {!isDesignStudio && (
        <div className="border-b border-border bg-card/50 px-6 py-3">
        <div className="flex items-center space-x-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== `/events/${eventId}/qr` && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
