/**
 * Logger Utility
 *
 * Centralized logging that can be disabled in production.
 * Provides structured logging with context and log levels.
 *
 * Epic: 07 - UI Shell
 * Technical Debt: Replace console.log with logger utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  /** Component or module name */
  component?: string;
  /** Additional context data */
  [key: string]: unknown;
}

/**
 * Check if we're in development mode
 */
const isDev = process.env.NODE_ENV === 'development';

/**
 * Format log message with optional context
 */
function formatMessage(
  level: LogLevel,
  message: string,
  context?: LogContext
): string {
  const timestamp = new Date().toISOString();
  const component = context?.component ? `[${context.component}]` : '';
  return `${timestamp} ${level.toUpperCase()} ${component} ${message}`.trim();
}

/**
 * Logger object with level-based methods.
 *
 * In production, debug and info logs are suppressed.
 * Warnings and errors are always logged.
 *
 * @example
 * ```ts
 * import { logger } from '@/lib/logger';
 *
 * // Basic usage
 * logger.debug('Fetching data...');
 * logger.info('User logged in', { component: 'Auth' });
 * logger.warn('Rate limit approaching');
 * logger.error('Failed to save', { component: 'Form', error });
 * ```
 */
export const logger = {
  /**
   * Debug level - Development only
   */
  debug(message: string, context?: LogContext): void {
    if (isDev) {
      console.debug(formatMessage('debug', message, context), context || '');
    }
  },

  /**
   * Info level - Development only
   */
  info(message: string, context?: LogContext): void {
    if (isDev) {
      console.info(formatMessage('info', message, context), context || '');
    }
  },

  /**
   * Warning level - Always logged
   */
  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context), context || '');
  },

  /**
   * Error level - Always logged
   */
  error(message: string, context?: LogContext): void {
    console.error(formatMessage('error', message, context), context || '');
  },

  /**
   * Create a scoped logger for a specific component/module
   */
  scope(component: string) {
    return {
      debug: (message: string, context?: Omit<LogContext, 'component'>) =>
        logger.debug(message, { ...context, component }),
      info: (message: string, context?: Omit<LogContext, 'component'>) =>
        logger.info(message, { ...context, component }),
      warn: (message: string, context?: Omit<LogContext, 'component'>) =>
        logger.warn(message, { ...context, component }),
      error: (message: string, context?: Omit<LogContext, 'component'>) =>
        logger.error(message, { ...context, component }),
    };
  },
};

/**
 * Convenience export for creating scoped loggers
 *
 * @example
 * ```ts
 * const log = createLogger('ChatPanel');
 * log.debug('Sending message...');
 * ```
 */
export function createLogger(component: string) {
  return logger.scope(component);
}
