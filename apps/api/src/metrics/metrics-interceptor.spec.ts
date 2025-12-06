import { of, throwError } from 'rxjs';
import { HttpException, HttpStatus, type ExecutionContext } from '@nestjs/common';
import { MetricsInterceptor } from './metrics-interceptor';
import type { MetricsService } from './metrics-service';

type MockRequest = {
  method?: string;
  route?: { path?: string };
  baseUrl?: string;
  path?: string;
  url?: string;
};

type MockResponse = {
  statusCode?: number;
};

describe('MetricsInterceptor', () => {
  const createContext = () => {
    const request: MockRequest = {
      method: 'GET',
      route: { path: '/test' },
      baseUrl: '/test',
      path: '/test',
      url: '/test',
    };
    const response: MockResponse = { statusCode: 200 };
    const executionContext = {
      request,
      response,
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };
    return executionContext as unknown as ExecutionContext;
  };

  it('records successful requests', (done) => {
    const service: Partial<MetricsService> = {
      observeHttpRequest: jest.fn(),
    };
    const interceptor = new MetricsInterceptor(service as MetricsService);
    const context = createContext();

    interceptor
      .intercept(context, {
        handle: () => of('ok'),
      })
      .subscribe({
        next: () => {
          expect(service.observeHttpRequest).toHaveBeenCalledWith(
            'GET',
            '/test',
            200,
            expect.any(Number),
          );
          done();
        },
        error: done,
      });
  });

  it('records failed requests and rethrows', (done) => {
    const service: Partial<MetricsService> = {
      observeHttpRequest: jest.fn(),
    };
    const interceptor = new MetricsInterceptor(service as MetricsService);
    const context = createContext();
    const error = new HttpException('boom', HttpStatus.BAD_REQUEST);

    interceptor
      .intercept(context, {
        handle: () => throwError(() => error),
      })
      .subscribe({
        next: () => done('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          expect(service.observeHttpRequest).toHaveBeenCalled();
          done();
        },
      });
  });
});
