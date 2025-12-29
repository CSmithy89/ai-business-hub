'use client';

import { useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeErrorTracking } from '@/lib/telemetry/error-tracking';
import { RealtimeProvider } from '@/lib/realtime';
import { useCsrfRefresh } from '@/hooks/use-csrf-refresh';
import { CopilotKitProvider } from '@/components/copilot/CopilotKitProvider';

function CsrfRefresher() {
  useCsrfRefresh();
  return null;
}

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
    if (
      (window as unknown as { __errorTrackingInitialized?: boolean })
        .__errorTrackingInitialized
    )
      return;

    let mounted = true;

    (async () => {
      try {
        await initializeErrorTracking();
        if (mounted) {
          (
            window as unknown as { __errorTrackingInitialized?: boolean }
          ).__errorTrackingInitialized = true;
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
        <RealtimeProvider>
          <CopilotKitProvider>
            <TooltipProvider delayDuration={300}>
              <CsrfRefresher />
              {children}
            </TooltipProvider>
          </CopilotKitProvider>
        </RealtimeProvider>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
