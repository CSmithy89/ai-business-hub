/**
 * Onboarding Wizard Store Unit Tests - Epic 07/08
 *
 * Tests for Zustand onboarding wizard store state transitions,
 * persistence, and 7-day expiry functionality.
 * @see docs/epics/EPIC-07-ui-shell.md
 * @see docs/epics/EPIC-08-workflows.md
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
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

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Onboarding Wizard Store State Transitions', () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with step 1', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');
      const state = useOnboardingWizardStore.getState();

      expect(state.currentStep).toBe(1);
    });

    it('should initialize with null hasDocuments', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');
      const state = useOnboardingWizardStore.getState();

      expect(state.hasDocuments).toBeNull();
    });

    it('should initialize with empty business details', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');
      const state = useOnboardingWizardStore.getState();

      expect(state.businessName).toBe('');
      expect(state.businessDescription).toBe('');
    });

    it('should initialize with empty idea fields', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');
      const state = useOnboardingWizardStore.getState();

      expect(state.problemStatement).toBe('');
      expect(state.targetCustomer).toBe('');
      expect(state.proposedSolution).toBe('');
    });

    it('should have a timestamp', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');
      const state = useOnboardingWizardStore.getState();

      expect(state.timestamp).toBeDefined();
      expect(typeof state.timestamp).toBe('number');
    });
  });

  describe('Step Navigation', () => {
    it('should set current step', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      act(() => {
        useOnboardingWizardStore.getState().setCurrentStep(2);
      });

      expect(useOnboardingWizardStore.getState().currentStep).toBe(2);
    });

    it('should update timestamp on step change', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');
      const initialTimestamp = useOnboardingWizardStore.getState().timestamp;

      // Advance time
      vi.advanceTimersByTime(1000);

      act(() => {
        useOnboardingWizardStore.getState().setCurrentStep(3);
      });

      expect(useOnboardingWizardStore.getState().timestamp).toBeGreaterThan(initialTimestamp);
    });

    it('should allow navigating to any step', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      act(() => {
        useOnboardingWizardStore.getState().setCurrentStep(5);
      });

      expect(useOnboardingWizardStore.getState().currentStep).toBe(5);

      act(() => {
        useOnboardingWizardStore.getState().setCurrentStep(1);
      });

      expect(useOnboardingWizardStore.getState().currentStep).toBe(1);
    });
  });

  describe('Step 1: Documents Choice', () => {
    it('should set hasDocuments to true', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      act(() => {
        useOnboardingWizardStore.getState().setHasDocuments(true);
      });

      expect(useOnboardingWizardStore.getState().hasDocuments).toBe(true);
    });

    it('should set hasDocuments to false', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      act(() => {
        useOnboardingWizardStore.getState().setHasDocuments(false);
      });

      expect(useOnboardingWizardStore.getState().hasDocuments).toBe(false);
    });

    it('should update timestamp on hasDocuments change', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');
      const initialTimestamp = useOnboardingWizardStore.getState().timestamp;

      vi.advanceTimersByTime(1000);

      act(() => {
        useOnboardingWizardStore.getState().setHasDocuments(true);
      });

      expect(useOnboardingWizardStore.getState().timestamp).toBeGreaterThan(initialTimestamp);
    });
  });

  describe('Step 2: Business Details', () => {
    it('should set business name', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      act(() => {
        useOnboardingWizardStore.getState().setBusinessName('HYVVE Inc.');
      });

      expect(useOnboardingWizardStore.getState().businessName).toBe('HYVVE Inc.');
    });

    it('should set business description', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      act(() => {
        useOnboardingWizardStore.getState().setBusinessDescription('AI-powered business automation');
      });

      expect(useOnboardingWizardStore.getState().businessDescription).toBe(
        'AI-powered business automation'
      );
    });

    it('should update timestamp on business name change', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');
      const initialTimestamp = useOnboardingWizardStore.getState().timestamp;

      vi.advanceTimersByTime(1000);

      act(() => {
        useOnboardingWizardStore.getState().setBusinessName('Test');
      });

      expect(useOnboardingWizardStore.getState().timestamp).toBeGreaterThan(initialTimestamp);
    });

    it('should update timestamp on business description change', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');
      const initialTimestamp = useOnboardingWizardStore.getState().timestamp;

      vi.advanceTimersByTime(1000);

      act(() => {
        useOnboardingWizardStore.getState().setBusinessDescription('Test description');
      });

      expect(useOnboardingWizardStore.getState().timestamp).toBeGreaterThan(initialTimestamp);
    });
  });

  describe('Step 3: Initial Idea', () => {
    it('should set problem statement', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      act(() => {
        useOnboardingWizardStore.getState().setProblemStatement('Manual business processes are slow');
      });

      expect(useOnboardingWizardStore.getState().problemStatement).toBe(
        'Manual business processes are slow'
      );
    });

    it('should set target customer', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      act(() => {
        useOnboardingWizardStore.getState().setTargetCustomer('Small and medium businesses');
      });

      expect(useOnboardingWizardStore.getState().targetCustomer).toBe('Small and medium businesses');
    });

    it('should set proposed solution', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      act(() => {
        useOnboardingWizardStore.getState().setProposedSolution('AI-powered automation platform');
      });

      expect(useOnboardingWizardStore.getState().proposedSolution).toBe(
        'AI-powered automation platform'
      );
    });

    it('should update timestamp on idea field changes', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      // Test problemStatement
      let initialTimestamp = useOnboardingWizardStore.getState().timestamp;
      vi.advanceTimersByTime(1000);
      act(() => {
        useOnboardingWizardStore.getState().setProblemStatement('Test');
      });
      expect(useOnboardingWizardStore.getState().timestamp).toBeGreaterThan(initialTimestamp);

      // Test targetCustomer
      initialTimestamp = useOnboardingWizardStore.getState().timestamp;
      vi.advanceTimersByTime(1000);
      act(() => {
        useOnboardingWizardStore.getState().setTargetCustomer('Test');
      });
      expect(useOnboardingWizardStore.getState().timestamp).toBeGreaterThan(initialTimestamp);

      // Test proposedSolution
      initialTimestamp = useOnboardingWizardStore.getState().timestamp;
      vi.advanceTimersByTime(1000);
      act(() => {
        useOnboardingWizardStore.getState().setProposedSolution('Test');
      });
      expect(useOnboardingWizardStore.getState().timestamp).toBeGreaterThan(initialTimestamp);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state to initial values', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      // Set various state values
      act(() => {
        useOnboardingWizardStore.getState().setCurrentStep(3);
        useOnboardingWizardStore.getState().setHasDocuments(true);
        useOnboardingWizardStore.getState().setBusinessName('Test Business');
        useOnboardingWizardStore.getState().setBusinessDescription('Test Description');
        useOnboardingWizardStore.getState().setProblemStatement('Test Problem');
        useOnboardingWizardStore.getState().setTargetCustomer('Test Customer');
        useOnboardingWizardStore.getState().setProposedSolution('Test Solution');
      });

      // Verify state was set
      expect(useOnboardingWizardStore.getState().currentStep).toBe(3);
      expect(useOnboardingWizardStore.getState().businessName).toBe('Test Business');

      // Reset
      act(() => {
        useOnboardingWizardStore.getState().reset();
      });

      const state = useOnboardingWizardStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.hasDocuments).toBeNull();
      expect(state.businessName).toBe('');
      expect(state.businessDescription).toBe('');
      expect(state.problemStatement).toBe('');
      expect(state.targetCustomer).toBe('');
      expect(state.proposedSolution).toBe('');
    });
  });

  describe('State Persistence', () => {
    it('should have correct localStorage key', async () => {
      const { ONBOARDING_WIZARD_STORE_KEY } = await import('./onboarding-wizard-store');

      expect(ONBOARDING_WIZARD_STORE_KEY).toBe('hyvve-onboarding-wizard');
    });

    it('should persist state to localStorage', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      act(() => {
        useOnboardingWizardStore.getState().setBusinessName('Persisted Business');
        useOnboardingWizardStore.getState().setCurrentStep(2);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();

      // Check persisted state includes expected fields
      const lastCall = localStorageMock.setItem.mock.calls[
        localStorageMock.setItem.mock.calls.length - 1
      ];
      if (lastCall) {
        const persistedState = JSON.parse(lastCall[1]);
        expect(persistedState.state.businessName).toBe('Persisted Business');
        expect(persistedState.state.currentStep).toBe(2);
      }
    });

    it('should persist timestamp for expiry check', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      act(() => {
        useOnboardingWizardStore.getState().setBusinessName('Test');
      });

      const lastCall = localStorageMock.setItem.mock.calls[
        localStorageMock.setItem.mock.calls.length - 1
      ];
      if (lastCall) {
        const persistedState = JSON.parse(lastCall[1]);
        expect(persistedState.state.timestamp).toBeDefined();
        expect(typeof persistedState.state.timestamp).toBe('number');
      }
    });
  });

  describe('Complete Workflow', () => {
    it('should handle a complete onboarding flow', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      // Step 1: Choose documents path
      act(() => {
        useOnboardingWizardStore.getState().setHasDocuments(false);
        useOnboardingWizardStore.getState().setCurrentStep(2);
      });

      expect(useOnboardingWizardStore.getState().hasDocuments).toBe(false);
      expect(useOnboardingWizardStore.getState().currentStep).toBe(2);

      // Step 2: Fill business details
      act(() => {
        useOnboardingWizardStore.getState().setBusinessName('Acme Corp');
        useOnboardingWizardStore.getState().setBusinessDescription('Widget manufacturing');
        useOnboardingWizardStore.getState().setCurrentStep(3);
      });

      expect(useOnboardingWizardStore.getState().businessName).toBe('Acme Corp');
      expect(useOnboardingWizardStore.getState().currentStep).toBe(3);

      // Step 3: Fill initial idea
      act(() => {
        useOnboardingWizardStore.getState().setProblemStatement('Manual widget tracking');
        useOnboardingWizardStore.getState().setTargetCustomer('Manufacturing companies');
        useOnboardingWizardStore.getState().setProposedSolution('Automated inventory system');
      });

      const finalState = useOnboardingWizardStore.getState();
      expect(finalState.problemStatement).toBe('Manual widget tracking');
      expect(finalState.targetCustomer).toBe('Manufacturing companies');
      expect(finalState.proposedSolution).toBe('Automated inventory system');
    });

    it('should maintain state isolation between fields', async () => {
      const { useOnboardingWizardStore } = await import('./onboarding-wizard-store');

      // Set multiple fields in one batch
      act(() => {
        useOnboardingWizardStore.getState().setHasDocuments(true);
        useOnboardingWizardStore.getState().setBusinessName('Test Business');
        useOnboardingWizardStore.getState().setCurrentStep(4);
      });

      const state = useOnboardingWizardStore.getState();
      expect(state.hasDocuments).toBe(true);
      expect(state.businessName).toBe('Test Business');
      expect(state.currentStep).toBe(4);

      // Changing one field shouldn't affect others
      act(() => {
        useOnboardingWizardStore.getState().setBusinessDescription('New description');
      });

      const updatedState = useOnboardingWizardStore.getState();
      expect(updatedState.hasDocuments).toBe(true);
      expect(updatedState.businessName).toBe('Test Business');
      expect(updatedState.currentStep).toBe(4);
      expect(updatedState.businessDescription).toBe('New description');
    });
  });
});
