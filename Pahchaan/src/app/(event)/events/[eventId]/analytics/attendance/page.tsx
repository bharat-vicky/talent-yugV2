/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LineChart, DonutChart } from "@/components/ui/charts/ChartAdapter";

export default function AttendanceAnalyticsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/pahchaan/api/events/${eventId}/analytics/timeline`)
      .then(res => res.json())
      .then(data => {
        setTimeline(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load attendance analytics");
        setLoading(false);
      });
  }, [eventId]);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Attendance Analytics</h1>
        <p className="text-gray-400">Time-series check-in data and demographics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Timeline */}
        <div className="lg:col-span-2 bg-black border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6">Peak Arrival Times</h3>
          {timeline.length > 0 ? (
            <LineChart 
              data={timeline} 
              height={350} 
              series={[{ dataKey: "value", color: "#ffffff", name: "Arrivals" }]}
            />
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-lg">
              No check-in data available yet.
            </div>
          )}
        </div>

        {/* Guest Group Breakdown Placeholder */}
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6">Ticket Types</h3>
          {timeline.length > 0 ? (
            <DonutChart 
              data={[
                { name: "General", value: 400 },
                { name: "VIP", value: 120 },
                { name: "Student", value: 80 }
              ]} 
              height={350} 
            />
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-lg">
              No demographic data available.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
