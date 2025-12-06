import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { MetricsService } from './metrics-service';

type RouteAwareRequest = Request & { route?: { path?: string } };

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const start = process.hrtime.bigint();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<RouteAwareRequest>();
    const response = httpContext.getResponse<Response>();

    const record = (statusCode: number) => {
      const diffNs = Number(process.hrtime.bigint() - start);
      const durationSeconds = diffNs / 1_000_000_000;
      const route =
        request.route?.path ||
        request.baseUrl ||
        request.path ||
        request.url ||
        'unknown';

      this.metrics.observeHttpRequest(
        request.method ?? 'UNKNOWN',
        route,
        statusCode,
        durationSeconds,
      );
    };

    return next.handle().pipe(
      tap(() => record(response.statusCode ?? 200)),
      catchError((error) => {
        const status =
          typeof error?.getStatus === 'function'
            ? error.getStatus()
            : error?.statusCode || 500;
        record(status);
        return throwError(() => error);
      }),
    );
  }
}
