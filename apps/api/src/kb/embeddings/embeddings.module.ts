import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { CommonModule } from '../../common/common.module'
import { EmbeddingsProcessor } from './embeddings.processor'
import { EmbeddingsService } from './embeddings.service'
import { KB_EMBEDDINGS_QUEUE } from './embeddings.constants'

@Module({
  imports: [
    CommonModule,
    BullModule.registerQueue({
      name: KB_EMBEDDINGS_QUEUE,
    }),
  ],
  providers: [EmbeddingsService, EmbeddingsProcessor],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}

