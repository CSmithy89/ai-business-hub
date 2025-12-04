'use client';

import { Button } from '@/components/ui/button';

/**
 * DashboardWelcome Component
 *
 * Welcome section with user greeting and quick actions.
 * Displays personalized welcome message and call-to-action buttons.
 */
export function DashboardWelcome() {
  // TODO: Get actual user name from session in future story
  const userName = 'Alex';
  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold leading-snug text-[rgb(var(--color-text-primary))]">
          {greeting}, {userName}!
        </h1>
        <p className="text-base text-[rgb(var(--color-text-secondary))]">
          Here&apos;s what needs your attention today
        </p>
      </div>

      {/* Quick Actions - Desktop */}
      <div className="hidden md:flex md:gap-3">
        <Button
          variant="outline"
          size="default"
          className="gap-2"
          onClick={() => {
            // TODO: Navigate to approvals page
            console.log('Navigate to approvals');
          }}
        >
          <span className="material-symbols-rounded text-xl">check_circle</span>
          Review Approvals
        </Button>
        <Button
          variant="default"
          size="default"
          className="gap-2"
          onClick={() => {
            // TODO: Open chat panel with new conversation
            console.log('Open chat panel');
          }}
        >
          <span className="material-symbols-rounded text-xl">smart_toy</span>
          Talk to Hub
        </Button>
      </div>
    </div>
  );
}

/**
 * Get time-appropriate greeting
 */
function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    return 'Good evening';
  } else {
    return 'Hello';
  }
}
