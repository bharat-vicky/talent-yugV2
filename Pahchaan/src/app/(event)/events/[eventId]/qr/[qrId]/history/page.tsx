"use client";

import { Construction } from "lucide-react";

export default function QRHistoryPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
        <Construction className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">History</h1>
      <p className="text-muted-foreground max-w-md">
        This module is currently under construction.
      </p>
    </div>
  );
}
