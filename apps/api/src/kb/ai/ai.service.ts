import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { AssistantClientFactory } from '../../ai-providers/assistant-client-factory.service'
import { PrismaService } from '../../common/services/prisma.service'
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

export type KbSummaryResult = {
  summary: string
  keyPoints: string[]
}

@Injectable()
export class KbAiService {
  private readonly logger = new Logger(KbAiService.name)

  constructor(
    private readonly prisma: PrismaService,
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

  async summarizePage(
    tenantId: string,
    workspaceId: string,
    pageId: string,
  ): Promise<KbSummaryResult> {
    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, tenantId, workspaceId, deletedAt: null },
      select: { title: true, contentText: true },
    })

    if (!page) {
      throw new NotFoundException(KB_ERROR.PAGE_NOT_FOUND)
    }

    const contentText = page.contentText?.trim()
    if (!contentText) {
      throw new BadRequestException('Page content is empty')
    }

    let client
    try {
      client = await this.assistantClientFactory.createClient({ workspaceId })
    } catch (error) {
      this.logger.error(`AI provider unavailable for workspace ${workspaceId}: ${error}`)
      throw new ServiceUnavailableException(KB_ERROR.AI_NO_PROVIDER)
    }

    const systemMessage = [
      'You are Scribe, the Knowledge Base assistant for HYVVE AI Business Hub.',
      'Summarize the provided page content.',
      'Return a JSON object with keys: summary (1-3 sentences) and keyPoints (array of bullet points).',
      'Do not include markdown or code fences.',
    ].join('\n')

    const userMessage = [
      `Page title: ${page.title}`,
      '',
      'Page content:',
      contentText,
    ].join('\n')

    const completion = await client.chatCompletion({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      maxTokens: 600,
    })

    return this.parseSummaryResponse(completion.content || '')
  }

  private parseSummaryResponse(raw: string): KbSummaryResult {
    const trimmed = raw.trim()
    if (!trimmed) {
      return { summary: '', keyPoints: [] }
    }

    try {
      const parsed = JSON.parse(trimmed) as { summary?: string; keyPoints?: string[] }
      if (parsed.summary) {
        return {
          summary: parsed.summary,
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        }
      }
    } catch {
      // Fall back to line parsing.
    }

    const lines = trimmed.split('\n').map((line) => line.trim()).filter(Boolean)
    let summary = ''
    const keyPoints: string[] = []

    for (const line of lines) {
      if (!summary && /^summary:/i.test(line)) {
        summary = line.replace(/^summary:/i, '').trim()
        continue
      }

      if (/^[-*]\s+/.test(line)) {
        keyPoints.push(line.replace(/^[-*]\s+/, '').trim())
        continue
      }

      if (/^\d+\.\s+/.test(line)) {
        keyPoints.push(line.replace(/^\d+\.\s+/, '').trim())
      }
    }

    if (!summary) {
      summary = lines[0] || ''
    }

    return {
      summary,
      keyPoints: keyPoints.slice(0, 6),
    }
  }
}
