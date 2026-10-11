/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, DonutChart } from "@/components/ui/charts/ChartAdapter";

export default function ScannerAnalyticsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/pahchaan/api/events/${eventId}/analytics/scanner`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load scanner analytics");
        setLoading(false);
      });
  }, [eventId]);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Scanner Operations</h1>
        <p className="text-gray-400">Operator efficiency and hardware metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Scans per Operator Bar Chart */}
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6">Scans per Operator</h3>
          {metrics.length > 0 ? (
            <BarChart 
              data={metrics} 
              height={350} 
              series={[{ dataKey: "value", color: "#ffffff", name: "Scans" }]}
            />
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-lg">
              No scanner data available.
            </div>
          )}
        </div>

        {/* Operator Distribution Donut Chart */}
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6">Workload Distribution</h3>
          {metrics.length > 0 ? (
            <DonutChart 
              data={metrics} 
              height={350} 
            />
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-lg">
              No scanner data available.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
