import Link from "next/link";
import { ArrowRight } from "lucide-react";

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.83 9.83 0 01-2.828.775 4.932 4.932 0 002.165-2.724 9.864 9.864 0 01-3.127 1.195 4.916 4.916 0 00-8.38 4.482A13.942 13.942 0 011.671 3.149a4.93 4.93 0 001.523 6.574 4.903 4.903 0 01-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.935 4.935 0 01-2.224.084 4.928 4.928 0 004.6 3.419A9.9 9.9 0 010 19.54a13.94 13.94 0 007.548 2.212c9.057 0 14.01-7.507 14.01-14.01 0-.213-.005-.425-.014-.636A10.012 10.012 0 0024 4.557z"/></svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);

export function SiteFooter() {
  const footerLinks = {
    Product: [
      { name: "Features", href: "#" },
      { name: "QR Studio", href: "#" },
      { name: "Scanner App", href: "#" },
      { name: "Analytics", href: "#" },
    ],
    Resources: [
      { name: "Documentation", href: "#" },
      { name: "Help Center", href: "#" },
      { name: "Event Guides", href: "#" },
      { name: "API Reference", href: "#" },
      { name: "Community", href: "#" },
    ],
    Company: [
      { name: "About Us", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Contact", href: "#" },
      { name: "Partners", href: "#" },
    ],
    Legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Security", href: "#" },
      { name: "Cookie Policy", href: "#" },
    ]
  };

  return (
    <footer className="bg-[#050505] pt-24 pb-12 border-t border-white/5 relative overflow-hidden text-zinc-400 font-sans">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Newsletter section removed per user request */}


        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-12 mb-20">
          <div className="col-span-2 md:col-span-2 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                <span className="text-black font-black text-lg leading-none">P</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">Pahchaan</span>
            </Link>
            <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
              The premium enterprise platform for event management, intelligent QR codes, secure check-ins, and analytics.
            </p>
            <div className="flex gap-5 mt-4">
              <a href="#" className="text-zinc-400 hover:text-white hover:scale-110 transition-all"><TwitterIcon className="w-5 h-5" /></a>
              <a href="#" className="text-zinc-400 hover:text-white hover:scale-110 transition-all"><LinkedinIcon className="w-5 h-5" /></a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-5">
              <h4 className="font-bold text-sm text-white uppercase tracking-widest">{category}</h4>
              <ul className="flex flex-col gap-4">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Huge Brand Text Overlay */}
        <div className="w-full flex justify-center items-center pointer-events-none select-none overflow-hidden opacity-5 border-t border-white/5 pt-12">
           <h1 className="text-[15vw] font-black leading-[0.8] tracking-tighter text-white whitespace-nowrap">
             PAHCHAAN
           </h1>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/5 mt-8">
          <p className="text-xs font-medium text-zinc-600">
            © {new Date().getFullYear()} Pahchaan All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
