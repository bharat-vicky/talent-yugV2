"use client";

import { use, useSyncExternalStore } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Wifi, WifiOff, Camera, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

function subscribeOnline(callback:()=>void){window.addEventListener("online",callback);window.addEventListener("offline",callback);return()=>{window.removeEventListener("online",callback);window.removeEventListener("offline",callback);};}

export default function ScannerLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode; 
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = use(params);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${eventId}`);
      const json = await res.json();
      return json.data;
    }
  });

  // Check network status (very basic)
  const isOnline = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  return (
    <div className="flex-1 w-full flex flex-col bg-background text-foreground overflow-hidden rounded-xl border border-border/50 shadow-md">
      {/* Top Status Bar */}
      <div className="h-14 bg-muted border-b border-border/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/events/${eventId}/guests`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <span className="text-sm font-semibold truncate max-w-[200px]">
              {event?.name || "Scanner Workspace"}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
              Terminal 1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <><Wifi className="h-4 w-4 text-green-500" /> Online</>
            ) : (
              <><WifiOff className="h-4 w-4 text-red-500" /> Offline</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4" /> Ready
          </div>
          <div className="flex items-center gap-2 font-mono min-w-[80px] justify-end">
            <Clock className="h-4 w-4" /> {mounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
          </div>
        </div>
      </div>

      {/* Fullscreen Workspace */}
      <div className="flex-1 relative flex flex-col">
        {children}
      </div>
    </div>
  );
}
