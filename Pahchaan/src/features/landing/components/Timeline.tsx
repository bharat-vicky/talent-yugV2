"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, SlidersHorizontal, QrCode, Mail, Smartphone, LineChart, CheckCircle2, ChevronRight, FileText, Send, UserCheck, BarChart } from "lucide-react";

const steps = [
  { title: "Create Event", desc: "Set up the foundation", icon: CalendarPlus },
  { title: "Configure Form", desc: "Build custom registration", icon: SlidersHorizontal },
  { title: "Generate QR", desc: "Intelligent ticket access", icon: QrCode },
  { title: "Invite Guests", desc: "Mass import & invite", icon: Mail },
  { title: "Scan Check-ins", desc: "Offline scanner app", icon: Smartphone },
  { title: "Track Analytics", desc: "Live dashboard", icon: LineChart },
];

export function Timeline() {
  const [activeStep, setActiveStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const renderMockup = (step: number) => {
    switch (step) {
      case 0:
        return (
          <motion.div key="step0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full h-full flex items-center justify-center">
            <div className="w-[420px] bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 flex flex-col gap-4">
              <div className="text-xl font-bold text-zinc-900 mb-2">Create New Event</div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-zinc-500 mb-1">Event Name</div>
                  <div className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-900 font-medium">Pahchaan Annual Summit 2026</div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-zinc-500 mb-1">Start Date</div>
                    <div className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-sm flex items-center gap-2">
                      <CalendarPlus className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-900 font-medium">Oct 15, 2026</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-zinc-500 mb-1">Location</div>
                    <div className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-900 font-medium truncate">Moscone Center, SF</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-bold text-center shadow-md hover:bg-zinc-800 transition-colors">
                Launch Event
              </div>
              <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3.5 }} className="h-1 bg-zinc-900 mt-1 rounded-full opacity-30" />
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full h-full flex items-center justify-center">
            <div className="w-[420px] bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                <div className="text-lg font-bold text-zinc-900">Registration Form</div>
                <div className="px-3 py-1 bg-zinc-900 text-white text-[10px] rounded-full font-bold uppercase tracking-wider">Published</div>
              </div>
              
              <div className="space-y-3">
                {[
                  { label: "Full Name", type: "Text Input", req: true },
                  { label: "Company", type: "Text Input", req: true },
                  { label: "Job Title", type: "Dropdown", req: false },
                ].map((field, i) => (
                  <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.2 }} className="w-full border border-zinc-200 bg-zinc-50 rounded-lg p-3 flex items-center gap-3">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-zinc-700">{field.label}</span>
                      {field.req && <span className="text-zinc-900 font-bold ml-1">*</span>}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200">{field.type}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full h-full flex items-center justify-center">
            <div className="relative w-72 h-96 bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col items-center pt-12">
              <div className="w-40 h-40 bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-2xl flex items-center justify-center relative">
                <QrCode className="w-24 h-24 text-zinc-900" />
                <motion.div animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 2, repeat: Infinity }} className="absolute left-0 right-0 h-[2px] bg-zinc-900 shadow-[0_0_15px_rgba(0,0,0,0.5)]" />
              </div>
              <div className="mt-8 text-center space-y-2">
                <div className="text-xl font-bold text-zinc-900">VIP Access Pass</div>
                <div className="text-sm text-zinc-500">Scan at any terminal to check-in</div>
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center relative">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  scale: [0.5, 1, 1.5],
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                className="absolute w-12 h-12 bg-white rounded-xl shadow-xl border border-zinc-200 flex items-center justify-center"
              >
                <Send className="w-5 h-5 text-zinc-800" />
              </motion.div>
            ))}
            <div className="w-64 h-64 bg-zinc-100 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-2xl">
              <Mail className="w-24 h-24 text-zinc-800" />
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full h-full flex items-center justify-center">
            <div className="w-72 h-[32rem] bg-zinc-950 rounded-[3rem] shadow-2xl border-[8px] border-zinc-800 p-4 relative overflow-hidden flex flex-col items-center justify-center">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-32 h-32 rounded-full border-4 border-zinc-700 flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin" />
                <UserCheck className="w-12 h-12 text-white" />
              </motion.div>
              <div className="text-white text-xl font-bold mb-2">Guest Checked In</div>
              <div className="text-zinc-400 text-sm">Offline Sync: Active</div>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-2xl h-80 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-8 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="text-2xl font-bold text-zinc-900">1,452 Attendees</div>
                  <div className="text-sm text-zinc-600 font-medium mt-1">+12% from last hour</div>
                </div>
                <div className="px-4 py-1.5 bg-zinc-900 text-white font-bold text-xs rounded-full border border-zinc-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE DASHBOARD
                </div>
              </div>
              <div className="flex-1 flex items-end justify-between gap-4 mt-auto">
                {[40, 65, 45, 80, 55, 90, 70, 100].map((h, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }} 
                    animate={{ height: `${h}%` }} 
                    transition={{ duration: 1, type: "spring", delay: i * 0.1 }}
                    className="w-full bg-gradient-to-t from-zinc-700 via-zinc-800 to-zinc-950 rounded-t-lg relative group"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-xs px-2 py-1 rounded">
                      {h * 12}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <section className="py-32 bg-zinc-50 border-y border-zinc-200 overflow-hidden relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">A flawless workflow.</h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Pahchaan maps precisely to how elite event managers operate, fully automating the busywork so you can focus on the experience.
          </p>
        </motion.div>

        <div className="relative max-w-6xl mx-auto">
          {/* Desktop Connecting Line */}
          <div className="absolute top-[2.5rem] left-[8%] right-[8%] h-1.5 bg-zinc-200 rounded-full hidden md:block" />
          
          {/* Animated Progress Line */}
          <div 
            className="absolute top-[2.5rem] left-[8%] h-1.5 bg-zinc-900 rounded-full hidden md:block transition-all duration-700 ease-in-out z-0" 
            style={{ width: `${(activeStep / (steps.length - 1)) * 84}%` }}
          />

          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-4 relative z-10 mb-16">
            {steps.map((step, i) => {
              const isActive = i === activeStep;
              const isPast = i < activeStep;
              
              return (
                <div 
                  key={i} 
                  className="flex flex-col items-center text-center group cursor-pointer relative"
                  onClick={() => setActiveStep(i)}
                >
                  {/* Icon Node */}
                  <div className={`
                    w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-6 
                    transition-all duration-500 border-4 shadow-sm relative bg-white z-10
                    ${isActive 
                      ? `border-zinc-900 text-zinc-950 scale-110 shadow-xl` 
                      : isPast 
                        ? `border-zinc-900 text-zinc-900` 
                        : `border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600`}
                  `}>
                    <step.icon className={`w-7 h-7 md:w-8 md:h-8 transition-transform duration-500 ${isActive ? 'scale-110' : ''}`} strokeWidth={2} />
                    
                    {/* Checkmark for past steps */}
                    {isPast && (
                      <div className="absolute -top-2 -right-2 bg-zinc-900 rounded-full p-0.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className={`transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2 group-hover:opacity-100 group-hover:translate-y-1'}`}>
                    <h4 className={`font-bold text-sm md:text-base mb-1 ${isActive ? 'text-zinc-900' : 'text-zinc-700'}`}>{step.title}</h4>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Showcase Area */}
          <div className="w-full h-[500px] bg-zinc-100 rounded-[2.5rem] border border-zinc-200/80 p-4 md:p-8 relative overflow-hidden shadow-inner">
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                {renderMockup(activeStep)}
              </AnimatePresence>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
