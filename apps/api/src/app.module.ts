import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { EventsModule } from './events/events.module';
import { AuditModule } from './audit/audit.module';
import { MembersModule } from './members/members.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AgentOSModule } from './agentos/agentos.module';
import { AIProvidersModule } from './ai-providers/ai-providers.module';
import { MetricsModule } from './metrics/metrics.module';
import { RealtimeModule } from './realtime/realtime.module';
import { PmModule } from './pm/pm.module';
import { KbModule } from './kb/kb.module';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['../../.env.local', '../../.env', '.env.local', '.env'],
    }),
    // Scheduler global configuration (must be registered once at root)
    ScheduleModule.forRoot(),
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second (for critical endpoints)
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute (default)
      },
    ]),
    // BullMQ global configuration (Story 04-8)
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: (() => {
            const rawPort = configService.get<string | number | undefined>(
              'REDIS_PORT',
              6379,
            );
            const parsed =
              typeof rawPort === 'number'
                ? rawPort
                : parseInt(String(rawPort ?? ''), 10);
            return Number.isFinite(parsed) ? parsed : 6379;
          })(),
          password: configService.get<string | undefined>('REDIS_PASSWORD'),
        },
      }),
    }),
    CommonModule,
    EventsModule,
    AuditModule,
    MembersModule,
    ApprovalsModule,
    AgentOSModule,
    AIProvidersModule,
    MetricsModule,
    RealtimeModule,
    PmModule,
    KbModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
