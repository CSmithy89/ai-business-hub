/**
 * Estimation Display Component
 *
 * Story: PM-12.1 - Agent UI Components
 *
 * Story point estimation UI with Fibonacci selector, confidence meter,
 * and similar tasks comparison. Integrates with Sage agent.
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Check,
  Edit2,
  ChevronDown,
  ChevronUp,
  Loader2,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FIBONACCI_POINTS,
  type FibonacciPoint,
  getConfidenceBadge,
  getConfidenceLabel,
  getAgentConfig,
} from './constants';

// ============================================================================
// Types
// ============================================================================

interface SimilarTask {
  id: string;
  title: string;
  points: FibonacciPoint;
  actualDuration?: number; // in hours
  completed: boolean;
}

interface Estimation {
  storyPoints: FibonacciPoint;
  confidence: number;
  similarTasks: SimilarTask[];
  explanation: string;
  factors?: {
    complexity: 'low' | 'medium' | 'high';
    uncertainty: 'low' | 'medium' | 'high';
    dependencies: number;
    historicalAccuracy?: number;
  };
}

interface EstimationDisplayProps {
  taskId: string;
  taskTitle?: string;
  estimation: Estimation;
  currentEstimate?: FibonacciPoint;
  teamEstimate?: FibonacciPoint;
  onAccept: () => void;
  onAdjust: (points: FibonacciPoint) => void;
  isLoading?: boolean;
  readOnly?: boolean;
  className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

interface FibonacciSelectorProps {
  value: FibonacciPoint;
  onChange: (value: FibonacciPoint) => void;
  suggested?: FibonacciPoint;
  disabled?: boolean;
}

function FibonacciSelector({
  value,
  onChange,
  suggested,
  disabled,
}: FibonacciSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FIBONACCI_POINTS.map((point) => (
        <TooltipProvider key={point}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={value === point ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange(point)}
                disabled={disabled}
                className={cn(
                  'min-w-[2.5rem] relative',
                  suggested === point && value !== point && 'ring-2 ring-purple-400',
                  value === point && 'bg-purple-600 hover:bg-purple-700'
                )}
              >
                {point}
                {suggested === point && value !== point && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {point === 0 && 'No effort needed'}
              {point === 0.5 && 'Trivial task'}
              {point === 1 && 'Very small task'}
              {point === 2 && 'Small task'}
              {point === 3 && 'Small to medium task'}
              {point === 5 && 'Medium task'}
              {point === 8 && 'Large task'}
              {point === 13 && 'Very large task'}
              {point === 21 && 'Epic-sized task'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

interface ConfidenceMeterProps {
  confidence: number;
  showLabel?: boolean;
}

function ConfidenceMeter({ confidence, showLabel = true }: ConfidenceMeterProps) {
  const percent = Math.round(confidence * 100);
  const badge = getConfidenceBadge(confidence);

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Confidence</span>
          <Badge className={cn(badge.bg, badge.text)}>
            {percent}% {getConfidenceLabel(confidence)}
          </Badge>
        </div>
      )}
      <Progress
        value={percent}
        className={cn(
          'h-2',
          confidence >= 0.85 && '[&>div]:bg-green-500',
          confidence >= 0.6 && confidence < 0.85 && '[&>div]:bg-yellow-500',
          confidence < 0.6 && '[&>div]:bg-red-500'
        )}
      />
    </div>
  );
}

interface SimilarTasksListProps {
  tasks: SimilarTask[];
  suggestedPoints: FibonacciPoint;
}

function SimilarTasksList({ tasks, suggestedPoints }: SimilarTasksListProps) {
  const [expanded, setExpanded] = useState(false);
  const displayTasks = expanded ? tasks : tasks.slice(0, 3);

  if (tasks.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No similar tasks found for comparison.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <History className="w-4 h-4" />
        Similar Tasks ({tasks.length})
      </div>
      <div className="space-y-2">
        {displayTasks.map((task) => {
          const pointsDiff = task.points - suggestedPoints;
          return (
            <div
              key={task.id}
              className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate">{task.title}</p>
                {task.actualDuration && (
                  <p className="text-xs text-muted-foreground">
                    Actual: {task.actualDuration}h
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline">{task.points} pts</Badge>
                {pointsDiff !== 0 && (
                  <span
                    className={cn(
                      'text-xs',
                      pointsDiff > 0 ? 'text-red-500' : 'text-green-500'
                    )}
                  >
                    {pointsDiff > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                  </span>
                )}
                {task.completed && (
                  <Check className="w-3 h-3 text-green-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {tasks.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              Show {tasks.length - 3} more
            </>
          )}
        </Button>
      )}
    </div>
  );
}

interface FactorsDisplayProps {
  factors: NonNullable<Estimation['factors']>;
}

function FactorsDisplay({ factors }: FactorsDisplayProps) {
  const getFactorColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="p-2 rounded bg-muted/50">
        <p className="text-xs text-muted-foreground">Complexity</p>
        <Badge className={cn('mt-1', getFactorColor(factors.complexity))}>
          {factors.complexity}
        </Badge>
      </div>
      <div className="p-2 rounded bg-muted/50">
        <p className="text-xs text-muted-foreground">Uncertainty</p>
        <Badge className={cn('mt-1', getFactorColor(factors.uncertainty))}>
          {factors.uncertainty}
        </Badge>
      </div>
      <div className="p-2 rounded bg-muted/50">
        <p className="text-xs text-muted-foreground">Dependencies</p>
        <Badge variant="outline" className="mt-1">
          {factors.dependencies}
        </Badge>
      </div>
      {factors.historicalAccuracy !== undefined && (
        <div className="p-2 rounded bg-muted/50">
          <p className="text-xs text-muted-foreground">Historical Accuracy</p>
          <Badge variant="outline" className="mt-1">
            {Math.round(factors.historicalAccuracy * 100)}%
          </Badge>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Estimation Display Component
// ============================================================================

/**
 * Estimation Display Component
 *
 * Displays AI-generated story point estimations with:
 * - Fibonacci point selector
 * - Confidence meter (color-coded)
 * - Similar tasks comparison
 * - Estimation factors breakdown
 * - Accept or adjust actions
 *
 * @param taskId - Task ID for context
 * @param taskTitle - Optional task title for display
 * @param estimation - The estimation data from Sage agent
 * @param currentEstimate - Current story points (if already estimated)
 * @param teamEstimate - Team's manual estimate for comparison
 * @param onAccept - Callback when accepting the suggestion
 * @param onAdjust - Callback when adjusting the points
 * @param isLoading - Whether an action is in progress
 * @param readOnly - Whether to hide action buttons
 * @param className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <EstimationDisplay
 *   taskId="task_123"
 *   estimation={{
 *     storyPoints: 5,
 *     confidence: 0.85,
 *     similarTasks: [...],
 *     explanation: "Based on similar features..."
 *   }}
 *   onAccept={() => acceptEstimate(5)}
 *   onAdjust={(points) => setEstimate(points)}
 * />
 * ```
 */
export function EstimationDisplay({
  taskTitle,
  estimation,
  teamEstimate,
  onAccept,
  onAdjust,
  isLoading,
  readOnly,
  className,
}: EstimationDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<FibonacciPoint>(
    estimation.storyPoints
  );
  const [expanded, setExpanded] = useState(false);

  const sageConfig = getAgentConfig('sage');

  const handleAccept = () => {
    if (selectedPoints !== estimation.storyPoints) {
      onAdjust(selectedPoints);
    } else {
      onAccept();
    }
    setIsEditing(false);
  };

  const handlePointsChange = (points: FibonacciPoint) => {
    setSelectedPoints(points);
  };

  const pointsDifference = teamEstimate
    ? estimation.storyPoints - teamEstimate
    : null;

  return (
    <Card className={cn(sageConfig.bgColor, sageConfig.borderColor, 'border', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', sageConfig.badgeColor)}>
              <sageConfig.Icon className={cn('w-5 h-5', sageConfig.iconColor)} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Story Point Estimation
                <Badge variant="secondary" className="text-xs font-normal">
                  by {sageConfig.name}
                </Badge>
              </CardTitle>
              {taskTitle && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-xs">
                  {taskTitle}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Estimation Display */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Suggested Points */}
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold tabular-nums text-purple-600">
              {estimation.storyPoints}
            </div>
            <div>
              <p className="text-sm font-medium">Story Points</p>
              <p className="text-xs text-muted-foreground">AI Suggestion</p>
            </div>
          </div>

          {/* Comparison with Team */}
          {teamEstimate !== undefined && (
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-muted/50">
              <span className="text-sm text-muted-foreground">Team:</span>
              <span className="font-bold">{teamEstimate}</span>
              {pointsDifference !== null && pointsDifference !== 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    pointsDifference > 0 && 'text-red-600',
                    pointsDifference < 0 && 'text-green-600'
                  )}
                >
                  {pointsDifference > 0 ? '+' : ''}
                  {pointsDifference}
                </Badge>
              )}
              {pointsDifference === 0 && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <Minus className="w-3 h-3 mr-1" />
                  Match
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Confidence Meter */}
        <ConfidenceMeter confidence={estimation.confidence} />

        {/* Explanation */}
        <p className="text-sm text-muted-foreground">{estimation.explanation}</p>

        {/* Expanded Content */}
        {expanded && (
          <div className="space-y-4 pt-2 border-t">
            {/* Factors */}
            {estimation.factors && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Estimation Factors</p>
                <FactorsDisplay factors={estimation.factors} />
              </div>
            )}

            {/* Similar Tasks */}
            <SimilarTasksList
              tasks={estimation.similarTasks}
              suggestedPoints={estimation.storyPoints}
            />
          </div>
        )}

        {/* Adjustment Selector */}
        {isEditing && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium">Adjust Estimate</p>
            <FibonacciSelector
              value={selectedPoints}
              onChange={handlePointsChange}
              suggested={estimation.storyPoints}
              disabled={isLoading}
            />
          </div>
        )}
      </CardContent>

      {/* Actions */}
      {!readOnly && (
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedPoints(estimation.storyPoints);
                }}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={isLoading}
                className="w-full sm:w-auto gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {selectedPoints === estimation.storyPoints
                  ? 'Accept Suggestion'
                  : `Set to ${selectedPoints} Points`}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="w-full sm:w-auto gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Adjust
              </Button>
              <Button
                size="sm"
                onClick={onAccept}
                disabled={isLoading}
                className="w-full sm:w-auto gap-2 bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Accept {estimation.storyPoints} Points
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Compact estimation badge for inline display
 */
export function EstimationBadge({
  points,
  confidence,
  source = 'ai',
}: {
  points: FibonacciPoint;
  confidence?: number;
  source?: 'ai' | 'team' | 'user';
}) {
  const badge = confidence ? getConfidenceBadge(confidence) : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1',
              source === 'ai' && 'border-purple-300 bg-purple-50',
              source === 'team' && 'border-blue-300 bg-blue-50'
            )}
          >
            {points} pts
            {confidence && (
              <span
                className={cn(
                  'ml-1 text-xs',
                  badge?.text
                )}
              >
                ({Math.round(confidence * 100)}%)
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {source === 'ai' && 'AI Estimation'}
          {source === 'team' && 'Team Estimate'}
          {source === 'user' && 'Your Estimate'}
          {confidence && ` - ${getConfidenceLabel(confidence)} confidence`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
