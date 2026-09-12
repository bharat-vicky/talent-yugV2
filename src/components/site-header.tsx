"use client";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="TalentYug home"
    >
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" focusable="false">
          <path
            d="M20 45H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h36a3 3 0 0 1 3 3v36a3 3 0 0 1-3 3H28"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="brand-symbol-figure">
            <circle cx="24" cy="13" r="3.6" fill="currentColor" />
            <path
              d="m17 18 7 12 7-12M10 27l10 5v13m18-18-10 5v13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </span>
      <span>
        Talent<span className="brand-yug">Yug</span>
        <span className="brand-period">.</span>
      </span>
    </Link>
  );
}
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#ecosystem">Who we help</a>
          <a href="#programme">Our programme</a>
          <a href="#story">Our story</a>
          <a href="#impact">Our impact</a>
        </nav>
        <Button asChild size="small" className="header-cta">
          <a href="#contact">
            Let’s build futures <ArrowUpRight size={17} />
          </a>
        </Button>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
      {menuOpen && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
          onClick={() => setMenuOpen(false)}
        >
          <a href="#ecosystem">Who we help</a>
          <a href="#programme">Our programme</a>
          <a href="#story">Our story</a>
          <a href="#impact">Our impact</a>
          <a href="#contact">Let’s build futures ↗</a>
        </nav>
      )}
    </header>
  );
}
