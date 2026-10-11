"use client";

import { motion } from "framer-motion";
import { LayoutTemplate, Brush, Save, Play, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GettingStartedCardProps {
  onDismiss?: () => void;
}

export function GettingStartedCard({ onDismiss }: GettingStartedCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-xl border border-border/50 bg-muted/30 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex-1">
        <h3 className="text-lg font-semibold mb-2">Getting Started with Templates</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xl">
          Create reusable blueprints for your events to save time and maintain consistency across your organization.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <Step 
            icon={<LayoutTemplate className="w-5 h-5" />} 
            title="1. Create an Event" 
            description="Start by creating and configuring a new event." 
          />
          <Step 
            icon={<Brush className="w-5 h-5" />} 
            title="2. Configure Branding" 
            description="Set up your design, registration, and scanners." 
          />
          <Step 
            icon={<Save className="w-5 h-5" />} 
            title="3. Save as Template" 
            description="Use the actions menu to save your configuration." 
          />
          <Step 
            icon={<Play className="w-5 h-5" />} 
            title="4. Reuse Anytime" 
            description="Launch future events in seconds." 
          />
        </div>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 shrink-0">
        <Button variant="outline" className="bg-background">
          Learn More <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        {onDismiss && (
          <Button variant="ghost" size="icon" className="absolute -top-4 -right-4 md:hidden" onClick={onDismiss}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {onDismiss && (
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 hidden md:flex text-muted-foreground hover:text-foreground" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}

function Step({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="w-8 h-8 rounded-lg bg-background border border-border/50 flex items-center justify-center text-primary shadow-sm">
        {icon}
      </div>
      <h4 className="text-sm font-medium">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
