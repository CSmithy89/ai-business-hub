import { Module } from '@nestjs/common';

/**
 * CommonModule provides shared utilities, guards, interceptors, and filters
 * that are used across the application.
 *
 * Future additions:
 * - Custom decorators (e.g., @CurrentUser, @Workspace)
 * - Global guards (e.g., AuthGuard, RolesGuard)
 * - Global interceptors (e.g., LoggingInterceptor, TransformInterceptor)
 * - Global filters (e.g., HttpExceptionFilter)
 * - Shared services (e.g., UtilsService)
 */
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class CommonModule {}
