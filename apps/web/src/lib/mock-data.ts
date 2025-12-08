import type { ConfidenceBreakdown, SuggestedAction } from '@hyvve/shared'
import { IS_MOCK_DATA_ENABLED, IS_PRODUCTION } from './api-config'

export type NotificationType = 'approval' | 'system' | 'mention' | 'update'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

/**
 * Centralized mock notification payloads.
 * Timestamps are deterministic for stable tests.
 */
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'approval',
    title: 'Approval needed',
    message: 'Email campaign "Summer Sale" requires your review',
    timestamp: new Date('2025-06-01T15:00:00Z'),
    read: false,
    actionUrl: '/approvals',
  },
  {
    id: '2',
    type: 'mention',
    title: 'Maya mentioned you',
    message: 'Maya mentioned you in a conversation about the new CRM setup',
    timestamp: new Date('2025-06-01T14:30:00Z'),
    read: false,
  },
  {
    id: '3',
    type: 'system',
    title: 'Token limit reached',
    message: 'Your daily token limit for Claude is at 90%. Consider upgrading your plan.',
    timestamp: new Date('2025-05-31T18:00:00Z'),
    read: false,
    actionUrl: '/settings/usage',
  },
  {
    id: '4',
    type: 'update',
    title: 'Workspace updated',
    message: 'John Smith updated workspace settings',
    timestamp: new Date('2025-05-31T12:00:00Z'),
    read: true,
  },
  {
    id: '5',
    type: 'approval',
    title: 'Content approved',
    message: 'Your blog post "Getting Started with AI" was approved',
    timestamp: new Date('2025-05-30T12:00:00Z'),
    read: true,
  },
  {
    id: '6',
    type: 'system',
    title: 'Backup completed',
    message: 'Your workspace data has been successfully backed up',
    timestamp: new Date('2025-05-28T12:00:00Z'),
    read: true,
  },
]

/**
 * Approval metrics mock payload.
 */
export const MOCK_APPROVAL_METRICS = {
  pendingCount: 12,
  autoApprovedToday: 8,
  avgResponseTime: 2.4, // hours
  approvalRate: 87, // percentage
}

/**
 * Deterministic mock confidence breakdown based on ID.
 */
export function getMockConfidenceBreakdown(approvalId: string): ConfidenceBreakdown {
  const seed = approvalId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const random = (min: number, max: number, offset: number = 0) => {
    const val = ((seed + offset) * 9301 + 49297) % 233280
    const rnd = val / 233280
    return Math.floor(min + rnd * (max - min))
  }

  const baseScore = random(50, 95, 0)

  const clamp = (score: number) => Math.min(100, Math.max(0, score))
  const factors = [
    {
      factor: 'Content Quality',
      score: clamp(baseScore + random(-15, 15, 1)),
      weight: 0.35,
      explanation: 'Content is well-structured and professional with clear messaging',
    },
    {
      factor: 'Brand Alignment',
      score: clamp(baseScore + random(-15, 15, 2)),
      weight: 0.25,
      explanation: 'Tone and style align with established brand guidelines',
    },
    {
      factor: 'Recipient Match',
      score: clamp(baseScore + random(-15, 15, 3)),
      weight: 0.25,
      explanation: 'Target audience is well-defined and appropriate for the content',
    },
    {
      factor: 'Timing Score',
      score: clamp(baseScore + random(-15, 15, 4)),
      weight: 0.15,
      explanation: 'Scheduled timing is optimal for audience engagement',
    },
  ]

  const overallScore = Math.round(
    factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0)
  )

  const suggestedActions: SuggestedAction[] = factors.flatMap((factor, index): SuggestedAction[] => {
    if (factor.score >= 70) {
      return []
    }

    const priority: SuggestedAction['priority'] =
      factor.score < 50 ? 'high' : factor.score < 60 ? 'medium' : 'low'

    if (factor.factor === 'Content Quality') {
      return [
        {
          id: `action-content-${index}`,
          action: 'Review Content Structure',
          reason: `${factor.factor} scored ${factor.score}%`,
          priority,
        },
      ]
    }

    if (factor.factor === 'Brand Alignment') {
      return [
        {
          id: `action-brand-${index}`,
          action: 'Review Brand Guidelines',
          reason: `${factor.factor} scored ${factor.score}%`,
          priority,
        },
      ]
    }

    if (factor.factor === 'Recipient Match') {
      return [
        {
          id: `action-recipient-${index}`,
          action: 'Refine Target Audience',
          reason: `${factor.factor} scored ${factor.score}%`,
          priority,
        },
      ]
    }

    return [
      {
        id: `action-timing-${index}`,
        action: 'Schedule for Optimal Time',
        reason: `${factor.factor} scored ${factor.score}%`,
        priority: factor.score < 50 ? 'high' : 'medium',
      },
    ]
  })

  if (overallScore < 60) {
    suggestedActions.push({
      id: 'action-review',
      action: 'Request Human Review',
      reason: 'Overall confidence is below threshold',
      priority: 'high',
    })
  }

  return {
    overallScore,
    factors,
    suggestedActions,
  }
}

/**
 * Gate mock usage in runtime code paths.
 */
export function ensureMockDataEnabled(feature: string): void {
  if (!IS_MOCK_DATA_ENABLED) {
    const message = `[mock-data] Mock data disabled for ${feature}${IS_PRODUCTION ? ' (production)' : ''}`
    throw new Error(message)
  }
}
