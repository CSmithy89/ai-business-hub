/**
 * Business Model Canvas Preview Component
 *
 * Visual preview of the Business Model Canvas showing all 9 blocks.
 * Displays completion status and allows viewing/editing blocks.
 *
 * Story: 08.14 - Implement Business Model Canvas Workflow
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  Sparkles,
  MessageSquare,
  DollarSign,
  Building2,
  Cog,
  Users2,
  Wallet,
  Share2,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface CanvasBlock {
  items: string[]
  notes: string
  confidence: 'high' | 'medium' | 'low'
  sources: string[]
}

interface BusinessModelCanvas {
  customer_segments?: CanvasBlock
  value_propositions?: CanvasBlock
  channels?: CanvasBlock
  customer_relationships?: CanvasBlock
  revenue_streams?: CanvasBlock
  key_resources?: CanvasBlock
  key_activities?: CanvasBlock
  key_partnerships?: CanvasBlock
  cost_structure?: CanvasBlock
  metadata?: {
    version: string
    createdAt: string
    updatedAt: string
    completionPercentage: number
  }
}

interface BusinessModelCanvasPreviewProps {
  canvas: BusinessModelCanvas | null
  compact?: boolean
  onBlockClick?: (block: string) => void
}

// ============================================================================
// Block Configuration
// ============================================================================

const BLOCK_CONFIG = {
  key_partnerships: {
    title: 'Key Partnerships',
    icon: Users2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  key_activities: {
    title: 'Key Activities',
    icon: Cog,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
  key_resources: {
    title: 'Key Resources',
    icon: Building2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
  },
  value_propositions: {
    title: 'Value Propositions',
    icon: Sparkles,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
  },
  customer_relationships: {
    title: 'Customer Relationships',
    icon: MessageSquare,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 dark:bg-pink-950',
  },
  channels: {
    title: 'Channels',
    icon: Share2,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
  },
  customer_segments: {
    title: 'Customer Segments',
    icon: Users,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
  },
  cost_structure: {
    title: 'Cost Structure',
    icon: Wallet,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
  revenue_streams: {
    title: 'Revenue Streams',
    icon: DollarSign,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
  },
}

// ============================================================================
// Components
// ============================================================================

function CanvasBlockCard({
  blockKey,
  block,
  compact,
  onClick,
}: {
  blockKey: string
  block: CanvasBlock | undefined
  compact?: boolean
  onClick?: () => void
}) {
  const config = BLOCK_CONFIG[blockKey as keyof typeof BLOCK_CONFIG]
  if (!config) return null

  const Icon = config.icon
  const hasItems = block && block.items.length > 0

  return (
    <div
      className={`rounded-lg border p-2 transition-colors cursor-pointer hover:border-primary ${config.bgColor}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className="text-xs font-medium truncate">{config.title}</span>
      </div>
      {hasItems ? (
        <div className="space-y-0.5">
          {block.items.slice(0, compact ? 2 : 3).map((item, idx) => (
            <p key={idx} className="text-[10px] text-muted-foreground truncate">
              • {item}
            </p>
          ))}
          {block.items.length > (compact ? 2 : 3) && (
            <p className="text-[10px] text-muted-foreground">
              +{block.items.length - (compact ? 2 : 3)} more
            </p>
          )}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground italic">Not started</p>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function BusinessModelCanvasPreview({
  canvas,
  compact = false,
  onBlockClick,
}: BusinessModelCanvasPreviewProps) {
  const completionPercentage = canvas?.metadata?.completionPercentage || 0
  const completedBlocks = canvas
    ? Object.keys(BLOCK_CONFIG).filter(
        (key) => canvas[key as keyof BusinessModelCanvas] &&
                 (canvas[key as keyof BusinessModelCanvas] as CanvasBlock)?.items?.length > 0
      ).length
    : 0

  if (compact) {
    // Compact view for sidebar
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Business Model Canvas</span>
          <Badge variant={completedBlocks === 9 ? 'default' : 'secondary'} className="text-xs">
            {completedBlocks}/9
          </Badge>
        </div>
        <Progress value={completionPercentage} className="h-1.5" />
        {canvas && (
          <div className="grid grid-cols-3 gap-1">
            {Object.keys(BLOCK_CONFIG).map((blockKey) => {
              const block = canvas[blockKey as keyof BusinessModelCanvas] as CanvasBlock | undefined
              const config = BLOCK_CONFIG[blockKey as keyof typeof BLOCK_CONFIG]
              const Icon = config.icon
              const hasItems = block && block.items.length > 0

              return (
                <div
                  key={blockKey}
                  className={`p-1.5 rounded text-center cursor-pointer hover:opacity-80 ${
                    hasItems ? config.bgColor : 'bg-muted'
                  }`}
                  onClick={() => onBlockClick?.(blockKey)}
                  title={config.title}
                >
                  <Icon className={`w-3 h-3 mx-auto ${hasItems ? config.color : 'text-muted-foreground'}`} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Full view
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Business Model Canvas</CardTitle>
          <Badge variant={completedBlocks === 9 ? 'default' : 'secondary'}>{completedBlocks}/9 blocks</Badge>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </CardHeader>
      <CardContent>
        {/* BMC Grid Layout - follows standard canvas layout */}
        <div className="grid grid-cols-5 gap-2 text-xs">
          {/* Row 1: Key Partners | Key Activities | Value Prop | Customer Rel | Customer Seg */}
          <CanvasBlockCard
            blockKey="key_partnerships"
            block={canvas?.key_partnerships}
            compact
            onClick={() => onBlockClick?.('key_partnerships')}
          />
          <div className="space-y-2">
            <CanvasBlockCard
              blockKey="key_activities"
              block={canvas?.key_activities}
              compact
              onClick={() => onBlockClick?.('key_activities')}
            />
            <CanvasBlockCard
              blockKey="key_resources"
              block={canvas?.key_resources}
              compact
              onClick={() => onBlockClick?.('key_resources')}
            />
          </div>
          <CanvasBlockCard
            blockKey="value_propositions"
            block={canvas?.value_propositions}
            compact
            onClick={() => onBlockClick?.('value_propositions')}
          />
          <div className="space-y-2">
            <CanvasBlockCard
              blockKey="customer_relationships"
              block={canvas?.customer_relationships}
              compact
              onClick={() => onBlockClick?.('customer_relationships')}
            />
            <CanvasBlockCard
              blockKey="channels"
              block={canvas?.channels}
              compact
              onClick={() => onBlockClick?.('channels')}
            />
          </div>
          <CanvasBlockCard
            blockKey="customer_segments"
            block={canvas?.customer_segments}
            compact
            onClick={() => onBlockClick?.('customer_segments')}
          />

          {/* Row 2: Cost Structure | Revenue Streams */}
          <div className="col-span-2">
            <CanvasBlockCard
              blockKey="cost_structure"
              block={canvas?.cost_structure}
              compact
              onClick={() => onBlockClick?.('cost_structure')}
            />
          </div>
          <div className="col-span-3">
            <CanvasBlockCard
              blockKey="revenue_streams"
              block={canvas?.revenue_streams}
              compact
              onClick={() => onBlockClick?.('revenue_streams')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BusinessModelCanvasPreview
