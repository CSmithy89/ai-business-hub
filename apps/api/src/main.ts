 
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AppModule } from './app.module';
import { MetricsService } from './metrics/metrics-service';
import { CsrfGuard } from './common/guards/csrf.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for webhook signature verification
  });
  const csrfHeaderName = (
    process.env.CSRF_HEADER_NAME || 'x-csrf-token'
  ).toLowerCase();

  // CORS configuration - allow requests from Next.js frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', csrfHeaderName],
  });

  // CSRF Protection Guard
  // Placed here to run after middleware but before interceptors
  const configService = app.get(ConfigService);
  app.useGlobalGuards(new CsrfGuard(configService));

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
    .setTitle('HYVVE Core-PM API')
    .setDescription(
      'External API for HYVVE Project Management and Knowledge Base - AI-powered business orchestration platform',
    )
    .setVersion('1.0')
    .addTag('health', 'Health check endpoints')
    .addTag('projects', 'Project management operations')
    .addTag('phases', 'Phase management operations')
    .addTag('tasks', 'Task management operations')
    .addTag('views', 'Saved view operations')
    .addTag('search', 'Search operations')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key for authentication (format: sk_prod_...)',
      },
      'api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'HYVVE API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      filter: true,
      tryItOutEnabled: true,
    },
  });

  // Serve OpenAPI spec as JSON
  app.use('/api/docs/spec.json', (_req: Request, res: Response) => {
    res.json(document);
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
