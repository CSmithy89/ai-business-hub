import { InjectQueue } from '@nestjs/bullmq'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { Queue } from 'bullmq'
import { createId } from '@paralleldrive/cuid2'
import { AIProvidersService } from '../../ai-providers/ai-providers.service'
import { PrismaService } from '../../common/services/prisma.service'
import { KB_EMBEDDINGS_JOB_NAME, KB_EMBEDDINGS_QUEUE } from './embeddings.constants'
import type {
  GeneratePageEmbeddingsJobData,
  OpenAiCompatibleProvider,
} from './embeddings.types'
import {
  chunkTextByWords,
  getOpenAiCompatibleBaseUrl,
  vectorToPgvectorText,
} from './embeddings.utils'

type OpenAiEmbeddingsResponse = {
  data: Array<{ embedding: number[]; index: number }>
}

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name)

  private readonly expectedDims = 1536
  private readonly embeddingModel =
    process.env.KB_EMBEDDINGS_MODEL || 'text-embedding-3-small'

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProviders: AIProvidersService,
    @InjectQueue(KB_EMBEDDINGS_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueuePageEmbeddings(data: GeneratePageEmbeddingsJobData): Promise<void> {
    const enabled = process.env.KB_EMBEDDINGS_ENABLED !== 'false'
    if (!enabled) return

    await this.queue.add(KB_EMBEDDINGS_JOB_NAME, data, {
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
    })
  }

  async generateAndStorePageEmbeddings(data: GeneratePageEmbeddingsJobData): Promise<void> {
    const enabled = process.env.KB_EMBEDDINGS_ENABLED !== 'false'
    if (!enabled) return

    const { tenantId, workspaceId, pageId } = data

    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, tenantId, workspaceId, deletedAt: null },
      select: { id: true, contentText: true },
    })

    if (!page) {
      this.logger.warn({ message: 'Page not found for embeddings job', pageId })
      return
    }

    const chunks = chunkTextByWords(page.contentText, {
      maxWords: 250,
      overlapWords: 30,
      maxChunks: 200,
    })

    if (chunks.length === 0) {
      await this.prisma.pageEmbedding.deleteMany({ where: { pageId } })
      return
    }

    const { providerId, providerType, apiKey } =
      await this.getEmbeddingsProvider(workspaceId)
    if (!apiKey || !providerType) {
      this.logger.warn({
        message: 'No valid embeddings provider configured; skipping embeddings generation',
        workspaceId,
        providerType,
        providerId,
      })
      return
    }

    const baseUrl = getOpenAiCompatibleBaseUrl(providerType)
    const embeddings = await this.embedTextsOpenAiCompatible({
      apiKey,
      baseUrl,
      model: this.embeddingModel,
      texts: chunks,
    })

    if (embeddings.length !== chunks.length) {
      throw new BadRequestException(
        `Embeddings length mismatch: got ${embeddings.length}, expected ${chunks.length}`,
      )
    }

    const createdAt = new Date()

    await this.prisma.$transaction(async (tx) => {
      await tx.pageEmbedding.deleteMany({ where: { pageId } })

      const rows = chunks.map((chunkText, chunkIndex) => ({
        id: createId(),
        pageId,
        chunkIndex,
        chunkText,
        embeddingText: vectorToPgvectorText(embeddings[chunkIndex], this.expectedDims),
      }))

      const batchSize = 25
      for (let start = 0; start < rows.length; start += batchSize) {
        const batch = rows.slice(start, start + batchSize)
        const valuesSql = batch.map((row) => Prisma.sql`(
          ${row.id},
          ${row.pageId},
          ${row.chunkIndex},
          ${row.chunkText},
          ${row.embeddingText}::vector(${this.expectedDims}),
          ${this.embeddingModel},
          ${createdAt}
        )`)

        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "page_embeddings" (
              "id",
              "page_id",
              "chunk_index",
              "chunk_text",
              "embedding",
              "embedding_model",
              "created_at"
            )
            VALUES ${Prisma.join(valuesSql)}
          `,
        )
      }
    })

    this.logger.log({
      message: 'Stored KB page embeddings',
      pageId,
      workspaceId,
      tenantId,
      chunks: chunks.length,
      providerType,
    })
  }

  private async getEmbeddingsProvider(workspaceId: string): Promise<{
    providerId: string | null
    providerType: OpenAiCompatibleProvider | null
    apiKey: string | null
  }> {
    const providers = await this.aiProviders.findAll(workspaceId)
    const provider =
      providers.find((p) => p.isDefault && p.isValid) ||
      providers.find((p) => p.isValid) ||
      null

    if (!provider) return { providerId: null, providerType: null, apiKey: null }

    const providerType = provider.provider as OpenAiCompatibleProvider
    if (!['openai', 'deepseek', 'openrouter'].includes(providerType)) {
      return { providerId: provider.id, providerType: null, apiKey: null }
    }

    const apiKey = await this.aiProviders.getDecryptedApiKey(workspaceId, provider.id)
    return { providerId: provider.id, providerType, apiKey }
  }

  private async embedTextsOpenAiCompatible(args: {
    apiKey: string
    baseUrl: string
    model: string
    texts: string[]
  }): Promise<number[][]> {
    const { apiKey, baseUrl, model, texts } = args

    const results: number[][] = []
    const batchSize = 64

    for (let start = 0; start < texts.length; start += batchSize) {
      const input = texts.slice(start, start + batchSize)

      const response = await fetch(`${baseUrl}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, input }),
      })

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new BadRequestException(
          `Embeddings request failed (${response.status}): ${body}`,
        )
      }

      const json = (await response.json()) as OpenAiEmbeddingsResponse
      const batchEmbeddings = json.data
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding)

      results.push(...batchEmbeddings)
    }

    return results
  }
}

