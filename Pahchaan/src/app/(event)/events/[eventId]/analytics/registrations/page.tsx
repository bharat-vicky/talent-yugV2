/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, DonutChart } from "@/components/ui/charts/ChartAdapter";

export default function RegistrationAnalyticsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  
  const [funnel, setFunnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/pahchaan/api/events/${eventId}/analytics/registration`)
      .then(res => res.json())
      .then(data => {
        setFunnel(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load registration analytics");
        setLoading(false);
      });
  }, [eventId]);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Registration Analytics</h1>
        <p className="text-gray-400">Conversion funnels and acquisition metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Funnel Bar Chart */}
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6">Registration Funnel</h3>
          {funnel.length > 0 ? (
            <BarChart 
              data={funnel} 
              height={350} 
              series={[{ dataKey: "value", color: "#ffffff", name: "Count" }]}
            />
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-lg">
              No registration data available.
            </div>
          )}
        </div>

        {/* Funnel Donut Chart */}
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6">Status Breakdown</h3>
          {funnel.length > 0 ? (
            <DonutChart 
              data={funnel.filter(f => f.name !== "Submissions")} 
              height={350} 
            />
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-lg">
              No registration data available.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
