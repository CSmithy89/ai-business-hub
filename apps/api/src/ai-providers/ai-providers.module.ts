/**
 * AI Providers Module
 *
 * NestJS module for AI provider integration.
 * Provides API endpoints and factory for AI provider management.
 *
 * @module ai-providers
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AIProvidersController } from './ai-providers.controller';
import { AIProvidersService } from './ai-providers.service';
import { AIProviderFactory } from './ai-provider-factory.service';
import { TokenUsageService } from './token-usage.service';
import { TokenResetService } from './token-reset.service';

@Global()
@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  controllers: [AIProvidersController],
  providers: [
    AIProvidersService,
    AIProviderFactory,
    TokenUsageService,
    TokenResetService,
  ],
  exports: [AIProvidersService, AIProviderFactory, TokenUsageService],
})
export class AIProvidersModule {}
