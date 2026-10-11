/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEvent } from "@/providers/event-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Clock,
  ScanLine,
  Users,
  Percent,
  QrCode,
  Download,
  ExternalLink,
  ShieldCheck,
  Building2,
  Briefcase,
  RotateCcw,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

export default function QRAnalyticsPage() {
  const { event } = useEvent();
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState(false);

  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ["qr-kpis", event._id],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/analytics/kpi`);
      if (!res.ok) throw new Error("Failed to load KPIs");
      return res.json();
    },
    refetchInterval: 3000 // Real-time 3s auto-refresh
  });

  const { data: timeSeries, isLoading: loadingTimeSeries } = useQuery({
    queryKey: ["qr-timeseries", event._id],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/analytics/time-series`);
      if (!res.ok) throw new Error("Failed to load time series data");
      return res.json();
    },
    refetchInterval: 3000 // Real-time 3s auto-refresh
  });

  const handleClearAnalytics = async () => {
    if (!confirm("Are you sure you want to reset all scan analytics and check-in history for this event?")) return;
    setClearing(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/analytics`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to reset analytics");
      toast.success("Analytics and scan counts reset successfully.");
      queryClient.invalidateQueries({ queryKey: ["qr-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["qr-timeseries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setClearing(false);
    }
  };

  const totalDeviceScans = (timeSeries?.devices || []).reduce((acc: number, d: any) => acc + (d.value || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into real-time scan metrics, attendance throughput, and audience behavior.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-500/20 w-fit shadow-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Real-Time Sync
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAnalytics}
            disabled={clearing}
            className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30"
          >
            {clearing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 mr-1.5" />}
            {clearing ? "Resetting..." : "Reset Data"}
          </Button>
        </div>
      </div>

      {/* 3 Real-Time KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Scans */}
        <Card className="border-border/50 shadow-sm bg-card relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Scans</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ScanLine className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingKpis ? (
              <div className="h-9 animate-pulse bg-muted rounded-md w-16"></div>
            ) : (
              <div className="text-3xl font-black text-foreground tracking-tight">{kpis?.totalScans || 0}</div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Live verification actions
            </p>
          </CardContent>
        </Card>

        {/* Unique Guests Verified */}
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unique Verified</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingKpis ? (
              <div className="h-9 animate-pulse bg-muted rounded-md w-16"></div>
            ) : (
              <div className="text-3xl font-black text-foreground tracking-tight">
                {kpis?.uniqueScanned || 0} <span className="text-sm font-semibold text-muted-foreground">/ {kpis?.activeQRs || 0}</span>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">Distinct attendees scanned</p>
          </CardContent>
        </Card>

        {/* Turnout / Verification Rate */}
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verification Rate</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Percent className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingKpis ? (
              <div className="h-9 animate-pulse bg-muted rounded-md w-16"></div>
            ) : (
              <div className="text-3xl font-black text-foreground tracking-tight">{kpis?.verificationRate || 0}%</div>
            )}
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, kpis?.verificationRate || 0))}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SCAN VOLUME OVER TIME */}
        <Card className="border-border/50 shadow-sm bg-card lg:col-span-2">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Scan Volume Over Time</CardTitle>
                <CardDescription>Daily scan activity for the last 30 days</CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {timeSeries?.scans?.length || 0} Active Days
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingTimeSeries ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Clock className="w-8 h-8 animate-pulse mb-4" />
                <p>Loading chart data...</p>
              </div>
            ) : !timeSeries?.scans || timeSeries.scans.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                <p>No scan data available yet.</p>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries.scans} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="_id" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      domain={[0, (dataMax: number) => Math.max(dataMax, 4)]}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border rounded-xl px-3.5 py-2 shadow-xl text-xs">
                              <div className="font-semibold text-foreground">{data._id || data.name}</div>
                              <div className="text-primary font-bold mt-0.5">{data.scans || data.value} scan{data.scans === 1 ? '' : 's'}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="scans" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DEVICE BREAKDOWN */}
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Operating systems & scanners</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingTimeSeries ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Clock className="w-8 h-8 animate-pulse mb-4" />
                <p>Loading chart data...</p>
              </div>
            ) : !timeSeries?.devices || timeSeries.devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                <p>No device data available.</p>
              </div>
            ) : (
              <div className="h-[300px] w-full relative">
                {/* Center Badge inside Donut Hole */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">{kpis?.totalScans || totalDeviceScans || 0}</span>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Total Scans</span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={timeSeries.devices}
                      cx="50%"
                      cy="42%"
                      innerRadius={65}
                      outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={2}
                      stroke="var(--card)"
                    >
                      {timeSeries.devices.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const count = Number(data.value) || 0;
                          const pct = totalDeviceScans > 0 ? Math.round((count / totalDeviceScans) * 100) : 0;
                          return (
                            <div className="bg-popover border border-border rounded-xl px-3.5 py-2 shadow-xl text-xs">
                              <span className="font-semibold text-foreground">{data.name}: </span>
                              <span className="text-primary font-bold">{count} ({pct}%)</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => {
                        const item = (timeSeries.devices || []).find((d: any) => (d.name || d._id) === value);
                        const count = item?.value || 0;
                        const pct = totalDeviceScans > 0 ? Math.round((count / totalDeviceScans) * 100) : 0;
                        return (
                          <span className="text-xs text-muted-foreground font-medium">
                            {value} <span className="text-foreground font-bold">({count} • {pct}%)</span>
                          </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* LIVE VERIFICATION STREAM TABLE */}
      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Live Verification Stream</CardTitle>
              <CardDescription>Recently verified attendees across all terminals</CardDescription>
            </div>
            <Link href={`/events/${event._id}/guests`}>
              <Button variant="ghost" size="sm" className="text-xs font-semibold">
                View All Guests <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-0">
          {!kpis?.liveVerifications || kpis.liveVerifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No live scans recorded yet. Start scanning badges from the Scanner page to see attendee verifications stream here in real-time.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="px-6 py-3">Attendee</th>
                    <th className="px-6 py-3">Role / Title</th>
                    <th className="px-6 py-3">Company</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Scanned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kpis.liveVerifications.map((item: any) => (
                    <tr key={item._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold text-xs flex items-center justify-center shrink-0">
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.email || item.phone || "Verified Attendee"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {item.title ? (
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                            {item.title}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {item.organization ? (
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            {item.organization}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] font-semibold capitalize">
                          Verified Check-in
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-muted-foreground font-medium">
                        {item.timestamp ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true }) : "Just now"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
