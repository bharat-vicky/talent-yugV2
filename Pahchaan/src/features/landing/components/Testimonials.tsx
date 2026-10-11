"use client";

import { motion } from "framer-motion";
import { STAGGER_CONTAINER, SLIDE_UP } from "../utils/animations";

export function Testimonials() {
  const testimonials = [
    {
      quote: "Pahchaan completely transformed how we handle our global summits. The seamless check-in experience and offline scanner saved us during a massive network outage.",
      author: "Sarah Jenkins",
      role: "VP of Events, GlobalBank",
      initial: "S"
    },
    {
      quote: "The monochrome design is not just beautiful, it's highly functional. We trained our staff in minutes, and the analytics dashboard gives us instant insights.",
      author: "Marcus Chen",
      role: "Operations Director, TechNova",
      initial: "M"
    },
    {
      quote: "Finally, an event management platform that doesn't look like it was built in 2010. Pahchaan brings modern SaaS architecture to a legacy industry.",
      author: "Elena Rodriguez",
      role: "Founder, Pinnacle Events",
      initial: "E"
    }
  ];

  return (
    <section className="py-24 bg-white border-y border-zinc-200">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER_CONTAINER}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((test, i) => (
            <motion.div 
              key={i} 
              variants={SLIDE_UP} 
              className="flex flex-col gap-6 p-8 rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:bg-white group cursor-default"
            >
              <div className="flex text-zinc-300 transition-all duration-500 group-hover:text-zinc-900 group-hover:scale-110 group-hover:-translate-y-1 origin-top-left">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 11L8 15H11V19H5V15L7 11H5V7H11V11H10ZM20 11L18 15H21V19H15V15L17 11H15V7H21V11H20Z" />
                </svg>
              </div>
              <p className="text-base text-zinc-700 leading-relaxed flex-1 transition-colors duration-500 group-hover:text-zinc-900">
                &quot;{test.quote}&quot;
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center font-bold text-white shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:shadow-md relative">
                  <span className="relative z-10">{test.initial}</span>
                  <div className="absolute inset-0 rounded-full ring-2 ring-zinc-900 ring-offset-2 opacity-0 group-hover:opacity-30 group-hover:animate-ping transition-opacity duration-500" />
                </div>
                <div>
                  <h5 className="font-semibold text-sm text-zinc-900">{test.author}</h5>
                  <p className="text-xs text-zinc-500">{test.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
