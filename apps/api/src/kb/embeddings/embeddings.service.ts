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
import {
  assertKbEmbeddingsDimsSupported,
  getKbEmbeddingsDims,
  getKbEmbeddingsModel,
} from './embeddings.config'

type OpenAiEmbeddingsResponse = {
  data: Array<{ embedding: number[]; index: number }>
}

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name)

  private readonly embeddingDims = getKbEmbeddingsDims()
  private readonly embeddingModel = getKbEmbeddingsModel()

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProviders: AIProvidersService,
    @InjectQueue(KB_EMBEDDINGS_QUEUE)
    private readonly queue: Queue,
  ) {}

  getEmbeddingDims(): number {
    return this.embeddingDims
  }

  async enqueuePageEmbeddings(data: GeneratePageEmbeddingsJobData): Promise<void> {
    const enabled = process.env.KB_EMBEDDINGS_ENABLED !== 'false'
    if (!enabled) return

    assertKbEmbeddingsDimsSupported(this.embeddingDims)

    const jobId = `kb-embeddings:${data.tenantId}:${data.workspaceId}:${data.pageId}`
    const delay = data.reason === 'updated' ? 5_000 : 0

    try {
      await this.queue.add(KB_EMBEDDINGS_JOB_NAME, data, {
        jobId,
        delay,
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.toLowerCase().includes('already exists')) throw error

      const existing = await this.queue.getJob(jobId)
      if (!existing) return

      await existing.updateData(data)
      if (delay > 0) {
        await existing.changeDelay(delay)
      }
    }
  }

  async embedTextsForWorkspace(
    workspaceId: string,
    texts: string[],
  ): Promise<{ embeddings: number[][]; providerType: OpenAiCompatibleProvider } | null> {
    const enabled = process.env.KB_EMBEDDINGS_ENABLED !== 'false'
    if (!enabled) return null
    assertKbEmbeddingsDimsSupported(this.embeddingDims)

    const { providerId, providerType, apiKey } =
      await this.getEmbeddingsProvider(workspaceId)
    if (!apiKey || !providerType) {
      this.logger.warn({
        message: 'No valid embeddings provider configured',
        workspaceId,
        providerType,
        providerId,
      })
      return null
    }

    const baseUrl = getOpenAiCompatibleBaseUrl(providerType)
    const embeddings = await this.embedTextsOpenAiCompatible({
      apiKey,
      baseUrl,
      model: this.embeddingModel,
      texts,
    })

    return { embeddings, providerType }
  }

  async generateAndStorePageEmbeddings(data: GeneratePageEmbeddingsJobData): Promise<void> {
    const enabled = process.env.KB_EMBEDDINGS_ENABLED !== 'false'
    if (!enabled) return
    assertKbEmbeddingsDimsSupported(this.embeddingDims)

    const { tenantId, workspaceId, pageId } = data

    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, tenantId, workspaceId, deletedAt: null },
      select: { id: true, contentText: true },
    })

    if (!page) {
      this.logger.warn({ message: 'Page not found for embeddings job', pageId })
      return
    }

    const maxWords = Number.parseInt(process.env.KB_EMBEDDINGS_MAX_WORDS ?? '', 10)
    const overlapWords = Number.parseInt(process.env.KB_EMBEDDINGS_OVERLAP_WORDS ?? '', 10)
    const maxChunks = Number.parseInt(process.env.KB_EMBEDDINGS_MAX_CHUNKS ?? '', 10)

    const chunks = chunkTextByWords(page.contentText, {
      maxWords: Number.isFinite(maxWords) ? maxWords : 250,
      overlapWords: Number.isFinite(overlapWords) ? overlapWords : 30,
      maxChunks: Number.isFinite(maxChunks) ? maxChunks : 200,
    })

    if (chunks.length === 0) {
      await this.prisma.pageEmbedding.deleteMany({ where: { pageId } })
      return
    }

    const embeddingResult = await this.embedTextsForWorkspace(workspaceId, chunks)
    if (!embeddingResult) {
      return
    }

    const { embeddings, providerType } = embeddingResult

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
        embeddingText: vectorToPgvectorText(embeddings[chunkIndex], this.embeddingDims),
      }))

      const rawDbBatchSize = Number.parseInt(process.env.KB_EMBEDDINGS_DB_BATCH_SIZE ?? '', 10)
      const batchSize = Number.isFinite(rawDbBatchSize)
        ? Math.min(Math.max(rawDbBatchSize, 1), 25)
        : 10
      for (let start = 0; start < rows.length; start += batchSize) {
        const batch = rows.slice(start, start + batchSize)
        const valuesSql = batch.map((row) => Prisma.sql`(
          ${row.id},
          ${row.pageId},
          ${row.chunkIndex},
          ${row.chunkText},
          ${row.embeddingText}::vector(${this.embeddingDims}),
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

    const breakerKey = `${baseUrl}:${model}`
    const breaker = this.breakers.get(breakerKey) ?? { failures: 0, openUntil: 0 }
    if (breaker.openUntil > Date.now()) {
      throw new BadRequestException('Embeddings temporarily unavailable. Please retry shortly.')
    }

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
        const status = response.status
        const body = await response.text().catch(() => '')

        // Avoid leaking provider response bodies in production
        if (process.env.NODE_ENV !== 'production') {
          const redacted = body
            .replace(/Bearer\\s+[^\\s\"']+/gi, 'Bearer [REDACTED]')
            .replace(/sk-[A-Za-z0-9_-]{10,}/g, 'sk-[REDACTED]')
            .slice(0, 500)
          this.logger.warn({
            message: 'Embeddings request failed',
            status,
            providerBaseUrl: baseUrl,
            model,
            body: redacted,
          })
        } else {
          this.logger.warn({
            message: 'Embeddings request failed',
            status,
            providerBaseUrl: baseUrl,
            model,
          })
        }

        if (status === 429 || status >= 500) {
          const nextFailures = breaker.failures + 1
          const openForMs = Math.min(60_000, nextFailures * 10_000)
          this.breakers.set(breakerKey, {
            failures: nextFailures,
            openUntil: Date.now() + openForMs,
          })
        }

        throw new BadRequestException('Embeddings provider request failed')
      }

      const json = (await response.json()) as OpenAiEmbeddingsResponse
      const batchEmbeddings = json.data
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding)

      results.push(...batchEmbeddings)
    }

    this.breakers.delete(breakerKey)
    return results
  }

  private readonly breakers = new Map<string, { failures: number; openUntil: number }>()
}
