import {
  chunkTextByWords,
  getOpenAiCompatibleBaseUrl,
  normalizeToSingleSpace,
  vectorToPgvectorText,
} from './embeddings.utils'

describe('kb embeddings utils', () => {
  describe('normalizeToSingleSpace', () => {
    it('collapses whitespace', () => {
      expect(normalizeToSingleSpace(' a \n  b\tc  ')).toBe('a b c')
    })
  })

  describe('chunkTextByWords', () => {
    it('returns empty array for empty input', () => {
      expect(chunkTextByWords('')).toEqual([])
      expect(chunkTextByWords('   ')).toEqual([])
    })

    it('returns empty array for invalid overlap', () => {
      expect(chunkTextByWords('a b c', { maxWords: 2, overlapWords: 2 })).toEqual([])
      expect(chunkTextByWords('a b c', { maxWords: 2, overlapWords: 3 })).toEqual([])
    })

    it('chunks with overlap', () => {
      const text = 'a b c d e f g h i j'
      const chunks = chunkTextByWords(text, { maxWords: 4, overlapWords: 1 })
      expect(chunks).toEqual(['a b c d', 'd e f g', 'g h i j'])
    })

    it('respects maxChunks', () => {
      const text = Array.from({ length: 100 }, (_, i) => `w${i}`).join(' ')
      const chunks = chunkTextByWords(text, { maxWords: 2, overlapWords: 0, maxChunks: 3 })
      expect(chunks.length).toBe(3)
    })
  })

  describe('vectorToPgvectorText', () => {
    it('throws on dimension mismatch', () => {
      expect(() => vectorToPgvectorText([0, 1], 3)).toThrow('dimension mismatch')
    })

    it('throws on non-finite values', () => {
      expect(() => vectorToPgvectorText([Number.NaN], 1)).toThrow('non-finite')
      expect(() => vectorToPgvectorText([Number.POSITIVE_INFINITY], 1)).toThrow('non-finite')
    })

    it('serializes vector into pgvector text format', () => {
      expect(vectorToPgvectorText([0.1, -2], 2)).toBe('[0.10000000,-2.00000000]')
    })
  })

  describe('getOpenAiCompatibleBaseUrl', () => {
    it('maps supported providers', () => {
      expect(getOpenAiCompatibleBaseUrl('openai')).toBe('https://api.openai.com')
      expect(getOpenAiCompatibleBaseUrl('deepseek')).toBe('https://api.deepseek.com')
      expect(getOpenAiCompatibleBaseUrl('openrouter')).toBe('https://openrouter.ai/api/v1')
    })

    it('throws for unsupported provider', () => {
      expect(() => getOpenAiCompatibleBaseUrl('claude')).toThrow('does not support embeddings')
    })
  })
})

