"use client";

import { motion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.15, 
        ease: "easeOut"
      }}
      className="flex flex-col flex-1 w-full h-full"
    >
      {children}
    </motion.div>
  );
}
