"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FADE_IN, SLIDE_UP, STAGGER_CONTAINER } from "../utils/animations";
import { HeroPreview } from "./HeroPreview";

const Typewriter = ({ items }: { items: { text: string, color?: string }[] }) => {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentItem = items[index % items.length];
      const currentWord = currentItem.text;
      
      if (!isDeleting) {
        setText(currentWord.substring(0, text.length + 1));
        if (text === currentWord) {
          setTimeout(() => setIsDeleting(true), 2000); // Pause at full word
          return;
        }
      } else {
        setText(currentWord.substring(0, text.length - 1));
        if (text === "") {
          setIsDeleting(false);
          setIndex((prev) => prev + 1);
          return;
        }
      }
    }, isDeleting ? 40 : 120);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, index, items]);

  return (
    <span className="inline-block text-zinc-900 transition-colors duration-300">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div 
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto"
        >
          <motion.div variants={FADE_IN} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-white text-xs font-medium text-zinc-600 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-zinc-900" />
            Introducing Pahchaan Enterprise 2.0
          </motion.div>
          
          <div className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight text-zinc-900 perspective-1000">
            <div className="overflow-hidden inline-block h-[1.2em] relative">
              <motion.span
                initial={{ opacity: 0, y: 100, rotateZ: 10 }}
                animate={{ opacity: 1, y: 0, rotateZ: 0 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                className="inline-block origin-bottom-left mr-[0.25em]"
              >
                Manage
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="inline-block"
              >
                <Typewriter items={[
                  { text: "Events.", color: "text-blue-600" },
                  { text: "Conferences.", color: "text-emerald-600" },
                  { text: "Trade Shows.", color: "text-amber-500" },
                  { text: "Festivals.", color: "text-purple-600" },
                  { text: "Meetups.", color: "text-rose-600" }
                ]} />
              </motion.span>
            </div>
            <br className="hidden md:block" />
            <div className="overflow-hidden inline-block">
              {["Track", "Every", "Guest."].map((word, i, arr) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 100, rotateZ: 10 }}
                  animate={{ opacity: 1, y: 0, rotateZ: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.08, type: "spring", bounce: 0.4 }}
                  className={`inline-block origin-bottom-left ${i !== arr.length - 1 ? 'mr-[0.25em]' : ''}`}
                >
                  {word}
                </motion.span>
              ))}
            </div>
            <br className="hidden md:block" />
            <div className="overflow-hidden inline-block">
              {["All", "From", "One", "Platform."].map((word, i, arr) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 100, rotateZ: 10 }}
                  animate={{ opacity: 1, y: 0, rotateZ: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.08, type: "spring", bounce: 0.4 }}
                  className={`inline-block origin-bottom-left text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-900 ${i !== arr.length - 1 ? 'mr-[0.25em]' : ''}`}
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-base md:text-lg text-zinc-500 max-w-2xl"
          >
            The premium enterprise platform for event management, intelligent QR codes, secure check-ins, and real-time operations analytics.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto"
          >
            <Link href="/signup" passHref>
              <Button size="lg" className="w-full sm:w-auto rounded-full h-12 px-8 text-base group bg-zinc-900 text-white hover:bg-zinc-800 hover:scale-105 transition-all shadow-md">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <HeroPreview />
      </div>
    </section>
  );
}
