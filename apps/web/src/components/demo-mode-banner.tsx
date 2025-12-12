'use client';

/**
 * Demo Mode Banner
 *
 * Displays a dismissable banner at the top of the application
 * when demo mode is enabled. Helps users understand they're
 * exploring sample data.
 *
 * Story: 16.8 - Implement Demo Mode Consistency
 */

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { isDemoMode } from '@/lib/demo-data';

const DEMO_BANNER_DISMISSED_KEY = 'hyvve-demo-banner-dismissed';

export function DemoModeBanner() {
  const [isDismissed, setIsDismissed] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if demo mode is enabled
    if (!isDemoMode()) {
      return;
    }

    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem(DEMO_BANNER_DISMISSED_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
      setIsVisible(false);
    } else {
      setIsDismissed(false);
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DEMO_BANNER_DISMISSED_KEY, 'true');
    setIsVisible(false);
    setTimeout(() => setIsDismissed(true), 300); // Wait for animation
  };

  const handleExitDemo = () => {
    // In production, this would trigger a setup flow
    // For now, just show an alert
    alert(
      'To exit demo mode and use real data:\n\n' +
      '1. Set NEXT_PUBLIC_DEMO_MODE=false in your .env.local file\n' +
      '2. Restart the development server\n' +
      '3. Complete the workspace setup'
    );
  };

  // Don't render if not in demo mode or if dismissed
  if (!isDemoMode() || isDismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      )}
    >
      <Alert className="rounded-none border-x-0 border-t-0 bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800">
        <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        <AlertTitle className="flex items-center justify-between pr-8">
          <span className="text-violet-900 dark:text-violet-100">
            Demo Mode Active
          </span>
        </AlertTitle>
        <AlertDescription className="text-violet-700 dark:text-violet-300">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="mb-2">
                You&apos;re exploring HYVVE with sample data. All businesses, agents, and
                approvals are examples to help you understand the platform.
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={handleExitDemo}
                className="h-auto p-0 text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200"
              >
                Exit demo mode and set up your workspace
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 text-violet-600 hover:text-violet-800 hover:bg-violet-100 dark:text-violet-400 dark:hover:text-violet-200 dark:hover:bg-violet-900"
              aria-label="Dismiss demo mode banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Hook to check if demo mode banner is currently visible
 */
export function useDemoModeBannerVisible(): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isDemoMode()) {
      setIsVisible(false);
      return;
    }

    const dismissed = localStorage.getItem(DEMO_BANNER_DISMISSED_KEY);
    setIsVisible(dismissed !== 'true');
  }, []);

  return isVisible;
}

/**
 * Reset demo banner dismissal (for testing/development)
 */
export function resetDemoBannerDismissal() {
  localStorage.removeItem(DEMO_BANNER_DISMISSED_KEY);
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}
