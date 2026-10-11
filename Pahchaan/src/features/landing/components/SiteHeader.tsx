"use client";

import { useState } from "react";
import Link from "next/link";
import { useScroll, useMotionValueEvent, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function SiteHeader() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [prevScroll, setPrevScroll] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useMotionValueEvent(scrollY, "change", (latest: number) => {
    if (latest > prevScroll && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setPrevScroll(latest);
  });

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Solutions", href: "#solutions" },
    { label: "Documentation", href: "#documentation" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <motion.header
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: "-100%", opacity: 0 },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed top-6 inset-x-0 mx-auto z-50 flex items-center justify-between px-6 py-3 max-w-5xl bg-white/60 backdrop-blur-2xl border border-white/40 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-zinc-200/50"
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 bg-gradient-to-tr from-zinc-900 to-zinc-700 rounded-xl flex items-center justify-center shadow-md border border-zinc-800 transition-transform group-hover:scale-105">
            <span className="text-white font-bold text-lg leading-none">P</span>
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">Pahchaan</span>
        </Link>
        <nav className="hidden md:flex items-center" onMouseLeave={() => setHoveredIndex(null)}>
          {navLinks.map((link, idx) => (
            <Link
              key={link.label}
              href={link.href}
              onMouseEnter={() => setHoveredIndex(idx)}
              className="relative px-5 py-2 text-sm font-medium rounded-full z-10 transition-colors"
            >
              <span className={`relative z-20 transition-colors duration-200 ${hoveredIndex === idx ? 'text-zinc-900' : 'text-zinc-500'}`}>
                {link.label}
              </span>
              {hoveredIndex === idx && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-zinc-100/80 rounded-full z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-4 py-2 hover:bg-zinc-100/50 rounded-full">
            Sign In
          </Link>
          <Link href="/signup" passHref>
            <Button className="rounded-full px-6 bg-zinc-900 text-white hover:bg-zinc-800 hover:scale-105 transition-all shadow-sm">Get Started</Button>
          </Link>
        </div>
        <Sheet>
          <SheetTrigger className="md:hidden" render={<Button variant="ghost" size="icon" />}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex flex-col gap-6 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-4 mt-4 pt-4 border-t">
                <Link href="/login" className="text-lg font-medium">
                  Sign In
                </Link>
                <Link href="/signup" passHref className="w-full">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  );
}


