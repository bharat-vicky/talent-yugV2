"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Bell, 
  UserPlus, 
  ScanLine, 
  FileDown, 
  UploadCloud, 
  QrCode, 
  Mail, 
  Check, 
  ExternalLink,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EventNotification, NotificationType } from "@/domain/types";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell({ eventId }: { eventId: string }) {
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showBadge, setShowBadge] = useState<boolean>(true);
  const [markingRead, setMarkingRead] = useState<boolean>(false);

  const fetchNotifications = async () => {
    if (!eventId) return;
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/notifications/feed?limit=6`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setShowBadge(data.showDashboardBadge ?? true);
      }
    } catch {
      // Background poll silently fails if offline
    }
  };

  useEffect(() => {
    const controller=new AbortController();
    fetch(`/pahchaan/api/events/${eventId}/notifications/feed?limit=6`,{signal:controller.signal}).then(r=>r.json()).then(data=>{setNotifications(data.notifications||[]);setUnreadCount(data.unreadCount||0);setShowBadge(data.showDashboardBadge??true);}).catch(()=>{});
    const interval = setInterval(fetchNotifications, 3000); // 3-second real-time poll
    return () => {controller.abort();clearInterval(interval);};
  }, [eventId]);

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/notifications/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success("All notifications marked as read");
      }
    } catch {
      toast.error("Failed to mark notifications as read");
    } finally {
      setMarkingRead(false);
    }
  };

  const handleMarkSingleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/pahchaan/api/events/${eventId}/notifications/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent error
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "registration":
        return <UserPlus className="w-3.5 h-3.5 text-indigo-500" />;
      case "qr_scanned":
        return <ScanLine className="w-3.5 h-3.5 text-emerald-500" />;
      case "report_exported":
        return <FileDown className="w-3.5 h-3.5 text-amber-500" />;
      case "guests_imported":
        return <UploadCloud className="w-3.5 h-3.5 text-cyan-500" />;
      case "qr_generated":
        return <QrCode className="w-3.5 h-3.5 text-purple-500" />;
      case "invitation_sent":
        return <Mail className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-zinc-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="relative h-10 w-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
            {showBadge && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white px-1 shadow-sm animate-in zoom-in-50 dark:bg-white dark:text-zinc-900">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 rounded-2xl shadow-xl border-border/60">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
            {showBadge && unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingRead}
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 cursor-pointer"
            >
              {markingRead ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Check className="w-3 h-3 mr-1" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                <Bell className="w-5 h-5 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground/80 mt-0.5">
                Real-time activity will show up here
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              let timeStr = "";
              try {
                timeStr = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true });
              } catch {
                timeStr = "recently";
              }

              return (
                <div
                  key={n._id ? n._id.toString() : `${n.type}-${n.createdAt}`}
                  className={`p-3.5 flex items-start gap-3 transition-colors hover:bg-muted/30 relative ${
                    !n.read ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-muted/60 border border-border/40 shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-foreground truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {timeStr}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={(e) => handleMarkSingleRead(n._id as string, e)}
                      className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 hover:scale-125 transition-transform cursor-pointer"
                      title="Mark as read"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-2.5 border-t border-border/50 bg-muted/10 text-center">
          <Link
            href={`/events/${eventId}/notifications`}
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1.5 py-1"
          >
            <span>Open Notification Center</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
