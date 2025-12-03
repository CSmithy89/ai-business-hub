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
import { AIProvidersController } from './ai-providers.controller';
import { AIProvidersService } from './ai-providers.service';
import { AIProviderFactory } from './ai-provider-factory.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [AIProvidersController],
  providers: [AIProvidersService, AIProviderFactory],
  exports: [AIProvidersService, AIProviderFactory],
})
export class AIProvidersModule {}
