"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 20, // 20-second cache for instant sub-second tab navigation
        gcTime: 1000 * 60 * 30, // 30 minutes in-memory cache
        refetchOnWindowFocus: false, // Prevents tab-switch lag
        refetchOnMount: true, // Re-validate fresh data in background
        retry: 1, // Fast single retry on network failure
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
