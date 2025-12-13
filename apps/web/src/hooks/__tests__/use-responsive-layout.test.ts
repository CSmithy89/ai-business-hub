import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsiveLayout } from '../use-responsive-layout';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('useResponsiveLayout', () => {
  const originalInnerWidth = window.innerWidth;
  const originalLocalStorage = window.localStorage;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    localStorageMock.clear();

    // Setup mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia(false),
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      writable: true,
    });
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
    Object.defineProperty(window, 'matchMedia', {
      value: originalMatchMedia,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  const setWindowWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      value: width,
      writable: true,
      configurable: true,
    });
  };

  describe('initial state', () => {
    it('provides all expected return values', () => {
      setWindowWidth(1920);
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current).toHaveProperty('breakpoint');
      expect(result.current).toHaveProperty('isMediumScreen');
      expect(result.current).toHaveProperty('isTablet');
      expect(result.current).toHaveProperty('isMobile');
      expect(result.current).toHaveProperty('isTouchDevice');
      expect(result.current).toHaveProperty('layoutPriority');
      expect(result.current).toHaveProperty('setLayoutPriority');
      expect(result.current).toHaveProperty('shouldAutoCollapseSidebar');
      expect(result.current).toHaveProperty('shouldAutoCollapseChat');
      expect(result.current).toHaveProperty('windowWidth');
    });

    it('defaults layoutPriority to sidebar', () => {
      setWindowWidth(1920);
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.layoutPriority).toBe('sidebar');
    });

    it('loads layoutPriority from localStorage if available', () => {
      localStorageMock.setItem('hyvve-layout-priority', 'chat');
      setWindowWidth(1920);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.layoutPriority).toBe('chat');
    });
  });

  describe('breakpoint detection', () => {
    it('returns mobile for width < 640px', () => {
      setWindowWidth(500);
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('mobile');
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isMediumScreen).toBe(false);
    });

    it('returns mobile for width < 768px', () => {
      setWindowWidth(700);
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('mobile');
      expect(result.current.isMobile).toBe(true);
    });

    it('returns tablet for width 768-1024px', () => {
      setWindowWidth(900);
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('tablet');
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isMediumScreen).toBe(false);
    });

    it('returns medium for width 1024-1280px', () => {
      setWindowWidth(1100);
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('medium');
      expect(result.current.isMediumScreen).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isMobile).toBe(false);
    });

    it('returns desktop for width 1280-1536px', () => {
      setWindowWidth(1400);
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('desktop');
      expect(result.current.isMediumScreen).toBe(false);
    });

    it('returns wide for width >= 1536px', () => {
      setWindowWidth(1920);
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.breakpoint).toBe('wide');
    });
  });

  describe('setLayoutPriority', () => {
    it('updates layoutPriority state', () => {
      setWindowWidth(1920);
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.layoutPriority).toBe('sidebar');

      act(() => {
        result.current.setLayoutPriority('chat');
      });

      expect(result.current.layoutPriority).toBe('chat');
    });

    it('persists layoutPriority to localStorage', () => {
      setWindowWidth(1920);
      const { result } = renderHook(() => useResponsiveLayout());

      act(() => {
        result.current.setLayoutPriority('chat');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hyvve-layout-priority',
        'chat'
      );
    });
  });

  describe('auto-collapse logic', () => {
    it('shouldAutoCollapseSidebar is true on medium screen with chat priority', () => {
      setWindowWidth(1100);
      localStorageMock.setItem('hyvve-layout-priority', 'chat');

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.isMediumScreen).toBe(true);
      expect(result.current.layoutPriority).toBe('chat');
      expect(result.current.shouldAutoCollapseSidebar).toBe(true);
      expect(result.current.shouldAutoCollapseChat).toBe(false);
    });

    it('shouldAutoCollapseChat is true on medium screen with sidebar priority', () => {
      setWindowWidth(1100);
      localStorageMock.setItem('hyvve-layout-priority', 'sidebar');

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.isMediumScreen).toBe(true);
      expect(result.current.layoutPriority).toBe('sidebar');
      expect(result.current.shouldAutoCollapseChat).toBe(true);
      expect(result.current.shouldAutoCollapseSidebar).toBe(false);
    });

    it('neither auto-collapse is true on desktop screens', () => {
      setWindowWidth(1400);
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.isMediumScreen).toBe(false);
      expect(result.current.shouldAutoCollapseSidebar).toBe(false);
      expect(result.current.shouldAutoCollapseChat).toBe(false);
    });
  });

  describe('touch device detection', () => {
    it('detects touch device when pointer: coarse matches', () => {
      setWindowWidth(1920);
      Object.defineProperty(window, 'matchMedia', {
        value: mockMatchMedia(true),
        writable: true,
      });

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.isTouchDevice).toBe(true);
    });

    it('detects non-touch device when pointer: coarse does not match', () => {
      setWindowWidth(1920);
      Object.defineProperty(window, 'matchMedia', {
        value: mockMatchMedia(false),
        writable: true,
      });

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.isTouchDevice).toBe(false);
    });
  });

  describe('windowWidth tracking', () => {
    it('reports current window width', () => {
      setWindowWidth(1234);
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.windowWidth).toBe(1234);
    });
  });

  describe('localStorage error handling', () => {
    it('defaults to sidebar when localStorage throws on read', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      setWindowWidth(1920);

      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.layoutPriority).toBe('sidebar');
    });

    it('gracefully handles localStorage write errors', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      setWindowWidth(1920);

      const { result } = renderHook(() => useResponsiveLayout());

      // Should not throw
      act(() => {
        result.current.setLayoutPriority('chat');
      });

      // State should still update even if localStorage fails
      expect(result.current.layoutPriority).toBe('chat');
    });
  });
});
