import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import type { ConfidenceFactor, SuggestedAction, ConfidenceBreakdown } from '@hyvve/shared'

/**
 * Confidence Breakdown API Endpoint
 *
 * Returns detailed confidence factor breakdown for an approval item:
 * - Individual confidence factors (Content Quality, Brand Alignment, etc.)
 * - Suggested actions based on low factors
 * - Overall weighted confidence score
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: approvalId } = await context.params

    // TODO(EPIC-14): When Prisma is connected, replace with real database query
    // For now, return calculated mock data based on approval ID

    // In production, this would fetch the approval:
    /*
    const workspaceId = session.user.activeWorkspaceId
    if (!workspaceId) {
      return NextResponse.json({ error: 'No active workspace' }, { status: 400 })
    }

    const approval = await prisma.approvalItem.findUnique({
      where: {
        id: approvalId,
        workspaceId,
      },
    })

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }
    */

    // Generate mock confidence data
    const breakdown = generateMockConfidenceBreakdown(approvalId)

    return NextResponse.json(breakdown, {
      // Prevent caching of per-item confidence data
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('Error fetching confidence breakdown:', error)
    return NextResponse.json(
      { error: 'Failed to fetch confidence breakdown' },
      { status: 500 }
    )
  }
}

/**
 * Generate mock confidence breakdown data
 *
 * Creates realistic confidence factors that:
 * - Vary based on approval ID (for consistency)
 * - Have weighted scores that average to a realistic overall score
 * - Include suggested actions for low-scoring factors
 */
function generateMockConfidenceBreakdown(approvalId: string): ConfidenceBreakdown {
  // Use approval ID to seed deterministic but varied scores
  const seed = approvalId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const random = (min: number, max: number, offset: number = 0) => {
    const val = ((seed + offset) * 9301 + 49297) % 233280
    const rnd = val / 233280
    return Math.floor(min + rnd * (max - min))
  }

  // Generate base overall score (50-95 range for variety)
  const overallScore = random(50, 95, 0)

  // Generate 4 factors with scores that cluster around overall score
  const factors: ConfidenceFactor[] = [
    {
      factor: 'Content Quality',
      score: Math.min(100, Math.max(0, overallScore + random(-15, 15, 1))),
      weight: 0.35,
      explanation: 'Content is well-structured and professional with clear messaging',
    },
    {
      factor: 'Brand Alignment',
      score: Math.min(100, Math.max(0, overallScore + random(-15, 15, 2))),
      weight: 0.25,
      explanation: 'Tone and style align with established brand guidelines',
    },
    {
      factor: 'Recipient Match',
      score: Math.min(100, Math.max(0, overallScore + random(-15, 15, 3))),
      weight: 0.25,
      explanation: 'Target audience is well-defined and appropriate for the content',
    },
    {
      factor: 'Timing Score',
      score: Math.min(100, Math.max(0, overallScore + random(-15, 15, 4))),
      weight: 0.15,
      explanation: 'Scheduled timing is optimal for audience engagement',
    },
  ]

  // Calculate actual weighted score
  const calculatedScore = Math.round(
    factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0)
  )

  // Generate suggested actions for low-scoring factors
  const suggestedActions: SuggestedAction[] = []

  factors.forEach((factor, index) => {
    if (factor.score < 70) {
      if (factor.factor === 'Content Quality') {
        suggestedActions.push({
          id: `action-content-${index}`,
          action: 'Review Content Structure',
          reason: `${factor.factor} scored ${factor.score}%`,
          priority: factor.score < 50 ? 'high' : factor.score < 60 ? 'medium' : 'low',
        })
      } else if (factor.factor === 'Brand Alignment') {
        suggestedActions.push({
          id: `action-brand-${index}`,
          action: 'Review Brand Guidelines',
          reason: `${factor.factor} scored ${factor.score}%`,
          priority: factor.score < 50 ? 'high' : factor.score < 60 ? 'medium' : 'low',
        })
      } else if (factor.factor === 'Recipient Match') {
        suggestedActions.push({
          id: `action-recipient-${index}`,
          action: 'Refine Target Audience',
          reason: `${factor.factor} scored ${factor.score}%`,
          priority: factor.score < 50 ? 'high' : factor.score < 60 ? 'medium' : 'low',
        })
      } else if (factor.factor === 'Timing Score') {
        suggestedActions.push({
          id: `action-timing-${index}`,
          action: 'Schedule for Optimal Time',
          reason: 'Timing could be improved for better engagement',
          priority: factor.score < 50 ? 'high' : 'medium',
        })
      }
    }
  })

  // Add general action for very low confidence
  if (calculatedScore < 60) {
    suggestedActions.push({
      id: 'action-review',
      action: 'Request Human Review',
      reason: 'Overall confidence is below threshold',
      priority: 'high',
    })
  }

  return {
    overallScore: calculatedScore,
    factors,
    suggestedActions,
  }
}
