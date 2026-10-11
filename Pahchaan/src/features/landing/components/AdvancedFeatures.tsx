"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { QrCode, Users, ScanLine, BarChart3, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

const features = [
  {
    id: "qr",
    title: "Dynamic QR Studio",
    description: "Generate intelligent, branded QR codes that adapt in real-time. Track scans instantly.",
    icon: QrCode,
  },
  {
    id: "guests",
    title: "Smart Guest CRM",
    description: "Manage thousands of attendees with instant search, bulk actions, and rich profiles.",
    icon: Users,
  },
  {
    id: "scanner",
    title: "Lightning Fast Check-in",
    description: "Sub-second scanning with instant offline-sync. Keep your lines moving flawlessly.",
    icon: ScanLine,
  },
  {
    id: "analytics",
    title: "Real-time Analytics",
    description: "Watch your event unfold with beautiful, live-updating charts and heatmaps.",
    icon: BarChart3,
  }
];

export function AdvancedFeatures() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="py-32 relative overflow-hidden bg-white border-y border-zinc-200" id="features">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
      <div className="absolute top-1/2 -left-48 w-[600px] h-[600px] rounded-full blur-[140px] bg-zinc-100 pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10" ref={containerRef}>
        <div className="flex flex-col md:flex-row gap-16 items-center">
          
          {/* Left Side: Feature Selection (White / Light Background Theme) */}
          <div className="w-full md:w-1/2 flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-sm font-semibold mb-6 shadow-sm">
                <Sparkles className="w-4 h-4 text-zinc-900" /> Next Generation Platform
              </div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-900 mb-6 leading-tight">
                Everything works <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-400">like magic.</span>
              </h2>
              <p className="text-lg text-zinc-600 max-w-xl leading-relaxed">
                We&apos;ve reimagined event management from the ground up, stripping away the complexity to leave you with pure, unadulterated power.
              </p>
            </motion.div>

            <div className="flex flex-col gap-4 mt-2">
              {features.map((feature, index) => {
                const isActive = activeFeature === feature.id;
                return (
                  <motion.button
                    key={feature.id}
                    onClick={() => setActiveFeature(feature.id)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                    className={`group relative p-6 rounded-2xl text-left transition-all duration-300 overflow-hidden border ${
                      isActive 
                        ? "bg-zinc-900 border-zinc-900 shadow-[0_16px_36px_rgba(0,0,0,0.18)]" 
                        : "bg-zinc-50/70 border-zinc-200/80 hover:bg-zinc-100/80 hover:border-zinc-300"
                    }`}
                  >
                    <div className="relative z-10 flex items-start gap-4">
                      <div className={`p-3 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? "bg-white text-zinc-950 shadow-md" 
                          : "bg-white border border-zinc-200 text-zinc-700 group-hover:text-zinc-950 group-hover:border-zinc-300 shadow-sm"
                      }`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold mb-1.5 transition-colors duration-300 ${isActive ? "text-white" : "text-zinc-900"}`}>
                          {feature.title}
                        </h3>
                        <p className={`text-sm transition-colors duration-300 leading-relaxed ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right Side: Interactive Showcase (Obsidian Black Device Canvas) */}
          <div className="w-full md:w-1/2 h-[600px] relative perspective-1000">
            <motion.div
              initial={{ opacity: 0, rotateY: 20, x: 50 }}
              animate={isInView ? { opacity: 1, rotateY: 0, x: 0 } : { opacity: 0, rotateY: 20, x: 50 }}
              transition={{ duration: 1, type: "spring", bounce: 0.3 }}
              className="w-full h-full relative"
            >
              {/* Obsidian Black Glassmorphism Device Mockup */}
              <div className="absolute inset-0 rounded-[2.5rem] border border-zinc-800 bg-zinc-950 shadow-[0_30px_90px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col">
                <div className="h-14 border-b border-zinc-800/80 flex items-center px-6 gap-2 bg-zinc-900/60 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                    <div className="w-3 h-3 rounded-full bg-zinc-600" />
                    <div className="w-3 h-3 rounded-full bg-zinc-500" />
                  </div>
                  <div className="px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                    pahchaan / preview
                  </div>
                </div>
                
                <div className="flex-1 relative p-8">
                  <AnimatePresence mode="wait">
                    {/* QR Studio Showcase */}
                    {activeFeature === "qr" && (
                      <motion.div
                        key="qr"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full flex flex-col items-center justify-center gap-8"
                      >
                        <div className="relative w-64 h-64 bg-white rounded-3xl p-6 shadow-2xl flex items-center justify-center">
                          <QrCode className="w-full h-full text-zinc-950" />
                          <motion.div
                            animate={{ top: ["0%", "100%", "0%"], opacity: [0, 1, 1, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 w-full h-1 bg-zinc-950 shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium flex items-center gap-2 backdrop-blur-md">
                            <ShieldCheck className="w-4 h-4 text-white" /> Secure
                          </div>
                          <div className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-bold backdrop-blur-md flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-zinc-950 animate-pulse" /> Live Tracking
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Guest CRM Showcase */}
                    {activeFeature === "guests" && (
                      <motion.div
                        key="guests"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full flex flex-col gap-4"
                      >
                        {[
                          { initials: 'JD', name: 'John Doe', email: 'john.doe@acme.corp', role: 'VIP Guest', isVip: true },
                          { initials: 'AS', name: 'Alice Smith', email: 'alice@tech.inc', role: 'Speaker', isVip: false },
                          { initials: 'MR', name: 'Mike Ross', email: 'mike.ross@pearson.co', role: 'Attendee', isVip: false },
                          { initials: 'KL', name: 'Karen Lee', email: 'karen@design.studio', role: 'Attendee', isVip: false }
                        ].map((guest, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="w-full p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-4 hover:bg-zinc-800/80 transition-colors cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold shadow-md">
                              {guest.initials}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-zinc-100">{guest.name}</span>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${
                                  guest.isVip 
                                    ? "bg-white text-zinc-950 border-white font-semibold" 
                                    : "bg-zinc-800 text-zinc-300 border-zinc-700"
                                }`}>
                                  {guest.role}
                                </span>
                              </div>
                              <div className="text-sm text-zinc-400">{guest.email}</div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-zinc-700 transition-all">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {/* Scanner Showcase */}
                    {activeFeature === "scanner" && (
                      <motion.div
                        key="scanner"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full flex flex-col items-center justify-center"
                      >
                        <motion.div 
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="relative w-48 h-48 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.05)] mb-12"
                        >
                          <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
                          >
                            <ScanLine className="w-20 h-20 text-white" />
                          </motion.div>
                        </motion.div>
                        
                        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
                          <motion.div 
                            initial={{ x: "-100%" }}
                            animate={{ x: "0%" }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                          />
                          <div className="flex justify-between items-center relative z-10">
                            <span className="text-zinc-400">Status</span>
                            <span className="text-white font-bold flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-white" /> Ready to scan
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Analytics Showcase - Monochrome High-Contrast B&W */}
                    {activeFeature === "analytics" && (
                      <motion.div
                        key="analytics"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full flex flex-col gap-6"
                      >
                        <div className="flex gap-4">
                          <div className="flex-1 p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                            <div className="text-zinc-400 text-sm mb-2 font-medium">Live Attendees</div>
                            <div className="text-4xl font-bold text-white tracking-tight">2,405</div>
                          </div>
                          <div className="flex-1 p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                            <div className="text-zinc-400 text-sm mb-2 font-medium">Check-in Rate</div>
                            <div className="text-4xl font-bold text-white tracking-tight">89%</div>
                          </div>
                        </div>
                        
                        <div className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 flex items-end justify-between gap-2.5">
                          {[30, 50, 40, 70, 85, 60, 95, 80, 100].map((h, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: "10%" }}
                              animate={{ height: `${h}%` }}
                              transition={{ duration: 1, type: "spring", delay: i * 0.05 }}
                              className="w-full bg-gradient-to-t from-zinc-700 via-zinc-400 to-white rounded-t-lg shadow-[0_0_12px_rgba(255,255,255,0.08)] hover:brightness-125 transition-all"
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}


