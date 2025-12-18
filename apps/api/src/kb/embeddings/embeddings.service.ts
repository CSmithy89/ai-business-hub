import { InjectQueue } from '@nestjs/bullmq'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { Queue } from 'bullmq'
import { createId } from '@paralleldrive/cuid2'
import { AIProvidersService } from '../../ai-providers/ai-providers.service'
import { PrismaService } from '../../common/services/prisma.service'
import { KB_ERROR } from '../kb.errors'
import {
  KB_EMBEDDINGS_DB_BATCH_SIZE_DEFAULT,
  KB_EMBEDDINGS_DB_BATCH_SIZE_MAX,
  KB_EMBEDDINGS_DB_BATCH_MAX_BYTES_DEFAULT,
  KB_EMBEDDINGS_DB_BATCH_MAX_BYTES_MAX,
  KB_EMBEDDINGS_JOB_ATTEMPTS,
  KB_EMBEDDINGS_JOB_BACKOFF_MS,
  KB_EMBEDDINGS_JOB_NAME,
  KB_EMBEDDINGS_JOB_REMOVE_ON_FAIL,
  KB_EMBEDDINGS_JOB_UPDATE_DEBOUNCE_MS,
  KB_EMBEDDINGS_QUEUE,
  KB_EMBEDDINGS_REQUEST_BATCH_SIZE,
  KB_EMBEDDINGS_REQUEST_MIN_INTERVAL_MS_DEFAULT,
  KB_EMBEDDINGS_REQUEST_MIN_INTERVAL_MS_MAX,
} from './embeddings.constants'
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

const SUPPORTED_OAI_PROVIDERS: OpenAiCompatibleProvider[] = ['openai', 'deepseek', 'openrouter']

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name)

  private readonly embeddingDims = getKbEmbeddingsDims()
  private readonly embeddingModel = getKbEmbeddingsModel()
  private readonly requestMinIntervalMs = this.getRequestMinIntervalMs()

  private readonly rateLimitChains = new Map<string, Promise<void>>()
  private readonly lastRequestAt = new Map<string, number>()

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
    const delay = data.reason === 'updated' ? KB_EMBEDDINGS_JOB_UPDATE_DEBOUNCE_MS : 0

    try {
      await this.queue.add(KB_EMBEDDINGS_JOB_NAME, data, {
        jobId,
        delay,
        removeOnComplete: true,
        removeOnFail: KB_EMBEDDINGS_JOB_REMOVE_ON_FAIL,
        attempts: KB_EMBEDDINGS_JOB_ATTEMPTS,
        backoff: { type: 'exponential', delay: KB_EMBEDDINGS_JOB_BACKOFF_MS },
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

    const startedAt = Date.now()
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

    const maxWordsUsed = Number.isFinite(maxWords) ? maxWords : 250
    const overlapWordsUsed = Number.isFinite(overlapWords) ? overlapWords : 30
    const maxChunksUsed = Number.isFinite(maxChunks) ? maxChunks : 200

    const chunkingStartedAt = Date.now()
    const chunks = chunkTextByWords(page.contentText, {
      maxWords: maxWordsUsed,
      overlapWords: overlapWordsUsed,
      maxChunks: maxChunksUsed,
    })
    const chunkingMs = Date.now() - chunkingStartedAt
    const maxChunksHit = chunks.length === maxChunksUsed

    if (chunks.length === 0) {
      await this.prisma.pageEmbedding.deleteMany({ where: { pageId } })
      return
    }

    const embeddingsStartedAt = Date.now()
    const embeddingResult = await this.embedTextsForWorkspace(workspaceId, chunks)
    const embeddingsMs = Date.now() - embeddingsStartedAt
    if (!embeddingResult) {
      return
    }

    const { embeddings, providerType } = embeddingResult

    if (embeddings.length !== chunks.length) {
      throw new BadRequestException(
        `${KB_ERROR.EMBEDDINGS_LENGTH_MISMATCH}:${embeddings.length}:${chunks.length}`,
      )
    }

    const createdAt = new Date()

    const dbStartedAt = Date.now()
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
        ? Math.min(Math.max(rawDbBatchSize, 1), KB_EMBEDDINGS_DB_BATCH_SIZE_MAX)
        : KB_EMBEDDINGS_DB_BATCH_SIZE_DEFAULT

      const rawDbBatchMaxBytes = Number.parseInt(process.env.KB_EMBEDDINGS_DB_BATCH_MAX_BYTES ?? '', 10)
      const maxBatchBytes = Number.isFinite(rawDbBatchMaxBytes)
        ? Math.min(Math.max(rawDbBatchMaxBytes, 50_000), KB_EMBEDDINGS_DB_BATCH_MAX_BYTES_MAX)
        : KB_EMBEDDINGS_DB_BATCH_MAX_BYTES_DEFAULT

      for (let start = 0; start < rows.length; ) {
        let end = start
        let batchBytes = 0
        while (end < rows.length && end - start < batchSize) {
          const row = rows[end]
          const rowBytes = row.chunkText.length + row.embeddingText.length + 64
          if (end > start && batchBytes + rowBytes > maxBatchBytes) break
          batchBytes += rowBytes
          end += 1
        }

        const batch = rows.slice(start, end)
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

        start = end
      }
    })
    const dbMs = Date.now() - dbStartedAt

    this.logger.log({
      message: 'Stored KB page embeddings',
      pageId,
      workspaceId,
      tenantId,
      chunks: chunks.length,
      maxChunksHit,
      chunkingMs,
      embeddingsMs,
      dbMs,
      totalMs: Date.now() - startedAt,
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
    if (!SUPPORTED_OAI_PROVIDERS.includes(providerType)) {
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
    const batchSize = KB_EMBEDDINGS_REQUEST_BATCH_SIZE

    const breakerKey = `${baseUrl}:${model}`
    const breaker = this.breakers.get(breakerKey) ?? { failures: 0, openUntil: 0 }
    if (breaker.openUntil > Date.now()) {
      throw new BadRequestException(KB_ERROR.EMBEDDINGS_TEMPORARILY_UNAVAILABLE)
    }

    for (let start = 0; start < texts.length; start += batchSize) {
      const input = texts.slice(start, start + batchSize)

      await this.rateLimit(breakerKey)
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
            .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
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

        throw new BadRequestException(KB_ERROR.EMBEDDINGS_PROVIDER_REQUEST_FAILED)
      }

      const json = (await response.json()) as Partial<OpenAiEmbeddingsResponse>
      const data = json?.data
      if (!Array.isArray(data)) {
        throw new BadRequestException(KB_ERROR.EMBEDDINGS_PROVIDER_RESPONSE_INVALID)
      }

      const batchResults: Array<number[] | undefined> = new Array(input.length).fill(undefined)

      for (const item of data) {
        const index = (item as { index?: unknown }).index
        const embedding = (item as { embedding?: unknown }).embedding

        if (typeof index !== 'number' || !Number.isInteger(index)) continue
        if (index < 0 || index >= input.length) continue
        if (!Array.isArray(embedding)) continue

        const vector = embedding as number[]
        if (vector.length !== this.embeddingDims) {
          throw new BadRequestException(KB_ERROR.EMBEDDINGS_PROVIDER_DIMENSION_MISMATCH)
        }
        if (vector.some((v) => !Number.isFinite(v))) {
          throw new BadRequestException(KB_ERROR.EMBEDDINGS_PROVIDER_VALUES_INVALID)
        }

        batchResults[index] = vector
      }

      if (batchResults.some((v) => !v)) {
        throw new BadRequestException(KB_ERROR.EMBEDDINGS_PROVIDER_RESPONSE_INCOMPLETE)
      }

      results.push(...(batchResults as number[][]))
    }

    this.breakers.delete(breakerKey)
    return results
  }

  private readonly breakers = new Map<string, { failures: number; openUntil: number }>()

  private getRequestMinIntervalMs(): number {
    const raw = Number.parseInt(process.env.KB_EMBEDDINGS_REQUEST_MIN_INTERVAL_MS ?? '', 10)
    if (!Number.isFinite(raw)) return KB_EMBEDDINGS_REQUEST_MIN_INTERVAL_MS_DEFAULT
    return Math.min(Math.max(raw, 0), KB_EMBEDDINGS_REQUEST_MIN_INTERVAL_MS_MAX)
  }

  private async rateLimit(key: string): Promise<void> {
    const minIntervalMs = this.requestMinIntervalMs
    if (minIntervalMs <= 0) return

    const chain = this.rateLimitChains.get(key) ?? Promise.resolve()
    const next = chain.then(async () => {
      const last = this.lastRequestAt.get(key) ?? 0
      const now = Date.now()
      const waitMs = Math.max(0, last + minIntervalMs - now)
      if (waitMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, waitMs))
      }
      this.lastRequestAt.set(key, Date.now())
    })

    this.rateLimitChains.set(key, next.catch(() => undefined))
    await next
  }
}
