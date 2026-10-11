"use client";

import { motion } from "framer-motion";
import { FADE_IN } from "../utils/animations";

export function TrustedBy() {
  const logos = [
    { name: "Acme Corp", icon: "A" },
    { name: "GlobalBank", icon: "G" },
    { name: "TechNova", icon: "T" },
    { name: "Pinnacle", icon: "P" },
    { name: "Vanguard", icon: "V" },
    { name: "Nexus", icon: "N" },
  ];

  return (
    <section className="py-20 border-y border-zinc-200 bg-white">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={FADE_IN}
          className="flex flex-col items-center gap-8"
        >
          <p className="text-sm font-medium text-zinc-400 uppercase tracking-widest text-center">
            Trusted by innovative teams worldwide
          </p>
          
          <div className="relative w-full overflow-hidden mt-8 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <motion.div 
              className="flex w-fit items-center gap-16 pr-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
            >
              {[...logos, ...logos, ...logos, ...logos].map((logo, i) => (
                <div key={`${logo.name}-${i}`} className="flex items-center gap-2 group cursor-pointer transition-opacity hover:opacity-100 opacity-70 shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                    {logo.icon}
                  </div>
                  <span className="font-semibold text-xl tracking-tight text-zinc-900 whitespace-nowrap">{logo.name}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
