import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  isLimited: boolean;
}

/**
 * RateLimitInterceptor
 *
 * Adds rate limit headers to API responses:
 * - X-RateLimit-Limit: Maximum requests allowed per hour
 * - X-RateLimit-Remaining: Requests remaining in current window
 * - X-RateLimit-Reset: Unix timestamp when the limit resets
 *
 * Should be applied globally or on API routes.
 * Works in conjunction with RateLimitGuard which sets rateLimitInfo on request.
 *
 * Story: PM-11.5 - API Rate Limiting & Governance
 */
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    // Check if rate limit info is attached (set by RateLimitGuard)
    const rateLimitInfo = (request as any).rateLimitInfo as RateLimitInfo | undefined;

    if (rateLimitInfo) {
      // Add rate limit headers
      response.setHeader('X-RateLimit-Limit', rateLimitInfo.limit.toString());
      response.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
      response.setHeader('X-RateLimit-Reset', rateLimitInfo.reset.toString());

      // Add Retry-After header if rate limited (for 429 responses)
      if (rateLimitInfo.isLimited) {
        const retryAfterSeconds = Math.max(0, rateLimitInfo.reset - Math.floor(Date.now() / 1000));
        response.setHeader('Retry-After', retryAfterSeconds.toString());
      }
    }

    return next.handle().pipe(
      tap(() => {
        // Headers are already set, no additional action needed
      }),
    );
  }
}
