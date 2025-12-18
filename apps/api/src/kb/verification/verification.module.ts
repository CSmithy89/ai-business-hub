import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { EventsModule } from '../../events'
import { VerificationService } from './verification.service'
import { VerificationController } from './verification.controller'
import { PageOwnerOrAdminGuard } from './guards/page-owner-or-admin.guard'

@Module({
  imports: [CommonModule, EventsModule],
  controllers: [VerificationController],
  providers: [VerificationService, PageOwnerOrAdminGuard],
  exports: [VerificationService],
})
export class VerificationModule {}
