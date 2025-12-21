import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'
import { VerificationService } from '../verification/verification.service'
import { GapAnalysisQueryDto } from './dto/gap-analysis.query.dto'

type GapTopic = {
  topic: string
  count: number
  sampleTasks: Array<{ id: string; title: string }>
}

type GapQuestion = {
  question: string
  count: number
  sampleTasks: Array<{ id: string; title: string }>
}

type GapSuggestion = {
  title: string
  reason: string
  source: 'topic' | 'question'
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'into',
  'about',
  'over',
  'under',
  'within',
  'then',
  'than',
  'task',
  'tasks',
  'project',
  'page',
  'kb',
  'knowledge',
  'base',
  'create',
  'draft',
  'update',
  'fix',
  'add',
  'new',
  'remove',
  'setup',
])

const QUESTION_PREFIXES = [
  'how',
  'what',
  'why',
  'when',
  'where',
  'who',
  'can',
  'should',
  'is',
  'are',
  'does',
  'do',
  'did',
]

@Injectable()
export class GapAnalysisService {
  private readonly logger = new Logger(GapAnalysisService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: VerificationService,
  ) {}

  async getGapAnalysis(workspaceId: string, query: GapAnalysisQueryDto) {
    const limit = query.limit ?? 10
    const taskWindowDays = query.taskWindowDays ?? 90
    const minFrequency = query.minFrequency ?? 1
    const questionMinFrequency = Math.max(2, minFrequency)

    const windowStart = new Date()
    windowStart.setDate(windowStart.getDate() - taskWindowDays)

    const [tasks, pages, stalePages] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          updatedAt: { gte: windowStart },
        },
        select: { id: true, title: true, description: true },
        orderBy: { updatedAt: 'desc' },
        take: 500,
      }),
      this.prisma.knowledgePage.findMany({
        where: { workspaceId, deletedAt: null, isTemplate: false },
        select: { id: true, title: true, slug: true },
      }),
      this.verificationService.getStalPages(workspaceId),
    ])

    const pageTitleTokens = new Set<string>()
    const pageTitles = pages.map((page) => page.title.toLowerCase())
    for (const page of pages) {
      for (const token of this.tokenize(page.title)) {
        pageTitleTokens.add(token)
      }
    }

    const topicMap = new Map<string, GapTopic>()
    const questionMap = new Map<string, GapQuestion>()

    for (const task of tasks) {
      const taskTokens = new Set(
        this.tokenize(`${task.title} ${task.description ?? ''}`).filter(
          (token) => !pageTitleTokens.has(token),
        ),
      )

      for (const token of taskTokens) {
        const entry = topicMap.get(token) ?? {
          topic: token,
          count: 0,
          sampleTasks: [],
        }
        entry.count += 1
        if (entry.sampleTasks.length < 3) {
          entry.sampleTasks.push({ id: task.id, title: task.title })
        }
        topicMap.set(token, entry)
      }

      const question = this.extractQuestion(task.title, task.description ?? '')
      if (question) {
        const normalized = question.toLowerCase()
        if (!this.hasMatchingPage(normalized, pageTitles)) {
          const entry = questionMap.get(normalized) ?? {
            question: question,
            count: 0,
            sampleTasks: [],
          }
          entry.count += 1
          if (entry.sampleTasks.length < 3) {
            entry.sampleTasks.push({ id: task.id, title: task.title })
          }
          questionMap.set(normalized, entry)
        }
      }
    }

    const missingTopics = Array.from(topicMap.values())
      .filter((topic) => topic.count >= minFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    const frequentQuestions = Array.from(questionMap.values())
      .filter((question) => question.count >= questionMinFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    const suggestions: GapSuggestion[] = [
      ...missingTopics.map((topic) => ({
        title: this.toTitleCase(topic.topic),
        reason: `Mentioned in ${topic.count} tasks`,
        source: 'topic' as const,
      })),
      ...frequentQuestions.map((question) => ({
        title: `FAQ: ${this.toTitleCase(question.question)}`,
        reason: `Asked in ${question.count} tasks`,
        source: 'question' as const,
      })),
    ].slice(0, limit)

    this.logger.log({
      message: 'KB gap analysis completed',
      workspaceId,
      taskWindowDays,
      missingTopics: missingTopics.length,
      frequentQuestions: frequentQuestions.length,
      outdatedPages: stalePages.length,
    })

    return {
      generatedAt: new Date().toISOString(),
      taskWindowDays,
      missingTopics,
      frequentQuestions,
      outdatedPages: stalePages,
      suggestions,
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4)
      .filter((token) => !STOP_WORDS.has(token))
  }

  private extractQuestion(title: string, description: string): string | null {
    const candidates = [title, description]

    for (const candidate of candidates) {
      if (!candidate) continue
      const normalized = candidate.replace(/\s+/g, ' ').trim()
      if (!normalized) continue

      if (normalized.includes('?')) {
        const question = normalized.split('?')[0]?.trim()
        return question || null
      }

      const lower = normalized.toLowerCase()
      if (QUESTION_PREFIXES.some((prefix) => lower.startsWith(`${prefix} `))) {
        return normalized
      }
    }

    return null
  }

  private hasMatchingPage(question: string, pageTitles: string[]): boolean {
    if (pageTitles.some((title) => title.includes(question))) {
      return true
    }

    const tokens = this.tokenize(question)
    if (tokens.length === 0) return false
    return tokens.some((token) => pageTitles.some((title) => title.includes(token)))
  }

  private toTitleCase(text: string): string {
    return text
      .split(' ')
      .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
      .join(' ')
  }
}
