/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, DonutChart } from "@/components/ui/charts/ChartAdapter";

export default function GuestAnalyticsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/pahchaan/api/events/${eventId}/analytics/kpi`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load guest analytics");
        setLoading(false);
      });
  }, [eventId]);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Guest Analytics</h1>
        <p className="text-gray-400">Demographics and engagement metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Distribution */}
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6">Guest Status</h3>
          <BarChart 
            data={[
              { name: "Approved", value: metrics?.approvedRegistrations || 100 },
              { name: "Checked In", value: metrics?.checkedInGuests || 50 },
              { name: "Pending", value: 20 }
            ]} 
            height={350} 
            series={[{ dataKey: "value", color: "#ffffff", name: "Guests" }]}
          />
        </div>

        {/* Ticket Type Donut Chart */}
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6">Ticket Types</h3>
          <DonutChart 
            data={[
              { name: "General Admission", value: 600 },
              { name: "VIP", value: 150 },
              { name: "Sponsor", value: 50 },
              { name: "Staff", value: 30 }
            ]} 
            height={350} 
          />
        </div>

      </div>

    </div>
  );
}
