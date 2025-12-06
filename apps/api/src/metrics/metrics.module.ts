import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './metrics.interceptor';
import { EventsModule } from '../events';
import { ApprovalsModule } from '../approvals/approvals.module';
import { AIProvidersModule } from '../ai-providers/ai-providers.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, EventsModule, ApprovalsModule, AIProvidersModule],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
