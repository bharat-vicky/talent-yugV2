"use client";

import { useEvent } from "@/providers/event-provider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";
import { 
  Bell,
  CheckCircle2, 
  Trash2, 
  RefreshCw, 
  UserPlus, 
  ScanLine, 
  FileDown, 
  UploadCloud, 
  QrCode, 
  Mail, 
  Globe, 
  Sliders, 
  Activity, 
  Check, 
  Clock
} from "lucide-react";
import { EventNotification, NotificationType, NotificationSettings } from "@/domain/types";
import { formatDistanceToNow, format } from "date-fns";

export default function NotificationsPage() {
  const { event } = useEvent();
  const eventId = event._id as string;

  const [activeTab, setActiveTab] = useState<string>("feed");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  
  const [loadingFeed, setLoadingFeed] = useState<boolean>(true);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch Feed
  const fetchFeed = async (isBackground: boolean = false) => {
    if (!eventId) return;
    if (!isBackground) setRefreshing(true);
    try {
      const typeParam = selectedFilter !== "all" ? `&type=${selectedFilter}` : "";
      const res = await fetch(`/pahchaan/api/events/${eventId}/notifications/feed?limit=100${typeParam}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        if (!isBackground) {
          toast.success("Live feed refreshed");
        }
      }
    } catch {
      if (!isBackground) toast.error("Failed to load notifications feed");
    } finally {
      setLoadingFeed(false);
      if (!isBackground) setRefreshing(false);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    if (!eventId) return;
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      toast.error("Failed to load notification settings");
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    const controller=new AbortController();
    fetch(`/pahchaan/api/events/${eventId}/notifications/feed?limit=100${selectedFilter!=="all"?`&type=${selectedFilter}`:""}`,{signal:controller.signal}).then(r=>r.json()).then(data=>{setNotifications(data.notifications||[]);setUnreadCount(data.unreadCount||0);}).finally(()=>setLoadingFeed(false)).catch(()=>{});
    fetch(`/pahchaan/api/events/${eventId}/notifications`,{signal:controller.signal}).then(r=>r.json()).then(setSettings).finally(()=>setLoadingSettings(false)).catch(()=>{});
    // Real-time polling every 2.5 seconds for instant updates
    const interval = setInterval(() => fetchFeed(true), 2500);
    return () => {controller.abort();clearInterval(interval);};
  }, [eventId, selectedFilter]);

  const handleMarkAllRead = async () => {
    // Optimistic UI update
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/notifications/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (res.ok) {
        toast.success("All notifications marked as read");
      }
    } catch {
      toast.error("Failed to mark notifications as read");
      fetchFeed(true);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/pahchaan/api/events/${eventId}/notifications/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id }),
      });
    } catch {
      fetchFeed(true);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const prevNotifications = [...notifications];
    // Optimistic UI update
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    toast.success("Notification deleted");

    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/notifications/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (!res.ok) {
        setNotifications(prevNotifications);
        toast.error("Failed to delete notification");
      }
    } catch {
      setNotifications(prevNotifications);
      toast.error("Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    const prevNotifications = [...notifications];
    const prevUnread = unreadCount;

    // Optimistic instant clear
    setNotifications([]);
    setUnreadCount(0);
    toast.success("Notification history cleared");

    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/notifications/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_all" }),
      });
      if (!res.ok) {
        setNotifications(prevNotifications);
        setUnreadCount(prevUnread);
        toast.error("Failed to clear notification history");
      }
    } catch {
      setNotifications(prevNotifications);
      setUnreadCount(prevUnread);
      toast.error("Failed to clear notification history");
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: unknown) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("Notification configuration saved successfully");
      } else {
        toast.error("Failed to save notification settings");
      }
    } catch {
      toast.error("An error occurred while saving settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "registration":
        return <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case "qr_scanned":
        return <ScanLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "report_exported":
        return <FileDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "guests_imported":
        return <UploadCloud className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case "qr_generated":
        return <QrCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "invitation_sent":
        return <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />;
    }
  };

  const filterButtons = useMemo(
    () => [
      { id: "all", label: "All Activity", icon: Activity },
      { id: "registration", label: "Registrations", icon: UserPlus },
      { id: "qr_scanned", label: "Check-ins / Scans", icon: ScanLine },
      { id: "report_exported", label: "Report Exports", icon: FileDown },
      { id: "guests_imported", label: "Guest Imports", icon: UploadCloud },
      { id: "qr_generated", label: "QR Studio", icon: QrCode },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-8 w-full p-6 md:p-10 max-w-6xl mx-auto">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Notification Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Real-Time
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time activity audit, instant check-in streams, and alert configurations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="border-border/60 hover:bg-muted/50 text-xs font-medium cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Mark All as Read ({unreadCount})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFeed()}
            disabled={refreshing}
            className="border-border/60 hover:bg-muted/50 text-xs font-medium cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear Feed
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[380px] bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="feed" className="rounded-lg font-medium text-xs sm:text-sm">
            <Bell className="w-4 h-4 mr-2" />
            Live Feed {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg font-medium text-xs sm:text-sm">
            <Sliders className="w-4 h-4 mr-2" />
            Alert Settings
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 1: LIVE NOTIFICATIONS FEED */}
        {/* ========================================================= */}
        <TabsContent value="feed" className="mt-6 flex flex-col gap-6">
          
          {/* Activity Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {filterButtons.map((fb) => {
              const Icon = fb.icon;
              const isSelected = selectedFilter === fb.id;
              return (
                <button
                  key={fb.id}
                  onClick={() => setSelectedFilter(fb.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm"
                      : "bg-background hover:bg-muted text-muted-foreground border-border/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{fb.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feed List */}
          <div className="flex flex-col gap-3">
            {loadingFeed ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/70 bg-card/50 min-h-[320px]">
                <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4 border border-border/50">
                  <Bell className="w-7 h-7 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No Notifications Recorded</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {selectedFilter === "all"
                    ? "Live registration submissions, attendee QR scans, and report exports will automatically log here in real time."
                    : `No activity recorded yet for ${selectedFilter.replace("_", " ")}.`}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                let relativeTime = "";
                let exactDate = "";
                try {
                  const d = new Date(n.createdAt);
                  relativeTime = formatDistanceToNow(d, { addSuffix: true });
                  exactDate = format(d, "MMM d, yyyy • h:mm a");
                } catch {
                  relativeTime = "recently";
                  exactDate = "";
                }

                return (
                  <div
                    key={n._id ? n._id.toString() : `${n.type}-${n.createdAt}`}
                    className={`flex items-start justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
                      !n.read
                        ? "bg-card border-indigo-500/30 shadow-sm ring-1 ring-indigo-500/10"
                        : "bg-card/70 border-border/60 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Icon */}
                      <div className="p-2.5 rounded-xl bg-muted border border-border/60 shrink-0 mt-0.5">
                        {getNotificationIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-foreground">
                            {n.title}
                          </h4>
                          {!n.read && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                              NEW
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground font-medium">
                            • {relativeTime}
                          </span>
                        </div>

                        <p className="text-sm text-foreground/80 leading-relaxed break-words">
                          {n.message}
                        </p>

                        {/* Timestamp & Meta */}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3 text-muted-foreground/70" />
                            {exactDate}
                          </span>

                          {n.details && Object.keys(n.details).length > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/40 truncate max-w-[280px]">
                              {Object.entries(n.details)
                                .filter(([k]) => k !== "workspaceId" && k !== "eventId")
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" | ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkSingleRead(n._id as string)}
                          title="Mark as read"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNotification(n._id as string)}
                        title="Delete notification"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: NOTIFICATION & ALERT SETTINGS */}
        {/* ========================================================= */}
        <TabsContent value="settings" className="mt-6 flex flex-col gap-6">
          <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col gap-1 border-b border-border/50 pb-5 mb-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Notification Preferences & Trigger Controls
              </h2>
              <p className="text-sm text-muted-foreground">
                Configure dashboard icon notifications, real-time alerts, and external channels.
              </p>
            </div>

            {loadingSettings ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : settings ? (
              <div className="flex flex-col gap-6">
                
                {/* 1. Dashboard Icon Notification Toggle */}
                <div className="flex items-center justify-between p-5 rounded-2xl border border-border/60 bg-muted/20">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-background border border-border/60 shrink-0">
                      <Bell className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-base font-semibold text-foreground">
                        Show Notification Badge on Dashboard Icon
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        Controls whether the bell icon on the Event Dashboard displays unread badge counts and alert highlights. Turn OFF to silence dashboard icon notifications.
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showDashboardBadge ?? true}
                    onCheckedChange={(c) => handleSettingChange("showDashboardBadge", c)}
                  />
                </div>

                {/* 2. Activity Triggers */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    Activity Notification Triggers
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* Registration trigger */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/10">
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div>
                          <Label className="text-sm font-medium">Attendee Registrations</Label>
                          <p className="text-xs text-muted-foreground">Notify on new guest form submissions</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notifyOnRegistration ?? true}
                        onCheckedChange={(c) => handleSettingChange("notifyOnRegistration", c)}
                      />
                    </div>

                    {/* Scan trigger */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/10">
                      <div className="flex items-center gap-3">
                        <ScanLine className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <Label className="text-sm font-medium">QR Scans & Check-ins</Label>
                          <p className="text-xs text-muted-foreground">Notify when passes are verified</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notifyOnScan ?? true}
                        onCheckedChange={(c) => handleSettingChange("notifyOnScan", c)}
                      />
                    </div>

                    {/* Report Export trigger */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/10">
                      <div className="flex items-center gap-3">
                        <FileDown className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <Label className="text-sm font-medium">Report Exports</Label>
                          <p className="text-xs text-muted-foreground">Notify on PDF, CSV, and image exports</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notifyOnExport ?? true}
                        onCheckedChange={(c) => handleSettingChange("notifyOnExport", c)}
                      />
                    </div>

                    {/* Guest Import trigger */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/10">
                      <div className="flex items-center gap-3">
                        <UploadCloud className="w-4 h-4 text-cyan-500 shrink-0" />
                        <div>
                          <Label className="text-sm font-medium">Guest Batch Imports</Label>
                          <p className="text-xs text-muted-foreground">Notify on CSV spreadsheet imports</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notifyOnImport ?? true}
                        onCheckedChange={(c) => handleSettingChange("notifyOnImport", c)}
                      />
                    </div>

                    {/* QR Generation trigger */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/10 md:col-span-2">
                      <div className="flex items-center gap-3">
                        <QrCode className="w-4 h-4 text-purple-500 shrink-0" />
                        <div>
                          <Label className="text-sm font-medium">QR Code & Batch Generations</Label>
                          <p className="text-xs text-muted-foreground">Notify when QR codes and batch passes are generated</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notifyOnQRGen ?? true}
                        onCheckedChange={(c) => handleSettingChange("notifyOnQRGen", c)}
                      />
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={saveSettings}
                    disabled={savingSettings}
                    className="rounded-full px-8 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold cursor-pointer shadow-sm"
                  >
                    {savingSettings ? "Saving Settings..." : "Save Notification Settings"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Failed to load notification settings.</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
