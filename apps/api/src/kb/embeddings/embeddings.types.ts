export type GeneratePageEmbeddingsJobData = {
  tenantId: string
  workspaceId: string
  pageId: string
  reason: 'created' | 'updated'
}

export type OpenAiCompatibleProvider = 'openai' | 'deepseek' | 'openrouter'

