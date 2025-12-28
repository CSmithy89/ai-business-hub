/**
 * PM Agent Module Constants
 *
 * Story: PM-12.1 - Agent UI Components
 *
 * Shared configuration for PM agent styling, icons, and labels.
 * Used by AgentPanel, SuggestionCard, and other agent-related components.
 */

import {
  Compass,
  Calculator,
  Clock,
  Target,
  Heart,
  FileText,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type AgentName = 'navi' | 'sage' | 'chrono' | 'scope' | 'pulse' | 'herald';

export interface AgentConfig {
  name: string;
  role: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  badgeColor: string;
  Icon: LucideIcon;
  greeting: string;
}

export type SuggestionType =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'ASSIGN_TASK'
  | 'MOVE_PHASE'
  | 'SET_PRIORITY'
  | 'ESTIMATE_TASK'
  | 'LOG_TIME'
  | 'FLAG_RISK';

export type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SNOOZED' | 'EXPIRED';

// ============================================================================
// Agent Configuration
// ============================================================================

/**
 * Configuration for each PM agent.
 *
 * Each agent has:
 * - name: Display name
 * - role: Short role description
 * - description: Full description of agent capabilities
 * - color: Primary color (hex)
 * - bgColor: Background color class for cards
 * - borderColor: Border color class
 * - textColor: Text color class
 * - iconColor: Icon color class
 * - badgeColor: Badge background and text classes
 * - Icon: Lucide React icon component
 * - greeting: Initial greeting message
 */
export const AGENT_CONFIG: Record<AgentName, AgentConfig> = {
  navi: {
    name: 'Navi',
    role: 'Orchestration',
    description: 'Coordinates tasks and guides you through project workflows',
    color: '#3B82F6',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-800',
    Icon: Compass,
    greeting: "Hi! I'm Navi, your project orchestrator. I can help coordinate tasks, suggest next steps, and keep your project on track. What would you like to work on?",
  },
  sage: {
    name: 'Sage',
    role: 'Estimation',
    description: 'Provides story point estimates and complexity analysis',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-900',
    iconColor: 'text-purple-600',
    badgeColor: 'bg-purple-100 text-purple-800',
    Icon: Calculator,
    greeting: "Hello! I'm Sage, your estimation expert. I analyze task complexity and provide story point estimates based on similar work. What would you like me to estimate?",
  },
  chrono: {
    name: 'Chrono',
    role: 'Time Tracking',
    description: 'Helps track time and analyze productivity patterns',
    color: '#F97316',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-900',
    iconColor: 'text-orange-600',
    badgeColor: 'bg-orange-100 text-orange-800',
    Icon: Clock,
    greeting: "Hey there! I'm Chrono, your time tracking assistant. I help log time entries and spot productivity patterns. Ready to track some work?",
  },
  scope: {
    name: 'Scope',
    role: 'Phase Management',
    description: 'Manages project phases and milestone tracking',
    color: '#22C55E',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-900',
    iconColor: 'text-green-600',
    badgeColor: 'bg-green-100 text-green-800',
    Icon: Target,
    greeting: "Welcome! I'm Scope, your phase manager. I track milestones, manage phase transitions, and help keep your project on schedule. What phase are you working on?",
  },
  pulse: {
    name: 'Pulse',
    role: 'Health Monitoring',
    description: 'Monitors project health and identifies risks',
    color: '#EF4444',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-900',
    iconColor: 'text-red-600',
    badgeColor: 'bg-red-100 text-red-800',
    Icon: Heart,
    greeting: "Hi! I'm Pulse, your health monitor. I track project vitals, identify risks early, and suggest preventive actions. How can I help you today?",
  },
  herald: {
    name: 'Herald',
    role: 'Reporting',
    description: 'Generates reports and status updates',
    color: '#6366F1',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-900',
    iconColor: 'text-indigo-600',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    Icon: FileText,
    greeting: "Greetings! I'm Herald, your reporting assistant. I generate status updates, summaries, and stakeholder communications. What report do you need?",
  },
} as const;

/**
 * Get agent configuration by name with fallback to Navi.
 */
export function getAgentConfig(agentName: string): AgentConfig {
  return AGENT_CONFIG[agentName as AgentName] || AGENT_CONFIG.navi;
}

// ============================================================================
// Suggestion Configuration
// ============================================================================

/**
 * Human-readable labels for suggestion types.
 */
export const suggestionTypeLabels: Record<SuggestionType, string> = {
  CREATE_TASK: 'Create Task',
  UPDATE_TASK: 'Update Task',
  ASSIGN_TASK: 'Assign Task',
  MOVE_PHASE: 'Move Phase',
  SET_PRIORITY: 'Set Priority',
  ESTIMATE_TASK: 'Estimate Task',
  LOG_TIME: 'Log Time',
  FLAG_RISK: 'Flag Risk',
};

/**
 * Icon mapping for suggestion types.
 * Returns the appropriate icon component for each type.
 */
export function getSuggestionIcon(type: SuggestionType): LucideIcon {
  switch (type) {
    case 'ESTIMATE_TASK':
      return Calculator;
    case 'LOG_TIME':
      return Clock;
    case 'MOVE_PHASE':
      return Target;
    case 'FLAG_RISK':
      return Heart;
    default:
      return Compass;
  }
}

// ============================================================================
// Confidence Colors
// ============================================================================

/**
 * Get confidence color classes based on score.
 *
 * Color mapping:
 * - >= 85%: Green (high confidence, auto-execute)
 * - >= 60%: Yellow (medium confidence, quick approval)
 * - < 60%: Red (low confidence, full review)
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return 'text-green-500';
  if (confidence >= 0.6) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Get confidence badge styling based on score.
 */
export function getConfidenceBadge(confidence: number): { bg: string; text: string } {
  if (confidence >= 0.85) return { bg: 'bg-green-100', text: 'text-green-800' };
  if (confidence >= 0.6) return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
  return { bg: 'bg-red-100', text: 'text-red-800' };
}

/**
 * Get human-readable confidence level label.
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'High';
  if (confidence >= 0.6) return 'Medium';
  return 'Low';
}

// ============================================================================
// Fibonacci Sequence
// ============================================================================

/**
 * Fibonacci sequence for story point estimation.
 * Includes 0, 0.5 for very small tasks, then standard Fibonacci.
 */
export const FIBONACCI_POINTS = [0, 0.5, 1, 2, 3, 5, 8, 13, 21] as const;

export type FibonacciPoint = (typeof FIBONACCI_POINTS)[number];

// ============================================================================
// Time Tracking Constants
// ============================================================================

/**
 * Default snooze durations in hours.
 */
export const SNOOZE_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '4 hours', hours: 4 },
  { label: '1 day', hours: 24 },
  { label: '1 week', hours: 168 },
] as const;

/**
 * Time tracker storage key for localStorage persistence.
 */
export const TIME_TRACKER_STORAGE_KEY = 'hyvve-pm-timer';

/**
 * Suggestion expiry warning threshold in hours.
 * Show warning when less than this many hours remain.
 */
export const EXPIRY_WARNING_HOURS = 1;
