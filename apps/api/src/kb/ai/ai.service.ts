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
import { KbAskDto } from './dto/kb-ask.dto'
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

export type KbAskSource = {
  pageId: string
  title: string
  slug: string
}

export type KbAskResult = {
  answer: string
  sources: KbAskSource[]
  confidence: 'low' | 'medium' | 'high'
}

export type KbTaskDraftInput = {
  title: string
  description?: string | null
  comments?: string[]
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

  async generateDraftFromTask(
    _tenantId: string,
    workspaceId: string,
    input: KbTaskDraftInput,
  ): Promise<KbDraftResult> {
    const title = input.title?.trim()
    if (!title) {
      throw new BadRequestException('Task title is required')
    }

    const description = input.description?.trim() ?? ''
    const comments = Array.isArray(input.comments)
      ? input.comments.map((comment) => comment.trim()).filter(Boolean)
      : []

    if (!description && comments.length === 0) {
      throw new BadRequestException('Task content is empty')
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
      'Create a KB page draft from the completed task details.',
      'Use clear headings, concise paragraphs, and bullet lists.',
      'Include sections for Summary, Context, Key Decisions, and Follow-ups.',
      'If details are missing, add TODO placeholders instead of guessing.',
      'Return only the draft content in Markdown.',
    ].join('\n')

    const userMessage = this.buildTaskContext(title, description, comments)

    const completion = await client.chatCompletion({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      maxTokens: 900,
    })

    const content = completion.content?.trim()
    if (!content) {
      throw new ServiceUnavailableException('AI draft generation failed')
    }

    return {
      content,
      citations: [],
    }
  }

  async askQuestion(
    tenantId: string,
    workspaceId: string,
    dto: KbAskDto,
  ): Promise<KbAskResult> {
    const question = dto.question.trim()
    if (!question) {
      throw new BadRequestException('Question is required')
    }

    const ragResult = await this.ragService.query(tenantId, workspaceId, {
      q: question,
      limit: 6,
    })

    const sources = this.uniqueSources(ragResult.citations)
    if (sources.length === 0) {
      return {
        answer: 'Not found',
        sources: [],
        confidence: 'low',
      }
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
      'Answer the user question using only the provided context.',
      'If the answer is not in the context, respond with \"Not found\".',
      'Include citations by referencing the numbered context entries when relevant.',
    ].join('\n')

    const history = Array.isArray(dto.history)
      ? dto.history.map((message) => ({
          role: message.role,
          content: message.content,
        }))
      : []

    const userMessage = [
      'Question:',
      question,
      '',
      'Context:',
      ragResult.context || 'No relevant KB context found.',
    ].join('\n')

    const completion = await client.chatCompletion({
      messages: [
        { role: 'system', content: systemMessage },
        ...history,
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      maxTokens: 700,
    })

    const answer = completion.content?.trim() || 'Not found'
    const confidence = sources.length >= 3 ? 'high' : 'medium'

    return {
      answer,
      sources,
      confidence,
    }
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

  private uniqueSources(citations: KbDraftCitation[]): KbAskSource[] {
    const map = new Map<string, KbAskSource>()
    for (const citation of citations) {
      if (!map.has(citation.pageId)) {
        map.set(citation.pageId, {
          pageId: citation.pageId,
          title: citation.title,
          slug: citation.slug,
        })
      }
    }
    return Array.from(map.values())
  }

  private buildTaskContext(title: string, description: string, comments: string[]): string {
    const normalizedDescription = this.normalizeText(description)
    const normalizedComments = comments.map((comment) => this.normalizeText(comment)).filter(Boolean)
    const limitedComments = normalizedComments.slice(0, 8).map((comment) => `- ${this.truncateText(comment, 400)}`)

    const sections = [
      `Task Title: ${title}`,
      normalizedDescription
        ? `Task Description:\n${normalizedDescription}`
        : 'Task Description: (none)',
      normalizedComments.length > 0
        ? `Task Comments:\n${limitedComments.join('\n')}`
        : 'Task Comments: (none)',
    ]

    return this.truncateText(sections.join('\n\n'), 6000)
  }

  private normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim()
  }

  private truncateText(text: string, limit: number): string {
    if (text.length <= limit) return text
    return `${text.slice(0, Math.max(0, limit - 3))}...`
  }
}
