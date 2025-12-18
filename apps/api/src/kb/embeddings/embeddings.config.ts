import { BadRequestException } from '@nestjs/common'
import { KB_ERROR } from '../kb.errors'

export const KB_EMBEDDINGS_DEFAULT_MODEL = 'text-embedding-3-small'
export const KB_EMBEDDINGS_DEFAULT_DIMS = 1536

const MODEL_DIMS: Record<string, number> = {
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
  'text-embedding-ada-002': 1536,
}

export function getKbEmbeddingsModel(): string {
  return process.env.KB_EMBEDDINGS_MODEL || KB_EMBEDDINGS_DEFAULT_MODEL
}

export function getKbEmbeddingsDims(model: string = getKbEmbeddingsModel()): number {
  const raw = process.env.KB_EMBEDDINGS_DIMS
  if (raw) {
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException(KB_ERROR.EMBEDDINGS_DIMS_INVALID)
    }
    return parsed
  }

  const dimsFromModel = MODEL_DIMS[model]
  return dimsFromModel ?? KB_EMBEDDINGS_DEFAULT_DIMS
}

/**
 * Current schema constraint: page_embeddings.embedding is vector(1536).
 * Until the DB schema changes, only 1536-dim embeddings are supported.
 */
export function assertKbEmbeddingsDimsSupported(dims: number): void {
  if (dims !== KB_EMBEDDINGS_DEFAULT_DIMS) {
    throw new BadRequestException(
      `${KB_ERROR.EMBEDDINGS_DIMS_UNSUPPORTED}:${dims}`,
    )
  }
}
