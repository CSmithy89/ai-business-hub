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
import {
  KB_AI_ASK_MAX_TOKENS,
  KB_AI_CONTEXT_CHAR_LIMIT,
  KB_AI_DRAFT_MAX_TOKENS,
  KB_AI_OUTPUT_CHAR_LIMIT,
  KB_AI_PROMPT_CHAR_LIMIT,
  KB_AI_QUESTION_CHAR_LIMIT,
  KB_AI_SUMMARY_CONTENT_CHAR_LIMIT,
  KB_AI_SUMMARY_MAX_KEY_POINTS,
  KB_AI_SUMMARY_MAX_TOKENS,
  KB_TASK_DRAFT_COMMENT_CHAR_LIMIT,
  KB_TASK_DRAFT_COMMENT_LIMIT,
  KB_TASK_DRAFT_CONTEXT_CHAR_LIMIT,
} from '../kb.constants'
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
    const prompt = this.truncateText(dto.prompt.trim(), KB_AI_PROMPT_CHAR_LIMIT)
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

    const context = ragResult.context
      ? this.truncateText(ragResult.context, KB_AI_CONTEXT_CHAR_LIMIT)
      : 'No relevant KB context found.'

    const userMessage = [
      'User request:',
      prompt,
      '',
      'Context:',
      context,
    ].join('\n')

    const completion = await client.chatCompletion({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      maxTokens: KB_AI_DRAFT_MAX_TOKENS,
    })

    const content = this.sanitizeAiText(completion.content)
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
      where: { id: pageId, tenantId, workspaceId, deletedAt: null, isTemplate: false },
      select: { title: true, contentText: true },
    })

    if (!page) {
      throw new NotFoundException(KB_ERROR.PAGE_NOT_FOUND)
    }

    const contentText = page.contentText?.trim()
    if (!contentText) {
      throw new BadRequestException('Page content is empty')
    }

    const truncatedContentText = this.truncateText(
      contentText,
      KB_AI_SUMMARY_CONTENT_CHAR_LIMIT,
    )

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
      truncatedContentText,
    ].join('\n')

    const completion = await client.chatCompletion({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      maxTokens: KB_AI_SUMMARY_MAX_TOKENS,
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
      maxTokens: KB_AI_DRAFT_MAX_TOKENS,
    })

    const content = this.sanitizeAiText(completion.content)
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
    const question = this.truncateText(dto.question.trim(), KB_AI_QUESTION_CHAR_LIMIT)
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
      'If the answer is not in the context, respond with "Not found".',
      'Include citations by referencing the numbered context entries when relevant.',
    ].join('\n')

    const history = Array.isArray(dto.history)
      ? dto.history.map((message) => ({
          role: message.role,
          content: message.content,
        }))
      : []

    const context = ragResult.context
      ? this.truncateText(ragResult.context, KB_AI_CONTEXT_CHAR_LIMIT)
      : 'No relevant KB context found.'

    const userMessage = [
      'Question:',
      question,
      '',
      'Context:',
      context,
    ].join('\n')

    const completion = await client.chatCompletion({
      messages: [
        { role: 'system', content: systemMessage },
        ...history,
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      maxTokens: KB_AI_ASK_MAX_TOKENS,
    })

    const answer = this.sanitizeAiText(completion.content?.trim() || 'Not found') || 'Not found'
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
      const payload = this.extractJsonPayload(trimmed) ?? trimmed
      const parsed = JSON.parse(payload) as { summary?: string; keyPoints?: string[] }
      if (parsed.summary) {
        const summary = this.sanitizeAiText(parsed.summary)
        return {
          summary,
          keyPoints: Array.isArray(parsed.keyPoints)
            ? parsed.keyPoints.map((point) => this.sanitizeAiText(point)).filter(Boolean)
            : [],
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
        summary = this.sanitizeAiText(line.replace(/^summary:/i, '').trim())
        continue
      }

      if (/^[-*]\s+/.test(line)) {
        const point = this.sanitizeAiText(line.replace(/^[-*]\s+/, '').trim())
        if (point) {
          keyPoints.push(point)
        }
        continue
      }

      if (/^\d+\.\s+/.test(line)) {
        const point = this.sanitizeAiText(line.replace(/^\d+\.\s+/, '').trim())
        if (point) {
          keyPoints.push(point)
        }
      }
    }

    if (!summary) {
      summary = this.sanitizeAiText(lines[0] || '')
    }

    return {
      summary,
      keyPoints: keyPoints.slice(0, KB_AI_SUMMARY_MAX_KEY_POINTS),
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
    const limitedComments = normalizedComments
      .slice(0, KB_TASK_DRAFT_COMMENT_LIMIT)
      .map((comment) => `- ${this.truncateText(comment, KB_TASK_DRAFT_COMMENT_CHAR_LIMIT)}`)

    const sections = [
      `Task Title: ${title}`,
      normalizedDescription
        ? `Task Description:\n${normalizedDescription}`
        : 'Task Description: (none)',
      normalizedComments.length > 0
        ? `Task Comments:\n${limitedComments.join('\n')}`
        : 'Task Comments: (none)',
    ]

    return this.truncateText(sections.join('\n\n'), KB_TASK_DRAFT_CONTEXT_CHAR_LIMIT)
  }

  private normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim()
  }

  private truncateText(text: string, limit: number): string {
    if (text.length <= limit) return text
    return `${text.slice(0, Math.max(0, limit - 3))}...`
  }

  private sanitizeAiText(value: string | null | undefined): string {
    if (!value) return ''
    const withoutControls = this.stripControlChars(value)
    const withoutTags = withoutControls.replace(/<[^>]*>/g, '')
    return this.truncateText(withoutTags.trim(), KB_AI_OUTPUT_CHAR_LIMIT)
  }

  private stripControlChars(value: string): string {
    let result = ''
    for (const char of value) {
      const code = char.charCodeAt(0)
      if (code === 9 || code === 10 || code === 13 || code >= 32) {
        result += char
      }
    }
    return result
  }

  private extractJsonPayload(value: string): string | null {
    const firstBrace = value.indexOf('{')
    const lastBrace = value.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null
    }
    return value.slice(firstBrace, lastBrace + 1)
  }
}
