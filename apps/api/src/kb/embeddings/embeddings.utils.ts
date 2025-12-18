import { BadRequestException } from '@nestjs/common'
import { KB_ERROR } from '../kb.errors'

export type ChunkOptions = {
  maxWords: number
  overlapWords: number
  maxChunks: number
}

const DEFAULT_CHUNK_OPTIONS: ChunkOptions = {
  maxWords: 250,
  overlapWords: 30,
  maxChunks: 200,
}

export function normalizeToSingleSpace(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

export function chunkTextByWords(
  input: string,
  options: Partial<ChunkOptions> = {},
): string[] {
  const { maxWords, overlapWords, maxChunks } = { ...DEFAULT_CHUNK_OPTIONS, ...options }
  if (maxWords <= 0) return []
  if (overlapWords < 0) return []
  if (overlapWords >= maxWords) return []

  const normalized = normalizeToSingleSpace(input)
  if (!normalized) return []

  const words = normalized.split(' ')
  const chunks: string[] = []

  const step = maxWords - overlapWords
  for (let start = 0; start < words.length; start += step) {
    const slice = words.slice(start, start + maxWords)
    if (slice.length === 0) break
    chunks.push(slice.join(' '))
    if (chunks.length >= maxChunks) break
    if (start + maxWords >= words.length) break
  }

  return chunks
}

export function vectorToPgvectorText(vector: number[], expectedDims: number): string {
  if (vector.length !== expectedDims) {
    throw new BadRequestException(
      `${KB_ERROR.EMBEDDING_DIMENSION_MISMATCH}:${expectedDims}:${vector.length}`,
    )
  }

  const parts = vector.map((value) => {
    if (!Number.isFinite(value)) {
      throw new BadRequestException(KB_ERROR.EMBEDDING_NON_FINITE)
    }
    return Number(value).toFixed(8)
  })

  return `[${parts.join(',')}]`
}

export function getOpenAiCompatibleBaseUrl(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com'
    case 'deepseek':
      return 'https://api.deepseek.com'
    case 'openrouter':
      return 'https://openrouter.ai/api/v1'
    default:
      throw new BadRequestException(`${KB_ERROR.EMBEDDINGS_PROVIDER_UNSUPPORTED}:${provider}`)
  }
}
