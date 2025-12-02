import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AgentOSService } from './agentos.service';

/**
 * AgentOSModule - NestJS-AgentOS Bridge
 *
 * Provides HTTP client services for communicating with the Python AgentOS
 * (FastAPI server running at http://localhost:7777 by default).
 *
 * Features:
 * - Agent invocation with parameters
 * - Agent run status retrieval
 * - Streaming agent responses (SSE)
 * - Automatic retry with exponential backoff
 * - Timeout handling
 * - JWT passthrough for authentication
 * - Multi-tenant workspace isolation
 *
 * Configuration:
 * - AGENTOS_URL: Base URL for AgentOS (default: http://localhost:7777)
 * - AGENTOS_TIMEOUT_MS: Request timeout in milliseconds (default: 60000)
 * - AGENTOS_RETRY_ATTEMPTS: Number of retry attempts (default: 3)
 *
 * Story: 04-12
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 60000, // Default timeout, overridden by service config
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [AgentOSService],
  exports: [AgentOSService],
})
export class AgentOSModule {}
