import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

 
export enum Environment {
   
  Development = 'development',
   
  Production = 'production',
   
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

  /**
   * Service token for agent-to-API authentication.
   * Required for PM agents (Navi, Sage, Chrono) to call API endpoints.
   * Generate with: openssl rand -hex 32
   */
  @IsOptional()
  @IsString()
  AGENT_SERVICE_TOKEN?: string;
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
