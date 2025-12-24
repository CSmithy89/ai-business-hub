import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { CronExpressionParser } from 'cron-parser';

/**
 * Custom validator for cron expressions.
 * Uses cron-parser library for accurate validation.
 *
 * Usage:
 * @Validate(CronExpressionValidator)
 * schedule?: string;
 */
@ValidatorConstraint({ name: 'cronExpression', async: false })
export class CronExpressionValidator implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments): boolean {
    if (!value) {
      return true; // Let @IsOptional handle empty values
    }

    try {
      CronExpressionParser.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'schedule must be a valid cron expression (e.g., "0 9 * * *" for daily at 9am)';
  }
}
