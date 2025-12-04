/**
 * AI Providers Module
 *
 * NestJS module for AI provider integration.
 * Provides API endpoints and factory for AI provider management.
 *
 * @module ai-providers
 */

import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AIProvidersController } from './ai-providers.controller';
import { AIProvidersService } from './ai-providers.service';
import { AIProviderFactory } from './ai-provider-factory.service';
import { TokenUsageService } from './token-usage.service';
import { TokenResetService } from './token-reset.service';
import { TokenLimitService } from './token-limit.service';
import { ProviderHealthService } from './provider-health.service';
import { AssistantClientFactory } from './assistant-client-factory.service';
import { EventsModule } from '../events/events.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    forwardRef(() => EventsModule),
  ],
  controllers: [AIProvidersController],
  providers: [
    AIProvidersService,
    AIProviderFactory,
    TokenUsageService,
    TokenResetService,
    TokenLimitService,
    ProviderHealthService,
    AssistantClientFactory,
  ],
  exports: [
    AIProvidersService,
    AIProviderFactory,
    TokenUsageService,
    TokenLimitService,
    ProviderHealthService,
    AssistantClientFactory,
  ],
})
export class AIProvidersModule {}
