"use client";

import { use } from "react";


export default function AnalyticsLayout({ 
  children, 
}: { 
  children: React.ReactNode; 
}) {

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
      
    </div>
  );
}
