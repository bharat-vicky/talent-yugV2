/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useDashboardProgress } from "../hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Users, CheckCircle2, QrCode } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md rounded-xl p-3 text-sm">
          <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">{label}</p>
          <p className="text-zinc-600 dark:text-zinc-400">
            Progress: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{entry.actualValue}</span>
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-mono font-medium">
            {entry.detail}
          </p>
        </div>
      );
    }
    return null;
  };

export function EventProgress({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useDashboardProgress(eventId);

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full rounded-2xl" />;
  }

  if (error || !data) {
    return (
      <div className="h-[300px] rounded-2xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-500">
        <AlertCircle className="h-5 w-5 mr-2 text-zinc-400" />
        Failed to load progress
      </div>
    );
  }

  const { capacity, checkIns, qrs } = data;

  const formatRate = (rate: number, count: number, total: number | string) => {
    if (total === "Unlimited") return "Unlimited";
    if (count === 0 || !rate) return "0%";
    if (rate < 0.1) return `${rate.toFixed(2)}%`;
    if (rate < 10) return `${rate.toFixed(1)}%`;
    return `${Math.round(rate)}%`;
  };

  const getVisualBarValue = (rate: number, count: number, total: number | string) => {
    if (total === "Unlimited") return 100;
    if (count === 0 || !rate) return 0;
    // Ensure any non-zero count visibly advances the progress bar
    return Math.min(100, Math.max(rate, 3));
  };

  const formattedCapacityMax = typeof capacity.max === "number" ? capacity.max.toLocaleString() : capacity.max;
  const formattedCapacityUsed = capacity.used.toLocaleString();
  const formattedCheckIns = checkIns.checkedIn.toLocaleString();
  const formattedTotalGuests = checkIns.total.toLocaleString();
  const formattedQrsAssigned = qrs.assigned.toLocaleString();

  const chartData = [
    {
      name: 'Capacity',
      value: getVisualBarValue(capacity.rate, capacity.used, capacity.max),
      actualValue: formatRate(capacity.rate, capacity.used, capacity.max),
      detail: `${formattedCapacityUsed} / ${formattedCapacityMax}`,
      count: capacity.used,
      total: formattedCapacityMax,
      icon: Users
    },
    {
      name: 'Check-ins',
      value: getVisualBarValue(checkIns.rate, checkIns.checkedIn, checkIns.total),
      actualValue: formatRate(checkIns.rate, checkIns.checkedIn, checkIns.total),
      detail: `${formattedCheckIns} / ${formattedTotalGuests}`,
      count: checkIns.checkedIn,
      total: formattedTotalGuests,
      icon: CheckCircle2
    },
    {
      name: 'QR Assigned',
      value: getVisualBarValue(qrs.rate, qrs.assigned, qrs.total),
      actualValue: formatRate(qrs.rate, qrs.assigned, qrs.total),
      detail: `${formattedQrsAssigned} / ${formattedTotalGuests}`,
      count: qrs.assigned,
      total: formattedTotalGuests,
      icon: QrCode
    }
  ];



  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold tracking-tight text-zinc-900">Operational Progress</h3>
        <span className="text-xs text-zinc-500 font-medium">Live sync</span>
      </div>

      {/* Metrics Quick Strip */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
        <div>
          <span className="text-[11px] text-zinc-500 font-medium block">Capacity</span>
          <span className="text-xs font-bold text-zinc-900 truncate block">
            {formattedCapacityUsed} <span className="text-[10px] text-zinc-400 font-normal">/ {formattedCapacityMax}</span>
          </span>
        </div>
        <div>
          <span className="text-[11px] text-zinc-500 font-medium block">Check-ins</span>
          <span className="text-xs font-bold text-zinc-900 truncate block">
            {formattedCheckIns} <span className="text-[10px] text-zinc-400 font-normal">/ {formattedTotalGuests}</span>
          </span>
        </div>
        <div>
          <span className="text-[11px] text-zinc-500 font-medium block">QR Passes</span>
          <span className="text-xs font-bold text-zinc-900 truncate block">
            {formattedQrsAssigned} <span className="text-[10px] text-zinc-400 font-normal">/ {formattedTotalGuests}</span>
          </span>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="flex-1 w-full h-full min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e4e4e7" />
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 13, fontWeight: 500 }} width={100} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f4f5' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
              {
                chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === 'Capacity' && capacity.max === 'Unlimited' ? '#a1a1aa' : '#18181b'}
                  />
                ))
              }
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
