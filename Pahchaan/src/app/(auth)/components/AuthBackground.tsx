"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function AuthBackground() {
  return (
    <>
      {/* Ambient Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" 
      />

      {/* Abstract Background Image */}
      <motion.div 
        animate={{ 
          y: [-20, 20, -20],
          rotateZ: [-2, 2, -2]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none translate-x-12 translate-y-12"
      >
        <Image 
          src="/pahchaan/auth-bg.png" 
          alt="Abstract glassmorphism geometric shape" 
          width={800} 
          height={800} 
          className="w-[120%] h-auto max-w-none object-contain invert mix-blend-screen opacity-80"
          priority
        />
      </motion.div>
    </>
  );
}
