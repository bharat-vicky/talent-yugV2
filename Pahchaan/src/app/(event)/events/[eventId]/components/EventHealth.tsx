"use client";

import { useDashboardHealth } from "../hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function EventHealth({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useDashboardHealth(eventId);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (error || !data) {
    return (
      <div className="h-64 rounded-2xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-500">
        <AlertCircle className="h-5 w-5 mr-2 text-zinc-400" />
        Failed to load health
      </div>
    );
  }

  const { score, status, checks } = data;

  const checkItems = [
    { key: 'registration', label: 'Registration Configured', desc: 'Custom fields & rules' },
    { key: 'qr', label: 'QR Design Configured', desc: 'Custom pass styling' },
    { key: 'guests', label: 'Guests Imported', desc: 'Attendee invitations' }
  ];

  const passedCount = checkItems.filter(item => checks[item.key as keyof typeof checks]).length;

  // For the circular progress
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-zinc-900 animate-pulse" />
          <h3 className="text-base font-semibold tracking-tight text-zinc-900">Event Health</h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 font-medium font-mono">
          {passedCount}/{checkItems.length} COMPLETED
        </span>
      </div>

      {/* Main Readiness Gauge Card */}
      <div className="flex items-center gap-5 p-4 rounded-xl border border-zinc-200/70 bg-gradient-to-b from-zinc-50/80 to-zinc-50/30 mb-6">
        <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
          <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 88 88">
            <defs>
              <linearGradient id="healthProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#18181b" />
                <stop offset="100%" stopColor="#3f3f46" />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <circle
              className="text-zinc-200"
              strokeWidth="5"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="44"
              cy="44"
            />
            {/* Progress Arc */}
            {score > 0 && (
              <circle
                stroke="url(#healthProgressGrad)"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx="44"
                cy="44"
                className="transition-all duration-1000 ease-out"
              />
            )}
          </svg>
          
          {/* Inner Badge */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold tracking-tight text-zinc-900 leading-none">
              {score}
              <span className="text-[11px] font-semibold text-zinc-500 ml-0.5">%</span>
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-900 tracking-tight">{status}</span>
            {score === 100 && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 text-white">
                Live
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {score === 100 
              ? "All pre-flight operational checks passed."
              : `${checkItems.length - passedCount} critical item${checkItems.length - passedCount === 1 ? '' : 's'} remaining`}
          </p>
          
          {/* Mini Linear Progress */}
          <div className="w-full h-1.5 bg-zinc-200/80 rounded-full overflow-hidden mt-2.5">
            <div 
              className="h-full bg-zinc-900 rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2 flex-1">
        {checkItems.map(item => {
          const isPassed = checks[item.key as keyof typeof checks];
          return (
            <div 
              key={item.key} 
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isPassed 
                  ? 'border-zinc-200/60 bg-zinc-50/40 text-zinc-900' 
                  : 'border-zinc-100 bg-white text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isPassed 
                    ? 'bg-zinc-900 text-white shadow-xs' 
                    : 'border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400'
                }`}>
                  {isPassed ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  )}
                </div>
                <div>
                  <div className={`text-xs font-medium ${isPassed ? 'text-zinc-900' : 'text-zinc-700'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {item.desc}
                  </div>
                </div>
              </div>

              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium tracking-wide uppercase ${
                isPassed 
                  ? 'bg-zinc-900 text-white font-semibold' 
                  : 'bg-zinc-100 text-zinc-500 border border-zinc-200/60'
              }`}>
                {isPassed ? 'Done' : 'To Do'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
