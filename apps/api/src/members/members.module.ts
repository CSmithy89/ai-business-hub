import { Module } from '@nestjs/common'
import { MembersController } from './members.controller'
import { MembersService } from './members.service'
import { AuditModule } from '../audit/audit.module'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [AuditModule, CommonModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
