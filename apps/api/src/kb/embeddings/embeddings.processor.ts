import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import type { Job } from 'bullmq'
import { KB_EMBEDDINGS_QUEUE, KB_EMBEDDINGS_JOB_NAME } from './embeddings.constants'
import type { GeneratePageEmbeddingsJobData } from './embeddings.types'
import { EmbeddingsService } from './embeddings.service'

@Processor(KB_EMBEDDINGS_QUEUE)
export class EmbeddingsProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbeddingsProcessor.name)

  constructor(private readonly embeddingsService: EmbeddingsService) {
    super()
  }

  async process(job: Job<GeneratePageEmbeddingsJobData>): Promise<void> {
    if (!job.data?.tenantId || !job.data?.workspaceId || !job.data?.pageId) {
      this.logger.warn({
        message: 'Invalid kb embeddings job data, skipping',
        jobId: job.id,
        data: job.data,
      })
      return
    }

    if (job.name !== KB_EMBEDDINGS_JOB_NAME) {
      this.logger.warn({
        message: 'Unexpected kb embeddings job name, skipping',
        jobId: job.id,
        jobName: job.name,
      })
      return
    }

    await this.embeddingsService.generateAndStorePageEmbeddings(job.data)
  }
}

