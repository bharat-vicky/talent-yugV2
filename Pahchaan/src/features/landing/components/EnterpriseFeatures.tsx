"use client";

import { motion } from "framer-motion";
import { ShieldCheck, QrCode, Palette, UploadCloud, Activity, Briefcase } from "lucide-react";
import { FADE_IN, STAGGER_CONTAINER, SLIDE_UP } from "../utils/animations";

export function EnterpriseFeatures() {
  const features = [
    { icon: QrCode, title: "Dynamic QR Engine", desc: "Design intelligent, branded QR codes that adapt destination URLs in real-time." },
    { icon: Palette, title: "White-label Branding", desc: "Completely customize event pages and tickets with your own logos and brand colors." },
    { icon: Briefcase, title: "Workspace Isolation", desc: "Organize teams, events, and data into secure, separate workspaces." },
    { icon: ShieldCheck, title: "Role-Based Access", desc: "Assign granular Owner, Manager, and Viewer roles to team members." },
    { icon: UploadCloud, title: "Bulk Data Processing", desc: "Import thousands of guests and generate batch QR codes in seconds." },
    { icon: Activity, title: "Real-time Analytics", desc: "Live check-in metrics, attendance timelines, and engagement tracking." },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={FADE_IN}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Enterprise grade by default.</h2>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER_CONTAINER}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 max-w-5xl mx-auto"
        >
          {features.map((feat, i) => (
            <motion.div key={i} variants={SLIDE_UP} className="flex flex-col gap-4 group p-4 -m-4 rounded-2xl hover:bg-zinc-50 transition-colors cursor-default">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 shadow-sm flex items-center justify-center transition-all duration-500 group-hover:bg-zinc-900 group-hover:border-zinc-900 group-hover:scale-110 group-hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] relative">
                <feat.icon className="w-6 h-6 text-zinc-900 transition-colors duration-500 group-hover:text-white relative z-10" />
                <div className="absolute inset-0 bg-zinc-900 rounded-xl opacity-0 group-hover:opacity-20 group-hover:animate-ping transition-opacity duration-500" />
              </div>
              <div>
                <h4 className="font-semibold text-base text-zinc-900 mb-1">{feat.title}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
