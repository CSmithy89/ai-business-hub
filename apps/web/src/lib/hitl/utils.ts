/**
 * HITL (Human-in-the-Loop) Utility Functions
 *
 * Utility functions for detecting HITL markers in agent responses,
 * parsing HITL results, and formatting display values.
 *
 * @see agents/hitl/decorators.py - Backend is_hitl_pending function
 * @see docs/modules/bm-dm/stories/dm-05-2-frontend-hitl-handlers.md
 * Epic: DM-05 | Story: DM-05.2
 */

import type {
  HITLMarkerResponse,
  HITLActionArgs,
  HITLConfig,
  RiskLevel,
  ApprovalLevel,
} from './types';

// =============================================================================
// HITL MARKER DETECTION
// =============================================================================

/**
 * Check if a result contains an HITL pending marker.
 *
 * Backend HITL tools return this structure for QUICK/FULL approval levels:
 * {
 *   "__hitl_pending__": true,
 *   "hitl_result": { ... HITLToolResult ... }
 * }
 *
 * @param result - Result from a tool invocation
 * @returns True if the result contains a HITL pending marker
 *
 * @example
 * ```typescript
 * const result = { __hitl_pending__: true, hitl_result: {...} };
 * if (isHITLPending(result)) {
 *   // Handle HITL approval flow
 * }
 * ```
 */
export function isHITLPending(result: unknown): result is HITLMarkerResponse {
  return (
    typeof result === 'object' &&
    result !== null &&
    '__hitl_pending__' in result &&
    (result as Record<string, unknown>).__hitl_pending__ === true &&
    'hitl_result' in result &&
    typeof (result as Record<string, unknown>).hitl_result === 'object'
  );
}

/**
 * Extract HITLActionArgs from a marker response.
 *
 * Converts snake_case backend fields to camelCase frontend format.
 *
 * @param result - Result that may contain HITL marker
 * @returns Parsed HITLActionArgs or null if not a valid marker
 *
 * @example
 * ```typescript
 * const args = parseHITLResult(agentResponse);
 * if (args) {
 *   renderApprovalCard(args);
 * }
 * ```
 */
export function parseHITLResult(result: unknown): HITLActionArgs | null {
  if (!isHITLPending(result)) {
    return null;
  }

  const marker = result as HITLMarkerResponse;
  const hitlResult = marker.hitl_result;

  return {
    toolName: hitlResult.tool_name,
    toolArgs: hitlResult.tool_args,
    confidenceScore: hitlResult.confidence_score,
    approvalLevel: hitlResult.approval_level as ApprovalLevel,
    config: {
      autoThreshold: hitlResult.config.auto_threshold,
      quickThreshold: hitlResult.config.quick_threshold,
      approvalType: hitlResult.config.approval_type,
      riskLevel: hitlResult.config.risk_level as RiskLevel,
      requiresReason: hitlResult.config.requires_reason,
      timeoutSeconds: hitlResult.config.timeout_seconds,
      approveLabel: hitlResult.config.approve_label,
      rejectLabel: hitlResult.config.reject_label,
      descriptionTemplate: hitlResult.config.description_template,
    },
    requestId: hitlResult.request_id,
  };
}

// =============================================================================
// CONFIDENCE FORMATTING
// =============================================================================

/**
 * Determine confidence level from score.
 *
 * Uses default thresholds:
 * - High: >= 85%
 * - Medium: >= 60%
 * - Low: < 60%
 *
 * @param score - Confidence score (0-100)
 * @param config - Optional HITLConfig with custom thresholds
 * @returns Confidence level string
 */
export function getConfidenceLevel(
  score: number,
  config?: HITLConfig
): 'high' | 'medium' | 'low' {
  const autoThreshold = config?.autoThreshold ?? 85;
  const quickThreshold = config?.quickThreshold ?? 60;

  if (score >= autoThreshold) {
    return 'high';
  }
  if (score >= quickThreshold) {
    return 'medium';
  }
  return 'low';
}

/**
 * Format confidence score for display.
 *
 * @param score - Confidence score (0-100)
 * @returns Formatted string (e.g., "85%")
 */
export function formatConfidence(score: number): string {
  return `${Math.round(Math.min(100, Math.max(0, score)))}%`;
}

// =============================================================================
// RISK LEVEL FORMATTING
// =============================================================================

/**
 * Map risk level to badge variant for shadcn Badge component.
 *
 * @param level - Risk level
 * @returns Badge variant string
 */
export function getRiskBadgeVariant(
  level: RiskLevel
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (level) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
    default:
      return 'outline';
  }
}

/**
 * Get risk level display color classes.
 *
 * @param level - Risk level
 * @returns Tailwind color classes
 */
export function getRiskColorClasses(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
} {
  switch (level) {
    case 'high':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-500',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-500',
      };
    case 'low':
    default:
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-500',
      };
  }
}

// =============================================================================
// DESCRIPTION FORMATTING
// =============================================================================

/**
 * Format a description template with tool arguments.
 *
 * Replaces {key} placeholders with values from args.
 *
 * @param template - Description template (e.g., "Sign contract {contract_id} for ${amount}")
 * @param args - Tool arguments
 * @returns Formatted description
 *
 * @example
 * ```typescript
 * const desc = formatDescriptionTemplate(
 *   "Sign contract {contract_id} for ${amount}",
 *   { contract_id: "C123", amount: 5000 }
 * );
 * // Returns: "Sign contract C123 for $5000"
 * ```
 */
export function formatDescriptionTemplate(
  template: string,
  args: Record<string, unknown>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = args[key];
    if (value === undefined || value === null) {
      return match;
    }
    return formatValue(value);
  });
}

/**
 * Convert camelCase or snake_case key to Title Case.
 *
 * @param key - Key name
 * @returns Formatted key
 *
 * @example
 * ```typescript
 * formatKey('contractId')  // "Contract Id"
 * formatKey('contract_id') // "Contract Id"
 * formatKey('amount')      // "Amount"
 * ```
 */
export function formatKey(key: string): string {
  return key
    // Insert space before capital letters (camelCase)
    .replace(/([A-Z])/g, ' $1')
    // Replace underscores with spaces (snake_case)
    .replace(/_/g, ' ')
    // Capitalize first letter of each word
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Format a value for display in the approval card.
 *
 * Handles special formatting for:
 * - Currency (amount fields)
 * - Arrays (shows count)
 * - Objects (shows JSON preview)
 * - Booleans
 * - null/undefined
 *
 * @param value - Value to format
 * @param key - Optional key name for context-aware formatting
 * @returns Formatted string
 */
export function formatValue(value: unknown, key?: string): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    // Check if this looks like a currency field
    const isCurrency =
      key?.toLowerCase().includes('amount') ||
      key?.toLowerCase().includes('price') ||
      key?.toLowerCase().includes('cost') ||
      key?.toLowerCase().includes('fee');

    if (isCurrency) {
      return formatCurrency(value);
    }
    return value.toLocaleString();
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'None';
    }
    if (value.length <= 3) {
      return value.map((v) => formatValue(v)).join(', ');
    }
    return `${value.length} items`;
  }

  if (typeof value === 'object') {
    // For objects, show a truncated JSON preview
    const json = JSON.stringify(value);
    if (json.length > 50) {
      return json.substring(0, 47) + '...';
    }
    return json;
  }

  return String(value);
}

/**
 * Format a number as USD currency.
 *
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// =============================================================================
// TOOL NAME FORMATTING
// =============================================================================

/**
 * Format a tool name for display.
 *
 * Converts snake_case to Title Case.
 *
 * @param toolName - Tool name (e.g., "sign_contract")
 * @returns Formatted name (e.g., "Sign Contract")
 */
export function formatToolName(toolName: string): string {
  return toolName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Get an icon name suggestion based on tool/approval type.
 *
 * @param approvalType - Approval type from config
 * @returns Lucide icon name suggestion
 */
export function getToolIcon(approvalType: string): string {
  switch (approvalType.toLowerCase()) {
    case 'contract':
      return 'FileText';
    case 'deletion':
      return 'Trash2';
    case 'financial':
      return 'DollarSign';
    case 'communication':
      return 'Send';
    default:
      return 'AlertCircle';
  }
}

// =============================================================================
// APPROVAL LEVEL HELPERS
// =============================================================================

/**
 * Check if an approval level requires user interaction.
 *
 * @param level - Approval level
 * @returns True if user approval is required
 */
export function requiresUserApproval(level: ApprovalLevel): boolean {
  return level === 'quick' || level === 'full';
}

/**
 * Get approval level description.
 *
 * @param level - Approval level
 * @returns Human-readable description
 */
export function getApprovalLevelDescription(level: ApprovalLevel): string {
  switch (level) {
    case 'auto':
      return 'Auto-approved based on high confidence';
    case 'quick':
      return 'Quick review - inline approval';
    case 'full':
      return 'Full review required';
    default:
      return 'Approval required';
  }
}
