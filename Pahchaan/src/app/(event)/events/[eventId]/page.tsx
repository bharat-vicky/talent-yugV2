"use client";

import { useEvent } from "@/providers/event-provider";
import { EventHero } from "./components/EventHero";
import { KPIGrid } from "./components/KPIGrid";
import { EventProgress } from "./components/EventProgress";
import { ActivityFeed } from "./components/ActivityFeed";
import { EventHealth } from "./components/EventHealth";

export default function EventDashboardPage() {
  const { event } = useEvent();
  const eventId = event._id as string;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Section 1: Event Hero */}
      <EventHero />

      {/* Section 2: KPI Grid */}
      <KPIGrid eventId={eventId} />

      {/* Main Content Grid (12-column responsive layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Progress, Activity (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <EventProgress eventId={eventId} />
          <ActivityFeed eventId={eventId} />
        </div>

        {/* Right Column: Health (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <EventHealth eventId={eventId} />
        </div>
        
      </div>
    </div>
  );
}
