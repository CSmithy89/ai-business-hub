import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

// eslint-disable-next-line no-unused-vars
export enum Environment {
  // eslint-disable-next-line no-unused-vars
  Development = 'development',
  // eslint-disable-next-line no-unused-vars
  Production = 'production',
  // eslint-disable-next-line no-unused-vars
  Test = 'test',
}

export class EnvironmentVariables {
  @IsOptional()
  @IsNumber()
  PORT?: number = 3001;

  @IsOptional()
  @IsEnum(Environment)
  NODE_ENV?: Environment = Environment.Development;

  @IsString()
  FRONTEND_URL!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((err) => Object.values(err.constraints || {}).join(', ')).join('\n')}`,
    );
  }

  return validatedConfig;
}
