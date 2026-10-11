/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, DonutChart } from "@/components/ui/charts/ChartAdapter";

export default function QRAnalyticsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation this would fetch specific QR analytics
    fetch(`/pahchaan/api/events/${eventId}/analytics/kpi`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load QR analytics");
        setLoading(false);
      });
  }, [eventId]);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">QR Performance</h1>
        <p className="text-gray-400">Scan distributions, device metrics, and traffic sources.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Geographic / Device Bar Chart */}
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6">Scans by Device Type</h3>
          <BarChart 
            data={[
              { name: "iOS", value: 500 },
              { name: "Android", value: 300 },
              { name: "Desktop", value: 50 }
            ]} 
            height={350} 
            series={[{ dataKey: "value", color: "#ffffff", name: "Scans" }]}
          />
        </div>

        {/* Browser Donut Chart */}
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6">Traffic Sources (Browsers)</h3>
          <DonutChart 
            data={[
              { name: "Safari", value: 450 },
              { name: "Chrome", value: 350 },
              { name: "Firefox", value: 50 }
            ]} 
            height={350} 
          />
        </div>

      </div>

    </div>
  );
}
