import { Module } from '@nestjs/common'
import { KbCollabServerService } from './kb-collab.server.service'

@Module({
  providers: [KbCollabServerService],
  exports: [KbCollabServerService],
})
export class KbCollabModule {}

