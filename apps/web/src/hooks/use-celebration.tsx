'use client';

import { useCallback, useMemo, useState } from 'react';
import { Confetti, triggerConfetti, CELEBRATION_COLORS } from '@/components/ui/confetti';

/** Types of celebrations available */
export type CelebrationType = 'confetti' | 'badge' | 'checkmark' | 'character';

export interface CelebrationState {
  /** Whether a celebration is currently active */
  celebrating: boolean;
  /** The type of celebration currently active */
  type: CelebrationType | null;
}

export interface BadgeData {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface UseCelebrationOptions {
  /** Callback when any celebration completes */
  onComplete?: () => void;
}

export interface UseCelebrationReturn {
  /** Whether a celebration is currently active */
  celebrating: boolean;
  /** The current celebration type (null if not celebrating) */
  celebrationType: CelebrationType | null;
  /** Trigger a celebration of the specified type */
  celebrate: (type: CelebrationType, options?: CelebrationOptions) => void;
  /** Stop the current celebration */
  stopCelebrating: () => void;
  /** Confetti component to render in your JSX */
  ConfettiComponent: React.FC;
  /** Badge celebration state for BadgeCelebration component */
  badgeState: {
    show: boolean;
    badge: BadgeData | null;
    onClose: () => void;
  };
  /** Checkmark state for AnimatedCheckmark component */
  checkmarkState: {
    show: boolean;
    onComplete: () => void;
  };
  /** Character celebration state */
  characterState: {
    show: boolean;
    onComplete: () => void;
  };
}

export interface CelebrationOptions {
  /** Badge data (required for 'badge' type) */
  badge?: BadgeData;
  /** Callback when this specific celebration completes */
  onComplete?: () => void;
}

/**
 * useCelebration Hook
 *
 * Manages celebration state and provides functions to trigger celebrations.
 * Supports multiple celebration types: confetti, badge, checkmark, character.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { celebrate, ConfettiComponent, badgeState } = useCelebration();
 *
 *   const handleSuccess = () => {
 *     celebrate('confetti');
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleSuccess}>Complete!</button>
 *       <ConfettiComponent />
 *       <BadgeCelebration {...badgeState} />
 *     </>
 *   );
 * }
 * ```
 */
export function useCelebration(
  options: UseCelebrationOptions = {}
): UseCelebrationReturn {
  const { onComplete: globalOnComplete } = options;

  const [state, setState] = useState<CelebrationState>({
    celebrating: false,
    type: null,
  });

  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [currentOnComplete, setCurrentOnComplete] = useState<
    (() => void) | null
  >(null);

  const handleComplete = useCallback(() => {
    setState({ celebrating: false, type: null });
    setConfettiTrigger(false);
    setBadgeData(null);
    currentOnComplete?.();
    globalOnComplete?.();
    setCurrentOnComplete(null);
  }, [currentOnComplete, globalOnComplete]);

  const celebrate = useCallback(
    (type: CelebrationType, celebrationOptions?: CelebrationOptions) => {
      setState({ celebrating: true, type });

      if (celebrationOptions?.onComplete) {
        setCurrentOnComplete(() => celebrationOptions.onComplete);
      }

      switch (type) {
        case 'confetti':
          setConfettiTrigger(true);
          break;
        case 'badge':
          if (celebrationOptions?.badge) {
            setBadgeData(celebrationOptions.badge);
          }
          break;
        case 'checkmark':
        case 'character':
          // These types are handled by the state alone
          break;
      }
    },
    []
  );

  const stopCelebrating = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // Confetti component that can be rendered
  const ConfettiComponent: React.FC = useMemo(
    () =>
      function ConfettiComponentInner() {
        return (
          <Confetti
            trigger={confettiTrigger}
            onComplete={handleComplete}
            colors={CELEBRATION_COLORS}
          />
        );
      },
    [confettiTrigger, handleComplete]
  );

  return {
    celebrating: state.celebrating,
    celebrationType: state.type,
    celebrate,
    stopCelebrating,
    ConfettiComponent,
    badgeState: {
      show: state.type === 'badge' && state.celebrating,
      badge: badgeData,
      onClose: handleComplete,
    },
    checkmarkState: {
      show: state.type === 'checkmark' && state.celebrating,
      onComplete: handleComplete,
    },
    characterState: {
      show: state.type === 'character' && state.celebrating,
      onComplete: handleComplete,
    },
  };
}

/**
 * Simple imperative celebration function for one-off use
 * Useful when you don't need the full hook
 */
export { triggerConfetti };
