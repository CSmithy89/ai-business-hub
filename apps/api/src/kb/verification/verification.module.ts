import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { CommonModule } from '../../common/common.module'
import { EventsModule } from '../../events'
import { VerificationService } from './verification.service'
import { VerificationController } from './verification.controller'
import { StaleController } from './stale.controller'
import { PageOwnerOrAdminGuard } from './guards/page-owner-or-admin.guard'
import { VerificationExpiryJob } from './verification-expiry.job'

@Module({
  imports: [CommonModule, EventsModule, ScheduleModule.forRoot()],
  controllers: [VerificationController, StaleController],
  providers: [
    VerificationService,
    PageOwnerOrAdminGuard,
    VerificationExpiryJob,
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
