 
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { createHmac, timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { MetricsService } from './metrics/metrics-service';

const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join('='));
    return acc;
  }, {});
};

const normalizeHeaderValue = (
  value: string | string[] | undefined,
): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const constantTimeCompare = (a?: string, b?: string): boolean => {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
};

const isSignedTokenValid = (value: string, secret: string): boolean => {
  const [token, signature] = value.split('.');
  if (!token || !signature) return false;
  const expected = createHmac('sha256', secret).update(token).digest('hex');
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'));
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for webhook signature verification
  });
  const csrfHeaderName = (
    process.env.CSRF_HEADER_NAME || 'x-csrf-token'
  ).toLowerCase();
  const csrfSecret = process.env.CSRF_SECRET || process.env.BETTER_AUTH_SECRET;

  // CORS configuration - allow requests from Next.js frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', csrfHeaderName],
  });

  if (process.env.CSRF_ENABLED === 'true') {
    if (!csrfSecret) {
      throw new Error(
        'CSRF_ENABLED=true requires CSRF_SECRET or BETTER_AUTH_SECRET to be set',
      );
    }
    const csrfSecretValue = csrfSecret;
    const csrfCookieName = process.env.CSRF_COOKIE_NAME || 'hyvve_csrf_token';
    const sessionCookieName =
      process.env.CSRF_SESSION_COOKIE_NAME || 'hyvve.session_token';

    app.use((req: Request, res: Response, next: NextFunction) => {
      if (CSRF_SAFE_METHODS.has(req.method)) {
        return next();
      }

      const cookies = parseCookies(req.headers.cookie);
      if (!cookies[sessionCookieName]) {
        return next();
      }

      const headerToken = normalizeHeaderValue(req.headers[csrfHeaderName]);
      const cookieToken = cookies[csrfCookieName];

      if (!headerToken || !cookieToken) {
        return res.status(403).json({ message: 'CSRF token mismatch' });
      }
      if (!constantTimeCompare(headerToken, cookieToken)) {
        return res.status(403).json({ message: 'CSRF token mismatch' });
      }
      if (!isSignedTokenValid(headerToken, csrfSecretValue)) {
        return res.status(403).json({ message: 'CSRF token invalid' });
      }

      return next();
    });
  }

  // Global validation pipe for request validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger/OpenAPI documentation configuration
  const config = new DocumentBuilder()
    .setTitle('HYVVE Platform API')
    .setDescription(
      'NestJS backend for modular business logic - AI-powered business orchestration platform',
    )
    .setVersion('0.1.0')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'HYVVE API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Start server on configured port
  const port = process.env.PORT || 3001;
  // Bind to 0.0.0.0 by default so the dev server is reachable from Docker/VM/WSL/private-network hosts.
  // Operators can override with BIND_HOST.
  const host = process.env.BIND_HOST || '0.0.0.0';
  await app.listen(port, host);

  const metricsService = app.get(MetricsService);
  const server =
    typeof app.getHttpServer === 'function' ? app.getHttpServer() : undefined;
  if (server && typeof server.on === 'function') {
    metricsService.trackHttpServer(server);
  } else {
    console.warn(
      'Metrics: HTTP server does not expose Node connection events; active connection tracking disabled.',
    );
  }

  const appUrl = await app.getUrl();

  console.log('');
  console.log('🚀 HYVVE NestJS Backend Started Successfully');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Application running on: ${appUrl}`);
  console.log(`📚 Swagger documentation: ${appUrl}/api/docs`);
  console.log(`💚 Health check endpoint: ${appUrl}/health`);
  console.log(`📈 Metrics endpoint: ${appUrl}/metrics`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

bootstrap();
