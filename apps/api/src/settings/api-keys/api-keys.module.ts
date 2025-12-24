import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { CommonModule } from '@/common/common.module';
import { RateLimitService } from '@/common/services/rate-limit.service';

@Module({
  imports: [
    CommonModule,
    BullModule.registerQueue({ name: 'event-retry' }),
  ],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, RateLimitService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
