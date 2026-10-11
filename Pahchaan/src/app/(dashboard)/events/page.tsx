import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveWorkspaceData } from "@/lib/workspace";
import { EventList } from "./components/EventList";

export default async function EventsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { activeWorkspace } = await getActiveWorkspaceData(session.user.id);
  if (!activeWorkspace) return null;

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track operational events in <span className="font-semibold text-foreground">{activeWorkspace.name}</span>.
          </p>
        </div>
      </div>
      
      <EventList workspaceId={activeWorkspace._id!.toString()} />
    </div>
  );
}
