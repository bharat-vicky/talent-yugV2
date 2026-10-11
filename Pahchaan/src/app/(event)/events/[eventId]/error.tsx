"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EventErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Event route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-card border border-border/80 rounded-3xl p-8 sm:p-10 shadow-sm max-w-md w-full flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">Unable to Load Event</h2>
        <p className="text-xs text-muted-foreground mb-6">
          A temporary network or database connection issue occurred while loading this page.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Button 
            variant="outline" 
            onClick={() => reset()}
            className="w-full h-10 rounded-xl font-medium cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Try Again
          </Button>

          <Button 
            onClick={() => window.location.href = "/pahchaan/events"}
            className="w-full h-10 rounded-xl font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 cursor-pointer"
          >
            <Home className="w-4 h-4 mr-2" /> All Events
          </Button>
        </div>
      </div>
    </div>
  );
}
