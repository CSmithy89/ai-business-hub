 
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
      `External REST API for HYVVE Project Management and Knowledge Base

AI-powered business orchestration platform with human oversight.

## Authentication
All endpoints require an API key in the X-API-Key header.
Generate API keys in the HYVVE dashboard at Settings > API Keys.

## Scopes
- **PM_READ**: Read access to projects, tasks, phases, and views
- **PM_WRITE**: Create and update projects, tasks, and phases
- **PM_ADMIN**: Full access including deletion
- **WEBHOOK_READ**: View webhook configurations
- **WEBHOOK_WRITE**: Create and manage webhooks

## Rate Limits
Standard: 1000 requests/hour
Enterprise: Custom limits available

## Pagination
List endpoints support pagination via \`limit\` and \`offset\` query parameters.
- Default limit: 50
- Maximum limit: 100

## Error Responses
All errors follow the format:
\`\`\`json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
\`\`\``,
    )
    .setVersion('1.0')
    .setContact('HYVVE Support', 'https://hyvve.ai', 'support@hyvve.ai')
    .setLicense('Proprietary', 'https://hyvve.ai/terms')
    .addTag('health', 'Health check and system status endpoints')
    .addTag('projects', 'Project management - Create, read, update, and delete projects')
    .addTag('phases', 'Phase management - Organize projects into phases/sprints')
    .addTag('tasks', 'Task management - Full CRUD operations and task lifecycle')
    .addTag('views', 'Saved views - Custom filtered views of tasks and projects')
    .addTag('search', 'Full-text search across tasks and project data')
    .addTag('webhooks', 'Webhook management - Event notifications to external systems')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key for authentication (format: sk_prod_... or sk_test_...)',
      },
      'api-key',
    )
    .addServer('http://localhost:3001', 'Local Development')
    .addServer('https://api.hyvve.ai', 'Production')
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
