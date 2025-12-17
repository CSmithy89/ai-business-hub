import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Server, type Extension, type onAuthenticatePayload, type onLoadDocumentPayload, type onStoreDocumentPayload } from '@hocuspocus/server'
import { applyUpdate, encodeStateAsUpdate } from 'yjs'
import { PrismaService } from '../../common/services/prisma.service'

type KbCollabContext = {
  userId: string
  workspaceId: string
  tenantId: string
  pageId: string
}

type PendingPersist = {
  timeout: NodeJS.Timeout
  state: Buffer
  where: { id: string; tenantId: string; workspaceId: string }
}

const DOCUMENT_PREFIX = 'kb:page:'
const PERSIST_DEBOUNCE_MS = 5_000

@Injectable()
export class KbCollabServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KbCollabServerService.name)
  private server: Server | null = null
  private readonly pendingPersists = new Map<string, PendingPersist>()

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return
    if (process.env.KB_COLLAB_ENABLED === 'false') return

    const port = this.getCollabPort()

    this.server = new Server({
      name: 'kb-collab',
      quiet: true,
      stopOnSignals: false,
      address: this.getCollabHost(),
      extensions: [this.createKbExtension()],
    })

    await this.server.listen(port)
    this.logger.log(`KB collaboration server listening on ws://${this.server.URL}`)
  }

  async onModuleDestroy(): Promise<void> {
    for (const pending of this.pendingPersists.values()) {
      clearTimeout(pending.timeout)
    }
    this.pendingPersists.clear()

    if (this.server) {
      await this.server.destroy()
      this.server = null
    }
  }

  private getCollabPort(): number {
    const raw = this.configService.get<string | number | undefined>('KB_COLLAB_PORT')
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw
    if (typeof raw === 'string') {
      const parsed = parseInt(raw, 10)
      if (Number.isFinite(parsed)) return parsed
    }
    return 3002
  }

  private getCollabHost(): string {
    const raw = this.configService.get<string | undefined>('KB_COLLAB_HOST')
    return raw && raw.trim().length > 0 ? raw.trim() : '0.0.0.0'
  }

  private createKbExtension(): Extension {
    return {
      extensionName: 'kb-collab-persistence',
      onAuthenticate: (payload) => this.onAuthenticate(payload),
      onLoadDocument: (payload) => this.onLoadDocument(payload),
      onStoreDocument: (payload) => this.onStoreDocument(payload),
    }
  }

  private parsePageId(documentName: string): string {
    if (!documentName.startsWith(DOCUMENT_PREFIX)) {
      throw new Error('invalid-document')
    }
    const pageId = documentName.slice(DOCUMENT_PREFIX.length)
    if (!pageId) {
      throw new Error('invalid-document')
    }
    return pageId
  }

  private async validateSessionToken(token: string): Promise<{ userId: string; activeWorkspaceId: string | null }> {
    const session = await this.prisma.session.findUnique({
      where: { token },
      select: {
        id: true,
        expiresAt: true,
        activeWorkspaceId: true,
        user: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!session) throw new Error('invalid-session')
    if (session.expiresAt < new Date()) throw new Error('session-expired')
    if (!session.user) throw new Error('invalid-session')

    return { userId: session.user.id, activeWorkspaceId: session.activeWorkspaceId }
  }

  private async ensureWorkspaceMembership(userId: string, workspaceId: string): Promise<void> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      select: { id: true },
    })
    if (!membership) {
      throw new Error('forbidden')
    }
  }

  private async onAuthenticate(payload: onAuthenticatePayload): Promise<KbCollabContext> {
    const pageId = this.parsePageId(payload.documentName)
    const token = payload.token
    if (!token) {
      throw new Error('missing-token')
    }

    const { userId } = await this.validateSessionToken(token)

    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: pageId, deletedAt: null },
      select: { id: true, tenantId: true, workspaceId: true },
    })
    if (!page) {
      throw new Error('not-found')
    }

    await this.ensureWorkspaceMembership(userId, page.workspaceId)

    return {
      userId,
      workspaceId: page.workspaceId,
      tenantId: page.tenantId,
      pageId,
    }
  }

  private getContext(context: unknown): KbCollabContext {
    const maybe = context as Partial<KbCollabContext> | null
    if (!maybe?.userId || !maybe.workspaceId || !maybe.tenantId || !maybe.pageId) {
      throw new Error('missing-context')
    }
    return {
      userId: maybe.userId,
      workspaceId: maybe.workspaceId,
      tenantId: maybe.tenantId,
      pageId: maybe.pageId,
    }
  }

  private async onLoadDocument(payload: onLoadDocumentPayload): Promise<void> {
    const ctx = this.getContext(payload.context)

    const page = await this.prisma.knowledgePage.findFirst({
      where: { id: ctx.pageId, tenantId: ctx.tenantId, workspaceId: ctx.workspaceId, deletedAt: null },
      select: { yjsState: true },
    })

    if (!page?.yjsState) return

    applyUpdate(payload.document, new Uint8Array(page.yjsState))
  }

  private async onStoreDocument(payload: onStoreDocumentPayload): Promise<void> {
    const ctx = this.getContext(payload.context)

    const state = Buffer.from(encodeStateAsUpdate(payload.document))
    const where = { id: ctx.pageId, tenantId: ctx.tenantId, workspaceId: ctx.workspaceId }

    const existing = this.pendingPersists.get(payload.documentName)
    if (existing) {
      clearTimeout(existing.timeout)
    }

    const timeout = setTimeout(async () => {
      try {
        const result = await this.prisma.knowledgePage.updateMany({
          where,
          data: { yjsState: state },
        })
        if (result.count !== 1) {
          this.logger.warn(
            `Yjs state persist affected ${result.count} rows for ${payload.documentName}`,
          )
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error'
        this.logger.error(
          `Failed to persist Yjs state for ${payload.documentName}: ${message}`,
          error instanceof Error ? error.stack : undefined,
        )
      } finally {
        this.pendingPersists.delete(payload.documentName)
      }
    }, PERSIST_DEBOUNCE_MS)

    this.pendingPersists.set(payload.documentName, { timeout, state, where })
  }
}
