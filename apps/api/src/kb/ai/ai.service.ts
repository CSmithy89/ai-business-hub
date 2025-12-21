import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { AssistantClientFactory } from '../../ai-providers/assistant-client-factory.service'
import { RagService } from '../rag/rag.service'
import { KB_ERROR } from '../kb.errors'
import { KbDraftDto } from './dto/kb-draft.dto'

export type KbDraftCitation = {
  pageId: string
  title: string
  slug: string
  chunkIndex: number
}

export type KbDraftResult = {
  content: string
  citations: KbDraftCitation[]
}

@Injectable()
export class KbAiService {
  private readonly logger = new Logger(KbAiService.name)

  constructor(
    private readonly ragService: RagService,
    private readonly assistantClientFactory: AssistantClientFactory,
  ) {}

  async generateDraft(
    tenantId: string,
    workspaceId: string,
    dto: KbDraftDto,
  ): Promise<KbDraftResult> {
    const prompt = dto.prompt.trim()
    if (!prompt) {
      throw new BadRequestException('Prompt is required')
    }

    const ragResult = await this.ragService.query(tenantId, workspaceId, {
      q: prompt,
      limit: 6,
    })

    let client
    try {
      client = await this.assistantClientFactory.createClient({ workspaceId })
    } catch (error) {
      this.logger.error(`AI provider unavailable for workspace ${workspaceId}: ${error}`)
      throw new ServiceUnavailableException(KB_ERROR.AI_NO_PROVIDER)
    }

    const systemMessage = [
      'You are Scribe, the Knowledge Base assistant for HYVVE AI Business Hub.',
      'Create a KB page draft in Markdown based on the user request and provided context.',
      'Use the context when relevant and avoid inventing facts.',
      'If details are missing, use TODO placeholders rather than guessing.',
      'Return only the draft content in Markdown with clear headings and bullet lists.',
    ].join('\n')

    const userMessage = [
      'User request:',
      prompt,
      '',
      'Context:',
      ragResult.context || 'No relevant KB context found.',
    ].join('\n')

    const completion = await client.chatCompletion({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      maxTokens: 900,
    })

    const content = completion.content?.trim()
    if (!content) {
      throw new ServiceUnavailableException('AI draft generation failed')
    }

    return {
      content,
      citations: ragResult.citations,
    }
  }
}
