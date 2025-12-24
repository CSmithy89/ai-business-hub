import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { CronExpressionParser } from 'cron-parser';

/**
 * Minimum allowed interval between cron executions (in minutes).
 * This prevents abuse by running workflows too frequently.
 */
const MIN_INTERVAL_MINUTES = 5;

/**
 * Custom validator for cron expressions.
 * Uses cron-parser library for accurate validation.
 * Enforces a minimum 5-minute interval between executions.
 *
 * Usage:
 * @Validate(CronExpressionValidator)
 * schedule?: string;
 */
@ValidatorConstraint({ name: 'cronExpression', async: false })
export class CronExpressionValidator implements ValidatorConstraintInterface {
  private errorMessage = '';

  validate(value: string, _args: ValidationArguments): boolean {
    if (!value) {
      return true; // Let @IsOptional handle empty values
    }

    try {
      const interval = CronExpressionParser.parse(value);

      // Check minimum frequency by getting next two occurrences
      const firstOccurrence = interval.next().toDate();
      const secondOccurrence = interval.next().toDate();

      const diffMinutes =
        (secondOccurrence.getTime() - firstOccurrence.getTime()) / (1000 * 60);

      if (diffMinutes < MIN_INTERVAL_MINUTES) {
        this.errorMessage = `schedule must have at least ${MIN_INTERVAL_MINUTES} minutes between executions (current: ${Math.round(diffMinutes)} minutes)`;
        return false;
      }

      return true;
    } catch {
      this.errorMessage =
        'schedule must be a valid cron expression (e.g., "0 9 * * *" for daily at 9am)';
      return false;
    }
  }

  defaultMessage(_args: ValidationArguments): string {
    return this.errorMessage || 'schedule must be a valid cron expression';
  }
}
