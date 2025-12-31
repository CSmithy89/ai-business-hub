/**
 * Widget Data Validation Utility
 *
 * Validates widget data payloads using Zod schemas before rendering.
 * Provides type-safe validation with detailed error information.
 *
 * @see docs/modules/bm-dm/stories/dm-08-1-zod-widget-validation.md
 */

import { z } from 'zod';
import { WIDGET_SCHEMAS } from '@/lib/schemas/widget-schemas';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of widget data validation.
 */
export type WidgetValidationResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/**
 * Validation error details for logging.
 */
export interface ValidationErrorDetails {
  widgetType: string;
  issues: Array<{
    path: string;
    message: string;
    code: string;
  }>;
  receivedData: unknown;
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate widget data against its schema.
 *
 * @param type - The widget type (e.g., 'ProjectStatus', 'Metrics')
 * @param data - The data payload to validate
 * @returns Validation result with typed data or error
 *
 * @example
 * const result = validateWidgetData('ProjectStatus', responseData);
 * if (result.success) {
 *   // result.data is typed as ProjectStatusData
 *   renderWidget(result.data);
 * } else {
 *   // result.error contains Zod validation issues
 *   logValidationError(result.error);
 * }
 */
export function validateWidgetData<T = unknown>(
  type: string,
  data: unknown
): WidgetValidationResult<T> {
  const schema = WIDGET_SCHEMAS[type];

  // If no schema exists for this widget type, allow it through
  // This provides forward compatibility for new widget types
  if (!schema) {
    return { success: true, data: data as T };
  }

  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data as T };
  }

  return { success: false, error: result.error };
}

/**
 * Format validation error for logging.
 *
 * @param type - The widget type that failed validation
 * @param error - The Zod error from validation
 * @param data - The original data that failed validation
 * @returns Formatted error details for logging
 */
export function formatValidationError(
  type: string,
  error: z.ZodError,
  data: unknown
): ValidationErrorDetails {
  return {
    widgetType: type,
    issues: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
    receivedData: data,
  };
}

/**
 * Log a widget validation failure.
 * Uses console.warn in development, structured logging in production.
 *
 * @param type - The widget type that failed validation
 * @param error - The Zod error from validation
 * @param data - The original data that failed validation
 */
export function logValidationFailure(
  type: string,
  error: z.ZodError,
  data: unknown
): void {
  const details = formatValidationError(type, error, data);

  if (process.env.NODE_ENV === 'development') {
    console.warn('[Widget Validation Failed]', {
      type: details.widgetType,
      issues: details.issues,
      data: details.receivedData,
    });
  } else {
    // In production, log structured data for monitoring
    // Avoid logging keys which may contain sensitive identifiers
    console.warn(
      JSON.stringify({
        event: 'widget_validation_failed',
        widgetType: details.widgetType,
        issues: details.issues,
        // Only log shape info, not keys (could leak PII patterns)
        dataShape: data ? typeof data : 'undefined',
        isArray: Array.isArray(data),
      })
    );
  }
}

/**
 * Validate widget data and log failures.
 * Convenience function that combines validation and logging.
 *
 * @param type - The widget type
 * @param data - The data payload to validate
 * @returns Validation result
 */
export function validateAndLogWidgetData<T = unknown>(
  type: string,
  data: unknown
): WidgetValidationResult<T> {
  const result = validateWidgetData<T>(type, data);

  if (!result.success) {
    logValidationFailure(type, result.error, data);
  }

  return result;
}

/**
 * Check if a widget type has a validation schema.
 *
 * @param type - The widget type to check
 * @returns True if the widget type has a schema
 */
export function hasValidationSchema(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(WIDGET_SCHEMAS, type);
}
