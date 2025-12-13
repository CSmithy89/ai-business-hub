import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCelebration, type CelebrationType } from '../use-celebration';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('useCelebration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia(false); // Default: animations enabled
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('starts with celebrating=false and type=null', () => {
      const { result } = renderHook(() => useCelebration());

      expect(result.current.celebrating).toBe(false);
      expect(result.current.celebrationType).toBe(null);
    });

    it('provides all expected return values', () => {
      const { result } = renderHook(() => useCelebration());

      expect(result.current).toHaveProperty('celebrating');
      expect(result.current).toHaveProperty('celebrationType');
      expect(result.current).toHaveProperty('celebrate');
      expect(result.current).toHaveProperty('stopCelebrating');
      expect(result.current).toHaveProperty('ConfettiComponent');
      expect(result.current).toHaveProperty('badgeState');
      expect(result.current).toHaveProperty('checkmarkState');
      expect(result.current).toHaveProperty('characterState');
    });
  });

  describe('celebrate()', () => {
    it('sets celebrating=true when called', () => {
      const { result } = renderHook(() => useCelebration());

      act(() => {
        result.current.celebrate('confetti');
      });

      expect(result.current.celebrating).toBe(true);
    });

    it.each(['confetti', 'badge', 'checkmark', 'character'] as CelebrationType[])(
      'sets celebrationType to "%s" when called with that type',
      (type) => {
        const { result } = renderHook(() => useCelebration());

        act(() => {
          result.current.celebrate(type);
        });

        expect(result.current.celebrationType).toBe(type);
      }
    );
  });

  describe('badge celebration', () => {
    it('sets badgeState.show=true when type is badge', () => {
      const { result } = renderHook(() => useCelebration());

      act(() => {
        result.current.celebrate('badge', {
          badge: {
            icon: null,
            title: 'Test Badge',
            description: 'Test description',
          },
        });
      });

      expect(result.current.badgeState.show).toBe(true);
      expect(result.current.badgeState.badge?.title).toBe('Test Badge');
    });

    it('calls onClose to stop celebrating', () => {
      const { result } = renderHook(() => useCelebration());

      act(() => {
        result.current.celebrate('badge', {
          badge: {
            icon: null,
            title: 'Test Badge',
            description: 'Test description',
          },
        });
      });

      expect(result.current.celebrating).toBe(true);

      act(() => {
        result.current.badgeState.onClose();
      });

      expect(result.current.celebrating).toBe(false);
    });
  });

  describe('checkmark celebration', () => {
    it('sets checkmarkState.show=true when type is checkmark', () => {
      const { result } = renderHook(() => useCelebration());

      act(() => {
        result.current.celebrate('checkmark');
      });

      expect(result.current.checkmarkState.show).toBe(true);
    });

    it('calls onComplete to stop celebrating', () => {
      const { result } = renderHook(() => useCelebration());

      act(() => {
        result.current.celebrate('checkmark');
      });

      expect(result.current.celebrating).toBe(true);

      act(() => {
        result.current.checkmarkState.onComplete();
      });

      expect(result.current.celebrating).toBe(false);
    });
  });

  describe('character celebration', () => {
    it('sets characterState.show=true when type is character', () => {
      const { result } = renderHook(() => useCelebration());

      act(() => {
        result.current.celebrate('character');
      });

      expect(result.current.characterState.show).toBe(true);
    });
  });

  describe('stopCelebrating()', () => {
    it('resets celebration state', () => {
      const { result } = renderHook(() => useCelebration());

      act(() => {
        result.current.celebrate('confetti');
      });

      expect(result.current.celebrating).toBe(true);

      act(() => {
        result.current.stopCelebrating();
      });

      expect(result.current.celebrating).toBe(false);
      expect(result.current.celebrationType).toBe(null);
    });
  });

  describe('callbacks', () => {
    it('calls global onComplete when celebration ends', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useCelebration({ onComplete }));

      act(() => {
        result.current.celebrate('checkmark');
      });

      act(() => {
        result.current.stopCelebrating();
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('calls celebration-specific onComplete when provided', () => {
      const specificOnComplete = vi.fn();
      const { result } = renderHook(() => useCelebration());

      act(() => {
        result.current.celebrate('badge', {
          badge: { icon: null, title: 'Test', description: 'Test' },
          onComplete: specificOnComplete,
        });
      });

      act(() => {
        result.current.badgeState.onClose();
      });

      expect(specificOnComplete).toHaveBeenCalledTimes(1);
    });
  });
});
