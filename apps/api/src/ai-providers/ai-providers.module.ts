/**
 * AI Providers Module
 *
 * NestJS module for AI provider integration.
 * Exports the AIProviderFactory for use in other modules.
 *
 * @module ai-providers
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIProviderFactory } from './ai-provider-factory.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AIProviderFactory],
  exports: [AIProviderFactory],
})
export class AIProvidersModule {}
