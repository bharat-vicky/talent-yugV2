"use client";

import { motion } from "framer-motion";
import { LayoutTemplate, Star, Play, Layers } from "lucide-react";

interface StatisticsRowProps {
  totalTemplates?: number;
  officialTemplates?: number;
  favoriteTemplates?: number;
  totalUses?: number;
}

export function StatisticsRow({ 
  totalTemplates, 
  officialTemplates, 
  favoriteTemplates, 
  totalUses 
}: StatisticsRowProps) {
  const stats = [
    { label: "Total Templates", value: totalTemplates, icon: <Layers className="w-4 h-4 text-blue-500" /> },
    { label: "Official Blueprints", value: officialTemplates, icon: <LayoutTemplate className="w-4 h-4 text-emerald-500" /> },
    { label: "Favorites", value: favoriteTemplates, icon: <Star className="w-4 h-4 text-amber-500" /> },
    { label: "Total Uses", value: totalUses, icon: <Play className="w-4 h-4 text-purple-500" /> }
  ].filter(stat => stat.value !== undefined && stat.value > 0);

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div 
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background"
        >
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            {stat.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold leading-none mb-1">{stat.value}</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
