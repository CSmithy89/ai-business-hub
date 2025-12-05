/**
 * Onboarding Wizard Store
 *
 * Manages state for the multi-step business onboarding wizard.
 * State persists to localStorage with 7-day expiry for resume functionality.
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 */

import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * LocalStorage key for persisting wizard state.
 */
export const ONBOARDING_WIZARD_STORE_KEY = 'hyvve-onboarding-wizard' as const

/**
 * State expiry duration: 7 days in milliseconds
 */
const STATE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface OnboardingWizardStore {
  // Step tracking
  currentStep: number
  timestamp: number // For expiry check

  // Step 1: Choice
  hasDocuments: boolean | null

  // Step 2: Business Details
  businessName: string
  businessDescription: string

  // Step 3: Initial Idea
  problemStatement: string
  targetCustomer: string
  proposedSolution: string

  // Actions
  setCurrentStep: (step: number) => void
  setHasDocuments: (hasDocuments: boolean) => void
  setBusinessName: (name: string) => void
  setBusinessDescription: (description: string) => void
  setProblemStatement: (problem: string) => void
  setTargetCustomer: (customer: string) => void
  setProposedSolution: (solution: string) => void
  reset: () => void

  // Internal: Update timestamp on any change
  _updateTimestamp: () => void
}

const initialState = {
  currentStep: 1,
  timestamp: Date.now(),
  hasDocuments: null,
  businessName: '',
  businessDescription: '',
  problemStatement: '',
  targetCustomer: '',
  proposedSolution: '',
}

export const useOnboardingWizardStore = create<OnboardingWizardStore>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentStep: (step) =>
        set((state) => {
          state._updateTimestamp()
          return { currentStep: step, timestamp: Date.now() }
        }),

      setHasDocuments: (hasDocuments) =>
        set(() => ({ hasDocuments, timestamp: Date.now() })),

      setBusinessName: (businessName) =>
        set(() => ({ businessName, timestamp: Date.now() })),

      setBusinessDescription: (businessDescription) =>
        set(() => ({ businessDescription, timestamp: Date.now() })),

      setProblemStatement: (problemStatement) =>
        set(() => ({ problemStatement, timestamp: Date.now() })),

      setTargetCustomer: (targetCustomer) =>
        set(() => ({ targetCustomer, timestamp: Date.now() })),

      setProposedSolution: (proposedSolution) =>
        set(() => ({ proposedSolution, timestamp: Date.now() })),

      reset: () => set(initialState),

      _updateTimestamp: () => set({ timestamp: Date.now() }),
    }),
    {
      name: ONBOARDING_WIZARD_STORE_KEY,
      partialize: (state) => ({
        currentStep: state.currentStep,
        timestamp: state.timestamp,
        hasDocuments: state.hasDocuments,
        businessName: state.businessName,
        businessDescription: state.businessDescription,
        problemStatement: state.problemStatement,
        targetCustomer: state.targetCustomer,
        proposedSolution: state.proposedSolution,
      }),
      // Skip automatic hydration to prevent SSR mismatches
      skipHydration: true,
    }
  )
)

/**
 * Hook to check if the wizard store has been hydrated from localStorage.
 * Also checks for state expiry (7 days) and clears expired state.
 *
 * @example
 * ```tsx
 * const isHydrated = useOnboardingWizardStoreHydrated();
 * const { currentStep } = useOnboardingWizardStore();
 *
 * if (!isHydrated) return <LoadingSpinner />;
 * ```
 */
export function useOnboardingWizardStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Rehydrate the store on mount
    useOnboardingWizardStore.persist.rehydrate()

    // Mark as hydrated after rehydration completes
    const unsubFinishHydration = useOnboardingWizardStore.persist.onFinishHydration(() => {
      // Check if state has expired
      const state = useOnboardingWizardStore.getState()
      const now = Date.now()
      const age = now - state.timestamp

      if (age > STATE_EXPIRY_MS) {
        // State expired, reset to initial
        state.reset()
      }

      setHydrated(true)
    })

    // Check if already hydrated (in case rehydrate was sync)
    if (useOnboardingWizardStore.persist.hasHydrated()) {
      setHydrated(true)
    }

    return () => {
      unsubFinishHydration()
    }
  }, [])

  return hydrated
}
