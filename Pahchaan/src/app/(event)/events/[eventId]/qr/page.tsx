"use client";

import { useEvent } from "@/providers/event-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  QrCode, 
  ScanLine, 
  Download, 
  ArrowRight, 
  Library, 
  LayoutTemplate, 
  Sparkles,
  Camera,
  BarChart3,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function QROverviewPage() {
  const { event } = useEvent();
  
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ["qr-kpis", event._id],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/analytics/kpi`);
      if (!res.ok) throw new Error("Failed to fetch KPIs");
      return res.json();
    },
    refetchInterval: 2000,
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ["qr-recent", event._id],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr?limit=5`);
      if (!res.ok) throw new Error("Failed to fetch recent QRs");
      const data = await res.json();
      return data.qrs;
    },
    refetchInterval: 2000,
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-card border border-border/60 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">QR Studio</h1>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Manage badges, custom QR codes, templates, and real-time attendance scans for {event.name}.</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href={`/events/${event._id}/qr/library`}>
            <Button variant="outline" size="sm" className="font-semibold">
              <Library className="mr-2 h-4 w-4 text-muted-foreground" /> QR Library
            </Button>
          </Link>
          <Link href={`/events/${event._id}/qr/new/design`}>
            <Button size="sm" className="font-semibold shadow-xs">
              <Sparkles className="mr-2 h-4 w-4" /> Create New QR Code
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Total QR Codes */}
        <Card className="border-border/60 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total QR Codes
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
              <QrCode className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {kpiLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1"></div>
            ) : (
              <div className="text-3xl font-black tracking-tight text-foreground">{kpis?.totalQRs ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              Active codes generated for event tickets & badges
            </p>
          </CardContent>
        </Card>

        {/* Total Scans */}
        <Card className="border-border/60 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Scans (All Time)
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ScanLine className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {kpiLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1"></div>
            ) : (
              <div className="text-3xl font-black tracking-tight text-foreground">{kpis?.totalScans ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Live verification actions across all doors
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Balanced 12-column Main Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Activity (8 cols) */}
        <Card className="lg:col-span-8 border-border/60 shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div>
                <CardTitle className="text-base font-bold">Recent QR Activity</CardTitle>
                <CardDescription className="text-xs mt-0.5">Recently created and updated event QR codes</CardDescription>
              </div>
              <Link href={`/events/${event._id}/qr/library`}>
                <Button variant="ghost" size="sm" className="text-xs font-semibold">
                  View Library <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {recentLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl"></div>)}
                </div>
              ) : !recent || recent.length === 0 ? (
                <div className="text-sm text-muted-foreground py-14 text-center border-2 border-dashed border-border/60 rounded-xl">
                  <QrCode className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-foreground">No custom QR codes created yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Design customized badge tickets with your brand logo and styles.</p>
                  <div className="mt-4">
                    <Link href={`/events/${event._id}/qr/new/design`}>
                      <Button size="sm" className="font-semibold">Create your first QR Code</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent.map((qr: { _id: string; name: string; createdAt: string; scanCount: number }, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 border border-border/60 rounded-xl hover:bg-muted/30 transition-all">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
                          <QrCode className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{qr.name || "Untitled QR Code"}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(qr.createdAt), "MMM d, yyyy • h:mm a")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-1">
                          {qr.scanCount || 0} scans
                        </Badge>
                        <Link href={`/events/${event._id}/qr/${qr._id}/design`}>
                          <Button variant="outline" size="sm" className="text-xs font-semibold h-8">Edit</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Right Column: Quick Resources & Actions (4 cols) */}
        <Card className="lg:col-span-4 border-border/60 shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
              <CardDescription className="text-xs mt-0.5">Shortcuts to QR tools & workflows</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Link href={`/events/${event._id}/scanner`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors border border-border/60 group">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Camera className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    Scanner Terminal <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </p>
                  <p className="text-xs text-muted-foreground truncate">Live check-in gate terminal</p>
                </div>
              </Link>

              <Link href={`/events/${event._id}/qr/analytics`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors border border-border/60 group">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    QR Analytics <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </p>
                  <p className="text-xs text-muted-foreground truncate">Detailed charts & devices</p>
                </div>
              </Link>

              <Link href={`/events/${event._id}/qr/templates`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors border border-border/60 group">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    Templates Gallery <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </p>
                </div>
              </Link>

              <Link href={`/events/${event._id}/qr/downloads`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors border border-border/60 group">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 border border-orange-500/20">
                  <Download className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    Download Center <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </p>
                  <p className="text-xs text-muted-foreground truncate">Export badges in bulk</p>
                </div>
              </Link>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
