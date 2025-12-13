/**
 * Step 4: Ready/Complete Component
 *
 * Final step of account onboarding wizard.
 * Shows completion message and CTA to dashboard.
 *
 * Story: 15.3 - Implement 4-Step User Onboarding Wizard
 * Story: 16-25 - Implement Celebration Moments (confetti)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Confetti } from '@/components/ui/confetti';
import { PartyPopper, ArrowRight, Rocket, Loader2 } from 'lucide-react';

interface StepCompleteProps {
  userName?: string;
  workspaceName: string;
  onComplete: () => void;
}

export function StepComplete({ userName, workspaceName, onComplete }: StepCompleteProps) {
  const router = useRouter();
  const [showTour, setShowTour] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti celebration on mount
  useEffect(() => {
    setShowConfetti(true);
  }, []);

  const handleGoDashboard = () => {
    setIsNavigating(true);
    onComplete();

    // Store tour preference if selected
    if (showTour) {
      localStorage.setItem('hyvve-show-tour', 'true');
    }

    // Navigate to businesses page
    router.push('/businesses' as Parameters<typeof router.push>[0]);
  };

  const displayName = userName || 'there';

  return (
    <div className="space-y-8 text-center">
      {/* Confetti celebration */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Success Icon */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-coral">
        <PartyPopper className="h-10 w-10 text-white" />
      </div>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">You&apos;re All Set, {displayName}!</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Welcome to <span className="font-semibold text-foreground">{workspaceName}</span>
        </p>
      </div>

      {/* Success Message */}
      <div className="mx-auto max-w-md space-y-2 rounded-lg bg-muted/50 p-6">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Rocket className="h-5 w-5" />
          <span className="font-medium">Ready to Launch</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Your workspace is set up and your AI team is standing by. Start by creating your first
          business to see them in action.
        </p>
      </div>

      {/* Tour Option */}
      <div className="mx-auto flex max-w-md items-center justify-center gap-3">
        <Checkbox
          id="show-tour"
          checked={showTour}
          onCheckedChange={(checked) => setShowTour(checked === true)}
        />
        <Label htmlFor="show-tour" className="cursor-pointer text-sm text-muted-foreground">
          Show me a quick tour of the platform
        </Label>
      </div>

      {/* CTA Button */}
      <div className="mx-auto max-w-md">
        <Button
          onClick={handleGoDashboard}
          disabled={isNavigating}
          size="lg"
          className="w-full bg-gradient-to-r from-primary to-coral hover:from-primary/90 hover:to-coral/90"
        >
          {isNavigating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening Dashboard...
            </>
          ) : (
            <>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Encouragement */}
      <p className="text-sm text-muted-foreground">
        Need help? Your AI team is always just a chat away.
      </p>
    </div>
  );
}
