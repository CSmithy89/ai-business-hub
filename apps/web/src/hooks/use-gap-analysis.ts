'use client'

import { useQuery } from '@tanstack/react-query'

export type GapAnalysisResponse = {
  generatedAt: string
  taskWindowDays: number
  missingTopics: Array<{
    topic: string
    count: number
    sampleTasks: Array<{ id: string; title: string }>
  }>
  frequentQuestions: Array<{
    question: string
    count: number
    sampleTasks: Array<{ id: string; title: string }>
  }>
  outdatedPages: Array<{
    id: string
    title: string
    slug: string
    updatedAt: string
    viewCount: number
    isVerified: boolean
    verifyExpires?: string | null
    reasons: string[]
  }>
  suggestions: Array<{
    title: string
    reason: string
    source: 'topic' | 'question'
  }>
}

export function useGapAnalysis({ enabled = false } = {}) {
  return useQuery<GapAnalysisResponse>({
    queryKey: ['kb', 'gap-analysis'],
    queryFn: async () => {
      const res = await fetch('/api/kb/analysis/gaps', {
        credentials: 'include',
      })

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Admin access required')
        }
        throw new Error('Failed to run gap analysis')
      }

      return res.json()
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('Admin access')) {
        return false
      }
      return failureCount < 2
    },
  })
}
