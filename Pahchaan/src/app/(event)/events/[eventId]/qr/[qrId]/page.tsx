"use client";

import { useEvent } from "@/providers/event-provider";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function QROverviewPage({
  params
}: {
  params: Promise<{ eventId: string; qrId: string }>;
}) {
  const { event } = useEvent();
  const { qrId } = use(params);
  const router = useRouter();

  // For now, redirect the overview directly to the Design Studio
  // where most of the QR configuration takes place.
  useEffect(() => {
    router.replace(`/events/${event._id}/qr/${qrId}/design`);
  }, [router, event._id, qrId]);

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-muted-foreground animate-pulse">Loading QR overview...</div>
    </div>
  );
}
