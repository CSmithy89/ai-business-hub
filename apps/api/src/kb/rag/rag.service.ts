import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/services/prisma.service'
import { EmbeddingsService } from '../embeddings/embeddings.service'
import { vectorToPgvectorText } from '../embeddings/embeddings.utils'
import { KB_ERROR } from '../kb.errors'
import { RagQueryDto } from './dto/rag-query.dto'

export type RagChunk = {
  pageId: string
  chunkIndex: number
  chunkText: string
  title: string
  slug: string
  distance: number
  score: number
}

export type RagQueryResult = {
  chunks: RagChunk[]
  citations: Array<{ pageId: string; title: string; slug: string; chunkIndex: number }>
  context: string
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async query(tenantId: string, workspaceId: string, dto: RagQueryDto): Promise<RagQueryResult> {
    const rawLimit = Number(dto.limit ?? 8)
    const safeLimit = Number.isFinite(rawLimit) ? rawLimit : 8
    const limit = Math.min(Math.max(Math.floor(safeLimit), 1), 20)
    const embedded = await this.embeddingsService.embedTextsForWorkspace(workspaceId, [dto.q])
    if (!embedded) {
      throw new BadRequestException(KB_ERROR.RAG_NO_PROVIDER)
    }

    const dims = this.embeddingsService.getEmbeddingDims()
    const queryVectorText = vectorToPgvectorText(embedded.embeddings[0] ?? [], dims)
    const pageIds = Array.isArray(dto.pageIds) ? dto.pageIds.filter(Boolean) : []
    const pageIdFilter =
      pageIds.length > 0
        ? Prisma.sql`AND pe.page_id IN (${Prisma.join(pageIds)})`
        : Prisma.empty

    const rawChunks = await this.prisma.$queryRaw<
      Array<{
        page_id: string
        chunk_index: number
        chunk_text: string
        title: string
        slug: string
        distance: number
      }>
    >`
      SELECT
        pe.page_id,
        pe.chunk_index,
        pe.chunk_text,
        kp.title,
        kp.slug,
        (pe.embedding <=> ${queryVectorText}::vector(${dims})) AS distance
      FROM page_embeddings pe
      INNER JOIN knowledge_pages kp ON kp.id = pe.page_id
      WHERE
        kp.tenant_id = ${tenantId}
        AND kp.workspace_id = ${workspaceId}
        AND kp.deleted_at IS NULL
        ${pageIdFilter}
      ORDER BY distance ASC
      LIMIT ${limit}
    `

    const chunks: RagChunk[] = rawChunks.map((row) => {
      const distance = Number(row.distance)
      const score = 1 / (1 + distance)
      return {
        pageId: row.page_id,
        chunkIndex: Number(row.chunk_index),
        chunkText: row.chunk_text,
        title: row.title,
        slug: row.slug,
        distance,
        score,
      }
    })

    const citations = chunks.map((c) => ({
      pageId: c.pageId,
      title: c.title,
      slug: c.slug,
      chunkIndex: c.chunkIndex,
    }))

    const context = chunks
      .map((c, i) => {
        const header = `[${i + 1}] ${c.title} (kb/${c.slug})`
        return `${header}\n${c.chunkText}`
      })
      .join('\n\n---\n\n')

    this.logger.log({
      message: 'RAG query complete',
      workspaceId,
      tenantId,
      chunks: chunks.length,
    })

    return { chunks, citations, context }
  }
}
