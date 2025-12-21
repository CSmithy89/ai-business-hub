'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface TaskAction {
  taskId: string
  action: 'complete' | 'carry_over' | 'cancel'
  targetPhaseId?: string
}

interface TaskRecommendation {
  taskId: string
  taskTitle: string
  action: 'complete' | 'carry_over' | 'cancel'
  reasoning: string
  suggestedPhase?: string
}

interface IncompleteTask {
  id: string
  title: string
  status: string
  priority: string
  dueDate?: string
}

interface PhaseAnalysis {
  phaseId: string
  phaseName: string
  totalTasks: number
  completedTasks: number
  incompleteTasks: IncompleteTask[]
  recommendations: TaskRecommendation[]
  summary: {
    readyForCompletion: boolean
    blockers: string[]
    nextPhasePreview?: string
  }
}

interface TransitionResult {
  success: boolean
  completedPhase: {
    id: string
    name: string
    completedAt: string
  }
  activePhase?: {
    id: string
    name: string
  }
  taskActions: {
    completed: number
    carriedOver: number
    cancelled: number
  }
}

/**
 * Hook for managing phase transitions with Scope agent analysis.
 *
 * Provides:
 * - `analysis` - Phase completion analysis with task recommendations
 * - `isLoading` - Loading state for analysis
 * - `isError` - Error state for analysis
 * - `error` - Error object if any
 * - `refetch` - Function to retry analysis
 * - `transitionMutation` - Mutation for executing the phase transition
 *
 * @param phaseId - The phase ID to analyze/transition
 * @param projectId - The project ID (for cache invalidation)
 * @param enabled - Whether to enable the analysis query
 */
export function usePhaseTransition(phaseId: string, projectId: string, enabled: boolean = true) {
  const queryClient = useQueryClient()

  // Fetch phase completion analysis
  const {
    data: analysis,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<PhaseAnalysis>({
    queryKey: ['phase-analysis', phaseId],
    queryFn: async () => {
      const response = await fetch(`/api/pm/phases/${phaseId}/analyze-completion`, {
        method: 'POST',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to analyze phase')
      }
      return response.json()
    },
    enabled,
    retry: 1,
  })

  // Execute transition mutation
  const transitionMutation = useMutation<
    TransitionResult,
    Error,
    { taskActions: TaskAction[]; completionNote?: string }
  >({
    mutationFn: async ({ taskActions, completionNote }) => {
      const response = await fetch(`/api/pm/phases/${phaseId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskActions, completionNote }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Transition failed')
      }

      return response.json()
    },
    onSuccess: async () => {
      toast.success(`Phase "${analysis?.phaseName}" completed!`)
      // Await invalidation to prevent race condition with navigation
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phases', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['phase-analysis', phaseId] }),
      ])
    },
    onError: (err) => {
      toast.error('Failed to complete phase', {
        description: err.message,
      })
    },
  })

  return {
    analysis,
    isLoading,
    isError,
    error,
    refetch,
    transitionMutation,
  }
}
