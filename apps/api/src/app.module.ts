import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { EventsModule } from './events/events.module';
import { AuditModule } from './audit/audit.module';
import { MembersModule } from './members/members.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AgentOSModule } from './agentos/agentos.module';
import { AIProvidersModule } from './ai-providers/ai-providers.module';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['../../.env.local', '../../.env', '.env.local', '.env'],
    }),
    // BullMQ global configuration (Story 04-8)
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
