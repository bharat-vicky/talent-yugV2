"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BarChart3, Users, QrCode, Calendar, Search, Bell, MousePointer2 } from "lucide-react";
import { SCALE_IN } from "../utils/animations";

export function HeroPreview() {
  const [activeTab, setActiveTab] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [liveCheckins, setLiveCheckins] = useState(892);

  // 3D Tilt Effect State
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["3deg", "-3deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-3deg", "3deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Tab Auto-rotation
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Live Data Simulation
  useEffect(() => {
    if (activeTab !== 0) return;
    const interval = setInterval(() => {
      setLiveCheckins(prev => prev + Math.floor(Math.random() * 3));
    }, 2000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const tabs = [
    { icon: Calendar, label: "Events" },
    { icon: Users, label: "Guests" },
    { icon: QrCode, label: "QR Studio" },
    { icon: BarChart3, label: "Analytics" },
  ];

  return (
    <div className="perspective-[2000px] mt-16 relative w-full max-w-5xl mx-auto">
      <motion.div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          handleMouseLeave();
          setIsHovered(false);
        }}
        onMouseEnter={() => setIsHovered(true)}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        variants={SCALE_IN}
        initial="hidden"
        animate="visible"
        className="relative mx-auto w-full rounded-2xl border border-zinc-200/60 bg-white shadow-[0_40px_100px_rgb(0,0,0,0.15)] overflow-hidden flex flex-col h-[550px] transition-shadow duration-500 hover:shadow-[0_50px_120px_rgb(0,0,0,0.2)]"
      >
        {/* Fake Browser Header */}
        <div className="h-12 border-b border-zinc-200 flex items-center px-4 bg-zinc-50/80 backdrop-blur-sm z-30 relative" style={{ transform: "translateZ(30px)" }}>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-300" />
            <div className="w-3 h-3 rounded-full bg-zinc-400" />
            <div className="w-3 h-3 rounded-full bg-zinc-500" />
          </div>
          <div className="mx-auto flex h-7 w-1/3 items-center justify-center rounded-md bg-white border border-zinc-200 text-[11px] text-zinc-600 font-medium shadow-sm font-mono">
            pahchaan / dashboard
          </div>
        </div>

        {/* App Body */}
        <div className="flex flex-1 bg-white relative z-10" style={{ transform: "translateZ(10px)" }}>
          {/* Sidebar */}
          <div className="w-56 border-r border-zinc-200 bg-zinc-50/50 p-4 flex flex-col gap-4 hidden sm:flex z-20 relative">
            <div className="flex items-center gap-3 mb-6 mt-2 px-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span className="text-base font-bold text-zinc-900">Pahchaan</span>
            </div>
            {tabs.map((item, i) => (
              <div 
                key={i} 
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer ${
                  activeTab === i 
                  ? 'bg-zinc-900 shadow-sm text-white translate-x-1' 
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50'
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeTab === i ? 'text-white' : 'text-zinc-400'}`} />
                {item.label}
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 relative bg-white overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="absolute inset-0 p-8 flex flex-col gap-8"
              >
                {/* Header (Shared) */}
                <div className="flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900">Global Tech Summit 2026</h2>
                    <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse" />
                      Live • San Francisco, CA
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center bg-white shadow-sm hover:bg-zinc-50 transition-colors cursor-pointer">
                      <Search className="w-4 h-4 text-zinc-600" />
                    </div>
                    <div className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center bg-white shadow-sm hover:bg-zinc-50 transition-colors cursor-pointer relative">
                      <Bell className="w-4 h-4 text-zinc-600" />
                      <span className="absolute top-2 right-2 w-2 h-2 bg-zinc-900 rounded-full" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-600 shadow-sm border border-zinc-900 ml-2" />
                  </div>
                </div>

                {/* Dynamic Content Views */}
                {activeTab === 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-6 shrink-0">
                      {[
                        { label: "Total Registrations", value: "2,845", trend: "+12%" },
                        { label: "VIP Guests", value: "142", trend: "+4%" },
                        { label: "Live Check-ins", value: liveCheckins, trend: "+24%", live: true },
                      ].map((stat, i) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={i} 
                          className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col gap-3 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
                        >
                          <span className="text-sm text-zinc-500 font-medium flex items-center gap-2">
                            {stat.label}
                            {stat.live && <span className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse" />}
                          </span>
                          <div className="flex items-end justify-between">
                            <span className="text-3xl font-bold text-zinc-900">{stat.value}</span>
                            <span className="text-xs font-bold text-zinc-800 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">{stat.trend}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex-1 rounded-2xl border border-zinc-200 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col"
                    >
                      <div className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between bg-zinc-50/50">
                        <span className="text-sm font-bold text-zinc-900">Recent Activity Stream</span>
                        <span className="text-xs font-semibold text-zinc-900 hover:text-black cursor-pointer bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-full border border-zinc-200 transition-colors">View Live Feed</span>
                      </div>
                      <div className="p-6 flex flex-col gap-6 flex-1 overflow-hidden relative">
                        {/* Fake Multiplayer Cursor */}
                        <motion.div 
                          animate={{ 
                            x: [0, 200, 50, 300, 0], 
                            y: [0, 50, 150, 80, 0] 
                          }}
                          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute z-50 pointer-events-none flex flex-col items-center"
                        >
                          <MousePointer2 className="w-5 h-5 text-zinc-900 fill-zinc-900 -rotate-12 drop-shadow-md" />
                          <div className="bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 drop-shadow-md">Sarah J.</div>
                        </motion.div>

                        {[
                          { name: "John Smith", role: "Checked in at Main Entrance", time: "Just now", init: "JS" },
                          { name: "Alice Lee", role: "Registered for VIP Pass", time: "2 mins ago", init: "AL" },
                          { name: "Michael Kim", role: "Checked in at Workshop B", time: "14 mins ago", init: "MK" }
                        ].map((item, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + (i * 0.1) }}
                            key={i} 
                            className="flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                {item.init}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-bold text-zinc-900">{item.name}</span>
                                <span className="text-xs font-medium text-zinc-500">{item.role}</span>
                              </div>
                            </div>
                            <span className="text-[11px] text-zinc-400 font-medium">{item.time}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}

                {activeTab === 3 && (
                  <div className="flex-1 flex flex-col gap-6 min-h-0">
                    <div className="flex gap-6 shrink-0">
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 h-24 rounded-2xl border border-zinc-200 bg-white shadow-sm p-5 flex flex-col justify-between relative overflow-hidden">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider relative z-10">Peak Attendance</span>
                        <span className="text-3xl font-bold text-zinc-900 relative z-10">842 <span className="text-xs font-medium text-zinc-400">@ 11:30 AM</span></span>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-zinc-100 rounded-full blur-2xl" />
                      </motion.div>
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 h-24 rounded-2xl border border-zinc-200 bg-white shadow-sm p-5 flex flex-col justify-between relative overflow-hidden">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider relative z-10">Avg Session</span>
                        <span className="text-3xl font-bold text-zinc-900 relative z-10">4h 12m</span>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-zinc-100 rounded-full blur-2xl" />
                      </motion.div>
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="flex-1 h-24 rounded-2xl border border-zinc-200 bg-white shadow-sm p-5 flex flex-col justify-between relative overflow-hidden">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider relative z-10">Drop-off Rate</span>
                        <span className="text-3xl font-bold text-zinc-900 relative z-10">4.2%</span>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-zinc-100 rounded-full blur-2xl" />
                      </motion.div>
                    </div>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex-1 rounded-2xl border border-zinc-200 bg-white shadow-sm p-6 flex flex-col gap-6">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-zinc-900">Live Attendance Cross-section</span>
                        <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider bg-zinc-100 px-3 py-1 rounded-md border border-zinc-200">Today</span>
                      </div>
                      <div className="flex-1 flex items-end gap-3 relative">
                         <div className="absolute inset-0 flex flex-col justify-between py-2">
                            <div className="border-b border-dashed border-zinc-200 w-full"></div>
                            <div className="border-b border-dashed border-zinc-200 w-full"></div>
                            <div className="border-b border-dashed border-zinc-200 w-full"></div>
                         </div>
                         {[40, 65, 45, 80, 55, 95, 75, 85, 60, 100, 70, 90].map((h, i) => (
                           <motion.div 
                             key={i} 
                             initial={{ height: 0 }}
                             animate={{ height: `${h}%` }}
                             transition={{ duration: 1, delay: 0.4 + (i * 0.05), type: "spring" }}
                             className="flex-1 bg-gradient-to-t from-zinc-700 via-zinc-800 to-zinc-950 rounded-t-md relative z-10 hover:opacity-80 transition-opacity cursor-pointer shadow-sm" 
                           />
                         ))}
                      </div>
                    </motion.div>
                  </div>
                )}
                
                {activeTab === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-0">
                     <div className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between bg-zinc-50/50">
                       <span className="text-sm font-bold text-zinc-900">Guest Directory</span>
                       <div className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 cursor-pointer shadow-sm">Add New Guest</div>
                     </div>
                     <div className="p-6 flex flex-col gap-5 flex-1 overflow-hidden">
                       {[
                         { name: "Sarah Jenkins", email: "sarah@example.com", status: "VIP", init: "SJ", isVip: true },
                         { name: "David Chen", email: "david.c@startup.io", status: "Checked In", init: "DC", isVip: false },
                         { name: "Emily Watson", email: "emilyw@enterprise.com", status: "Checked In", init: "EW", isVip: false },
                         { name: "Robert Fox", email: "rfox@agency.net", status: "Pending", init: "RF", isVip: false },
                         { name: "Jessica Alba", email: "jessica@studio.com", status: "Checked In", init: "JA", isVip: false }
                       ].map((item, i) => (
                         <motion.div 
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.05 }}
                           key={i} 
                           className="flex items-center justify-between pb-4 border-b border-zinc-100 last:border-0 last:pb-0"
                         >
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs text-zinc-700 font-bold">{item.init}</div>
                             <div className="flex flex-col gap-0.5">
                               <span className="text-sm font-bold text-zinc-900">{item.name}</span>
                               <span className="text-xs font-medium text-zinc-500">{item.email}</span>
                             </div>
                           </div>
                           <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                             item.isVip 
                               ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
                               : item.status === 'Pending' 
                                 ? 'bg-zinc-50 text-zinc-600 border-zinc-200' 
                                 : 'bg-zinc-100 text-zinc-900 border-zinc-200 shadow-sm'
                           }`}>
                             {item.status}
                           </span>
                         </motion.div>
                       ))}
                     </div>
                  </motion.div>
                )}

                {activeTab === 2 && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex gap-6 min-h-0">
                    <div className="w-1/3 rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm flex flex-col items-center justify-center p-8 gap-6 h-full text-center relative overflow-hidden">
                      <div className="w-48 h-48 bg-white p-4 rounded-3xl shadow-xl border border-zinc-200 flex items-center justify-center relative">
                        <QrCode className="w-full h-full text-zinc-900" />
                        <motion.div animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute left-0 right-0 h-[3px] bg-zinc-900 shadow-[0_0_15px_rgba(0,0,0,0.5)]" />
                      </div>
                      <div className="flex flex-col items-center z-10">
                        <span className="text-base font-bold text-zinc-900">VIP Access Pass</span>
                        <span className="text-xs font-medium text-zinc-500 mt-1">Dynamic URL Active</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-6">
                       <div className="h-24 shrink-0 rounded-2xl border border-zinc-200 bg-white shadow-sm p-5 flex flex-col justify-between">
                         <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Scans Today</span>
                         <div className="flex items-end justify-between">
                           <span className="text-3xl font-bold text-zinc-900">12,405</span>
                           <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-1 rounded-md border border-zinc-200">+14% vs yesterday</span>
                         </div>
                       </div>
                       <div className="flex-1 rounded-2xl border border-zinc-200 bg-white shadow-sm p-6 flex flex-col gap-4">
                         <span className="text-sm font-bold text-zinc-900">Real-time Scan Activity</span>
                         <div className="flex-1 bg-zinc-50 rounded-xl border border-zinc-100 flex items-end px-4 gap-2 pt-4 relative">
                           <div className="absolute inset-0 flex flex-col justify-between py-4 px-2">
                              <div className="border-b border-zinc-200/50 w-full"></div>
                              <div className="border-b border-zinc-200/50 w-full"></div>
                              <div className="border-b border-zinc-200/50 w-full"></div>
                           </div>
                           {[30, 50, 40, 70, 60, 90, 80, 100, 85].map((h, i) => (
                             <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.5, delay: i * 0.05 }} className="flex-1 bg-zinc-800 hover:bg-zinc-900 transition-colors rounded-t-sm relative z-10 shadow-sm" />
                           ))}
                         </div>
                       </div>
                    </div>
                  </motion.div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
