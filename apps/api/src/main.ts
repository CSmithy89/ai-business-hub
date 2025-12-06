 
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { MetricsService } from './metrics/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration - allow requests from Next.js frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

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
  await app.listen(port);

  const metricsService = app.get(MetricsService);
  metricsService.trackHttpServer(app.getHttpServer());

  console.log('');
  console.log('🚀 HYVVE NestJS Backend Started Successfully');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Application running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  console.log(`💚 Health check endpoint: http://localhost:${port}/health`);
  console.log(`📈 Metrics endpoint: http://localhost:${port}/metrics`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

bootstrap();
