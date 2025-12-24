import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { RateLimitService } from '../services/rate-limit.service';
import { PrismaService } from '../services/prisma.service';

/**
 * RateLimitGuard
 *
 * Enforces rate limits on API requests based on API key configuration.
 * Should be applied after ApiKeyGuard to ensure request.apiKey is available.
 *
 * Returns 429 Too Many Requests when rate limit is exceeded.
 * Adds rate limit info to request for use by RateLimitInterceptor.
 *
 * Story: PM-11.5 - API Rate Limiting & Governance
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Check if API key is attached (should be set by ApiKeyGuard)
    const apiKeyId = (request as any).apiKeyId;
    if (!apiKeyId) {
      // No API key means this is not an API request, skip rate limiting
      return true;
    }

    // Get API key configuration
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      select: { id: true, rateLimit: true },
    });

    if (!apiKey) {
      // API key not found, but ApiKeyGuard should have caught this
      return true;
    }

    // Check rate limit
    const rateLimitInfo = await this.rateLimitService.checkRateLimit(
      apiKey.id,
      apiKey.rateLimit,
    );

    // Attach rate limit info to request for use by interceptor
    (request as any).rateLimitInfo = rateLimitInfo;

    // If rate limited, throw 429 error
    if (rateLimitInfo.isLimited) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          error: 'Too Many Requests',
          retryAfter: rateLimitInfo.reset,
        },
        HttpStatus.TOO_MANY_REQUESTS,
        {
          cause: {
            limit: rateLimitInfo.limit,
            reset: rateLimitInfo.reset,
          },
        },
      );
    }

    return true;
  }
}
