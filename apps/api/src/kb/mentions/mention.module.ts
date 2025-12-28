import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { MentionService } from './mention.service'

@Module({
  imports: [CommonModule],
  providers: [MentionService],
  exports: [MentionService],
})
export class MentionModule {}
