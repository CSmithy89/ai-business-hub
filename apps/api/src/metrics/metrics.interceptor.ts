import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, catchError, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const now = process.hrtime.bigint();
    const request = context
      .switchToHttp()
      .getRequest<Request & { route?: { path?: string } }>();
    const response = context
      .switchToHttp()
      .getResponse<Response & { statusCode: number }>();

    const record = (statusCode: number) => {
      const durationNs = Number(process.hrtime.bigint() - now);
      const durationSeconds = durationNs / 1_000_000_000;
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
      tap(() => record(response.statusCode)),
      catchError((error) => {
        const status =
          typeof error?.getStatus === 'function'
            ? error.getStatus()
            : error?.statusCode || 500;
        record(status);
        throw error;
      }),
    );
  }
}
