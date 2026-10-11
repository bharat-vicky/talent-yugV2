import { 
  CheckCircle2, 
  XCircle, 
  Mail, 
  QrCode, 
  Printer, 
  UserPlus, 
  ScanLine, 
  Edit3, 
  StickyNote,
  LucideIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TimelineEvent } from "@/domain/types";

const ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  "created": { icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/10" },
  "registration_submitted": { icon: Mail, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  "registration_approved": { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  "registration_rejected": { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
  "qr_generated": { icon: QrCode, color: "text-purple-500", bg: "bg-purple-500/10" },
  "qr_assigned": { icon: QrCode, color: "text-purple-500", bg: "bg-purple-500/10" },
  "invitation_sent": { icon: Mail, color: "text-amber-500", bg: "bg-amber-500/10" },
  "badge_printed": { icon: Printer, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  "checked_in": { icon: ScanLine, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  "checked_out": { icon: ScanLine, color: "text-orange-500", bg: "bg-orange-500/10" },
  "profile_updated": { icon: Edit3, color: "text-gray-500", bg: "bg-gray-500/10" },
  "notes_added": { icon: StickyNote, color: "text-yellow-500", bg: "bg-yellow-500/10" },
};

export function GuestTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events || events.length === 0) {
    return <div className="text-sm text-muted-foreground py-4">No timeline events recorded yet.</div>;
  }

  // Ensure chronological ordering (newest first)
  const sortedEvents = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="relative border-l border-border ml-3 my-4 space-y-6 pb-4">
      {sortedEvents.map((event, idx) => {
        const config = ICONS[event.type] || ICONS["profile_updated"];
        const Icon = config.icon;

        return (
          <div key={event._id?.toString() || idx} className="relative pl-6">
            <div className={`absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center ${config.bg} border-2 border-background ring-1 ring-border`}>
              <Icon className={`w-3 h-3 ${config.color}`} />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div>
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                )}
              </div>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
              </time>
            </div>

            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="mt-2 bg-muted/50 rounded-md p-3 text-xs font-mono text-muted-foreground overflow-x-auto">
                {JSON.stringify(event.metadata, null, 2)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
