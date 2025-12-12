/**
 * Account Onboarding Store
 *
 * Manages state for the 4-step user/account onboarding wizard.
 * State persists to localStorage for resume functionality.
 *
 * Steps:
 * 1. Create Workspace
 * 2. Add AI Provider (BYOAI)
 * 3. Meet Your AI Team
 * 4. Ready!
 *
 * Story: 15.3 - Implement 4-Step User Onboarding Wizard
 */

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * LocalStorage key for persisting wizard state.
 */
export const ACCOUNT_ONBOARDING_STORE_KEY = 'hyvve-account-onboarding' as const;

/**
 * AI Provider options
 */
export type AiProvider = 'anthropic' | 'openai' | 'google' | 'deepseek' | 'openrouter';

interface AccountOnboardingStore {
  // Step tracking
  currentStep: number;
  isComplete: boolean;

  // Step 1: Workspace
  workspaceName: string;
  workspaceSlug: string;
  workspaceId: string | null;

  // Step 2: AI Provider (BYOAI)
  aiProvider: AiProvider | null;
  aiApiKey: string;
  aiKeyVerified: boolean;
  skippedAiSetup: boolean;

  // Actions
  setCurrentStep: (step: number) => void;
  setWorkspace: (name: string, slug: string) => void;
  setWorkspaceId: (id: string) => void;
  setAiProvider: (provider: AiProvider | null) => void;
  setAiApiKey: (key: string) => void;
  setAiKeyVerified: (verified: boolean) => void;
  setSkippedAiSetup: (skipped: boolean) => void;
  markComplete: () => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  isComplete: false,
  workspaceName: '',
  workspaceSlug: '',
  workspaceId: null,
  aiProvider: null,
  aiApiKey: '',
  aiKeyVerified: false,
  skippedAiSetup: false,
};

export const useAccountOnboardingStore = create<AccountOnboardingStore>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),

      setWorkspace: (name, slug) => set({ workspaceName: name, workspaceSlug: slug }),

      setWorkspaceId: (id) => set({ workspaceId: id }),

      setAiProvider: (provider) =>
        set({ aiProvider: provider, aiApiKey: '', aiKeyVerified: false }),

      setAiApiKey: (key) => set({ aiApiKey: key, aiKeyVerified: false }),

      setAiKeyVerified: (verified) => set({ aiKeyVerified: verified }),

      setSkippedAiSetup: (skipped) => set({ skippedAiSetup: skipped }),

      markComplete: () => set({ isComplete: true }),

      reset: () => set(initialState),
    }),
    {
      name: ACCOUNT_ONBOARDING_STORE_KEY,
      partialize: (state) => ({
        currentStep: state.currentStep,
        isComplete: state.isComplete,
        workspaceName: state.workspaceName,
        workspaceSlug: state.workspaceSlug,
        workspaceId: state.workspaceId,
        aiProvider: state.aiProvider,
        // Don't persist API key for security
        aiKeyVerified: state.aiKeyVerified,
        skippedAiSetup: state.skippedAiSetup,
      }),
      // Skip automatic hydration to prevent SSR mismatches
      skipHydration: true,
    }
  )
);

/**
 * Hook to check if the account onboarding store has been hydrated from localStorage.
 *
 * @example
 * ```tsx
 * const isHydrated = useAccountOnboardingStoreHydrated();
 * const { currentStep } = useAccountOnboardingStore();
 *
 * if (!isHydrated) return <LoadingSpinner />;
 * ```
 */
export function useAccountOnboardingStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Rehydrate the store on mount
    useAccountOnboardingStore.persist.rehydrate();

    // Mark as hydrated after rehydration completes
    const unsubFinishHydration = useAccountOnboardingStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Check if already hydrated (in case rehydrate was sync)
    if (useAccountOnboardingStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
}
