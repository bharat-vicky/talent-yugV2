"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FADE_IN } from "../utils/animations";

const features = [
  {
    id: "workspace",
    title: "Workspace Dashboard",
    description: "A centralized command center for all your events. Monitor high-level metrics, upcoming schedules, and team activity in real-time.",
    preview: (
      <div className="w-full h-full bg-zinc-50 p-6 flex flex-col gap-4 border border-zinc-200 rounded-xl overflow-hidden shadow-sm transition-transform hover:scale-[1.02] duration-500">
        <div className="w-full h-8 flex justify-between items-center border-b border-zinc-200 pb-4">
          <span className="text-sm font-semibold text-zinc-900">pahchaan / dashboard</span>
          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-xs">AC</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Check-ins</span>
            <span className="text-2xl font-bold text-zinc-900">1,245</span>
          </div>
          <div className="h-24 bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Active Events</span>
            <span className="text-2xl font-bold text-zinc-900">4</span>
          </div>
        </div>
        <div className="flex-1 bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col">
          <span className="text-xs font-semibold text-zinc-900 mb-4">Upcoming Schedule</span>
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700">Tech Summit 2026</span>
              <span className="text-zinc-400">Oct 12</span>
            </div>
            <div className="border-b border-dashed border-zinc-200" />
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700">Founder&apos;s Dinner</span>
              <span className="text-zinc-400">Nov 05</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "create-event",
    title: "Create Event Wizard",
    description: "Launch complex events in minutes. Configure dates, locations, ticketing tiers, and custom forms through a streamlined step-by-step process.",
    preview: (
      <div className="w-full h-full bg-zinc-50 p-6 flex flex-col gap-4 border border-zinc-200 rounded-xl overflow-hidden shadow-sm transition-transform hover:scale-[1.02] duration-500">
        <span className="text-sm font-semibold text-zinc-900 mb-2">Create New Event</span>
        <div className="flex gap-2 mb-6">
          <div className="flex-1 h-1.5 bg-zinc-900 rounded-full" />
          <div className="flex-1 h-1.5 bg-zinc-900 rounded-full" />
          <div className="flex-1 h-1.5 bg-zinc-200 rounded-full" />
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6 flex-1 shadow-sm flex flex-col gap-5">
          <span className="text-xs font-semibold text-zinc-900">Step 2: Ticketing Tiers</span>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Tier Name</span>
              <div className="w-full h-9 border border-zinc-300 rounded-lg bg-zinc-50 flex items-center px-3 text-sm font-medium text-zinc-900">General Admission</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Guest capacity</span>
              <div className="w-full h-9 border border-zinc-300 rounded-lg bg-zinc-50 flex items-center px-3 text-sm font-medium text-zinc-900">250 guests</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "guest-management",
    title: "Guest Management",
    description: "Organize thousands of attendees with powerful filtering, timeline tracking, and real-time PDF badge generation.",
    preview: (
      <div className="w-full h-full bg-zinc-50 p-6 flex flex-col gap-4 border border-zinc-200 rounded-xl overflow-hidden shadow-sm transition-transform hover:scale-[1.02] duration-500">
        <div className="flex justify-between items-center mb-4">
          <div className="w-48 h-9 border border-zinc-300 bg-white rounded-lg shadow-sm flex items-center px-3 text-xs text-zinc-400">Search guests...</div>
          <div className="h-9 px-4 bg-zinc-900 text-white rounded-lg shadow-sm flex items-center justify-center text-xs font-medium">Add Guest</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl flex-1 shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-zinc-200 px-4 py-2 flex gap-4 bg-zinc-50 items-center">
            <div className="w-3 h-3 rounded border border-zinc-300" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider w-24">Name</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-auto">Status</span>
          </div>
          {[
            { n: "David O.", s: "Checked In", c: "bg-zinc-100 text-zinc-900 border-zinc-200" },
            { n: "Sarah K.", s: "Pending", c: "bg-zinc-50 text-zinc-500 border-zinc-200" },
            { n: "Marcus T.", s: "Checked In", c: "bg-zinc-100 text-zinc-900 border-zinc-200" },
            { n: "Elena R.", s: "VIP", c: "bg-zinc-900 text-white border-zinc-900" }
          ].map((g, i) => (
             <div key={i} className="border-b border-zinc-100 px-4 py-2.5 flex gap-4 items-center hover:bg-zinc-50 transition-colors">
               <div className="w-3 h-3 rounded border border-zinc-300" />
               <div className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-[8px] font-bold text-zinc-600">{g.n.charAt(0)}</div>
               <span className="text-xs font-medium text-zinc-900">{g.n}</span>
               <div className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ml-auto ${g.c}`}>{g.s}</div>
             </div>
          ))}
        </div>
      </div>
    )
  }
];

export function ProductShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <section className="py-32 bg-white border-t border-zinc-200" id="solutions">
      <div className="container mx-auto px-6 max-w-7xl relative">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={FADE_IN}
          className="mb-24 text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-zinc-900">A complete ecosystem.</h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            From initial setup to post-event analytics, Pahchaan provides every tool necessary for flawless execution.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 relative items-center">
          {/* Text Side */}
          <div className="flex flex-col gap-12 lg:gap-16">
            {features.map((feature, i) => (
              <div 
                key={feature.id} 
                className={`flex flex-col gap-4 cursor-pointer transition-opacity duration-500 ${activeIndex === i ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                onClick={() => setActiveIndex(i)}
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 shadow-sm flex items-center justify-center text-xl font-bold text-zinc-900 transition-colors">
                  {feature.title.charAt(0)}
                </div>
                <h3 className="text-3xl font-bold text-zinc-900">{feature.title}</h3>
                <p className="text-lg text-zinc-500 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Mobile Preview (hidden on Desktop) */}
                <div className={`lg:hidden h-[300px] mt-8 ${activeIndex === i ? 'block' : 'hidden'}`}>
                  {feature.preview}
                </div>
              </div>
            ))}
          </div>

          {/* Visual Side */}
          <div className="hidden lg:block relative h-[600px] w-full">
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-zinc-50 border border-zinc-200">
                <div className="absolute inset-0 p-4">
                  <div className="w-full h-full relative rounded-2xl overflow-hidden bg-white shadow-sm border border-zinc-100">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute inset-0"
                      >
                        {features[activeIndex].preview}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
