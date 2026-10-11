/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  User,
  LayoutDashboard,
  QrCode,
  CreditCard,
  ScanLine,
  Clock,
  History,
  BarChart,
  StickyNote,
  Settings,
  CheckCircle2,
  XCircle,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const TABS = [
  { name: "Overview", href: "", icon: LayoutDashboard },
  { name: "Badge", href: "/badge", icon: CreditCard },
];

const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
      approved: "bg-green-500/10 text-green-600 border-transparent",
      pending: "bg-yellow-500/10 text-yellow-600 border-transparent",
      checked_in: "bg-blue-500/10 text-blue-600 border-transparent",
    };
    return (
      <Badge variant="outline" className={`capitalize ${styles[status] || "bg-muted text-muted-foreground"}`}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

export default function GuestProfileLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string; guestId: string }>
}) {
  const { eventId, guestId } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: guest } = useQuery({
    queryKey: ["guest", eventId, guestId],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/${guestId}`);
      const json = await res.json();
      return json.data;
    }
  });

  if (!guest) return null; // or skeleton



  const handleStatusChange = async (status: string) => {
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/${guestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Guest status updated to ${status}`);
      queryClient.invalidateQueries({ queryKey: ["guest", eventId, guestId] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/${guestId}/checkin`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to check in");
      toast.success("Guest checked in successfully");
      queryClient.invalidateQueries({ queryKey: ["guest", eventId, guestId] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleGenerateQR = async () => {
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/${guestId}/qr`, { method: "POST" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate QR");
      }
      toast.success("QR Code generated successfully");
      queryClient.invalidateQueries({ queryKey: ["guest", eventId, guestId] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="p-6 pb-0">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/events/${eventId}/guests`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="text-sm font-medium text-muted-foreground">
              Guest Profile
            </div>
          </div>

          <div className="flex items-start justify-between pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-secondary-foreground">
                {guest.firstName?.charAt(0)}{guest.lastName?.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {guest.firstName} {guest.lastName}
                </h1>
                <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                  <span>{guest.email || "No email provided"}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>
                    {[
                      guest.title || guest.role || (guest.customData && Object.entries(guest.customData).find(([k]) => k.toLowerCase().includes('role') || k.toLowerCase().includes('title') || k.toLowerCase().includes('job'))?.[1] as string),
                      guest.organization || guest.company || (guest.customData && Object.entries(guest.customData).find(([k]) => k.toLowerCase().includes('company') || k.toLowerCase().includes('org') || k.toLowerCase().includes('business'))?.[1] as string)
                    ].filter(Boolean).join(" @ ") || "Independent"}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <StatusBadge status={guest.status} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCheckIn}>Check In</Button>
              <Button variant="outline" size="sm" onClick={handleGenerateQR} disabled={!!guest.qrCodeId}>Generate QR</Button>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStatusChange("approved")}>Approve</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("rejected")}>Reject</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange("archived")}>Archive Guest</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="px-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const href = `/events/${eventId}/guests/${guestId}${tab.href}`;
            const isActive = pathname === href || (tab.href !== "" && pathname.startsWith(href));

            return (
              <Link
                key={tab.name}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/10">
        {children}
      </div>
    </div>
  );
}
