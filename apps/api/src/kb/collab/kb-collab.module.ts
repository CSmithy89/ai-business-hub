import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CommonModule } from '../../common/common.module'
import { KbCollabServerService } from './kb-collab.server.service'

@Module({
  imports: [ConfigModule, CommonModule],
  providers: [KbCollabServerService],
  exports: [KbCollabServerService],
})
export class KbCollabModule {}
