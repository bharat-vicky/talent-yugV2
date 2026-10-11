import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveWorkspaceData } from "@/lib/workspace";
import { membershipRepository } from "@/infrastructure/repositories/MembershipRepository";
import { EventService } from "@/application/services/EventService";
import getMongoClient from "@/infrastructure/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Calendar as CalendarIcon, Users, QrCode, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { activeWorkspace, validWorkspaces } = await getActiveWorkspaceData(session.user.id);
  if (!activeWorkspace) return null;

  const eventsResult = await EventService.getEvents(session.user.id, activeWorkspace._id as string, { limit: 6 });
  const events = eventsResult.events;
  const totalEvents = eventsResult.total;

  const client = await getMongoClient();
  const db = client.db();

  const allMemberships = await membershipRepository.findMany({ workspaceId: activeWorkspace._id as string });
  const totalTeamMembers = allMemberships.length;

  const totalGuests = await db.collection("guests").countDocuments({ workspaceId: activeWorkspace._id });
  
  const scanAgg = await db.collection("qr_codes").aggregate([
    { $match: { workspaceId: activeWorkspace._id } },
    { $group: { _id: null, total: { $sum: "$scanCount" } } }
  ]).toArray();
  const totalScans = scanAgg[0]?.total || 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back to <span className="font-semibold text-foreground">{activeWorkspace.name}</span>
          </p>
        </div>
        {validWorkspaces.length > 1 && (
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground bg-background border border-border/60 rounded-full px-3 py-1.5 shadow-xs w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Workspace: <strong className="text-foreground">{activeWorkspace.name}</strong></span>
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 border-dashed bg-background/50 p-12 text-center h-[400px]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
            <CalendarPlus className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight mb-2">No events found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-8">
            You don&apos;t have any events yet. Create your first event to start managing registrations, check-ins, and analytics.
          </p>
          <Button render={<Link href="/events/create" />} nativeButton={false}>
            Create Your First Event
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Events</h3>
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">{totalEvents}</div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Guests</h3>
                <Users className="h-5 w-5 text-[#678955]" />
              </div>
              <div className="text-3xl font-bold">{totalGuests}</div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium text-muted-foreground">QR Scans</h3>
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">{totalScans}</div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Team Members</h3>
                <Users className="h-5 w-5 text-[#c27952]" />
              </div>
              <div className="text-3xl font-bold">{totalTeamMembers}</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold tracking-tight">Recent Events</h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground h-8 hover:text-foreground" render={<Link href="/events" />} nativeButton={false}>
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map(event => (
                <Link key={event._id as string} href={`/events/${event._id as string}`} className="block rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/30 hover:bg-card/80 hover:shadow-lg transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate pr-2">{event.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {event.category && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full border border-border/60 bg-muted/60 font-medium text-foreground truncate max-w-[120px]">
                          {event.category}
                        </span>
                      )}
                      <div className="text-xs px-2.5 py-1 rounded-full border border-border/50 bg-background/50 capitalize font-medium text-muted-foreground">
                        {event.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-4 flex-wrap">
                    <span>{new Date(event.date).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                    {event.venue && <span>• {event.venue}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
