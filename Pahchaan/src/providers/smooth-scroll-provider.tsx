"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Disable Lenis smooth scrolling inside the web app portion to preserve native scrolling behavior
  // for complex app layouts, sidebars, nested scroll containers, and registration pages.
  const isAppRoute = pathname?.startsWith("/events") || pathname?.startsWith("/dashboard") || pathname?.startsWith("/templates") || pathname?.startsWith("/workspace") || pathname?.startsWith("/r") || pathname?.startsWith("/onboarding");

  if (isAppRoute) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
