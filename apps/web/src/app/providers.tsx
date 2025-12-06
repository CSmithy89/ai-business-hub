'use client';

import { useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { initializeErrorTracking } from '@/lib/telemetry/error-tracking';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).__errorTrackingInitialized) return;

    let mounted = true;

    (async () => {
      try {
        await initializeErrorTracking();
        if (mounted) {
          (window as any).__errorTrackingInitialized = true;
        }
      } catch (err) {
         
        console.error('Error initializing error tracking:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
