import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common'
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

type PrismaBytes = Uint8Array<ArrayBuffer>

type PendingPersist = {
  timeout: NodeJS.Timeout
  state: PrismaBytes
  where: { id: string; tenantId: string; workspaceId: string }
}

const DOCUMENT_PREFIX = 'kb:page:'
const PERSIST_DEBOUNCE_MS = 5_000

function toPrismaBytes(input: Uint8Array): PrismaBytes {
  const buffer = new ArrayBuffer(input.byteLength)
  const out = new Uint8Array(buffer)
  out.set(input)
  return out
}

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
    const pendingEntries = Array.from(this.pendingPersists.entries())
    for (const [, pending] of pendingEntries) {
      clearTimeout(pending.timeout)
    }

    try {
      await Promise.all(
        pendingEntries.map(([, pending]) =>
          this.prisma.knowledgePage.updateMany({
            where: pending.where,
            data: { yjsState: pending.state },
          }),
        ),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(
        `Failed to persist Yjs state during shutdown: ${message}`,
        error instanceof Error ? error.stack : undefined,
      )
    } finally {
      this.pendingPersists.clear()
    }

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
      throw new BadRequestException('invalid-document')
    }
    const pageId = documentName.slice(DOCUMENT_PREFIX.length)
    if (!pageId) {
      throw new BadRequestException('invalid-document')
    }
    return pageId
  }

  private async validateSessionToken(token: string): Promise<{ userId: string; activeWorkspaceId: string | null }> {
    let session: {
      expiresAt: Date
      activeWorkspaceId: string | null
      user: { id: string } | null
    } | null = null

    try {
      session = await this.prisma.session.findUnique({
        where: { token },
        select: {
          expiresAt: true,
          activeWorkspaceId: true,
          user: { select: { id: true } },
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Session lookup failed: ${message}`)
      throw new InternalServerErrorException('collab-db-error')
    }

    if (!session) throw new UnauthorizedException('invalid-session')
    if (session.expiresAt <= new Date()) throw new UnauthorizedException('session-expired')
    if (!session.user) throw new UnauthorizedException('invalid-session')

    return { userId: session.user.id, activeWorkspaceId: session.activeWorkspaceId }
  }

  private async ensureWorkspaceMembership(userId: string, workspaceId: string): Promise<void> {
    try {
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
        throw new ForbiddenException('forbidden')
      }
    } catch (error) {
      if (error instanceof ForbiddenException) throw error
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Workspace membership check failed: ${message}`)
      throw new InternalServerErrorException('collab-db-error')
    }
  }

  private async onAuthenticate(payload: onAuthenticatePayload): Promise<KbCollabContext> {
    const pageId = this.parsePageId(payload.documentName)
    const token = payload.token
    if (!token) {
      throw new UnauthorizedException('missing-token')
    }

    const { userId } = await this.validateSessionToken(token)

    let page: { tenantId: string; workspaceId: string } | null = null
    try {
      page = await this.prisma.knowledgePage.findFirst({
        where: { id: pageId, deletedAt: null },
        select: { tenantId: true, workspaceId: true },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`KB page lookup failed: ${message}`)
      throw new InternalServerErrorException('collab-db-error')
    }
    if (!page) {
      throw new NotFoundException('not-found')
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
      throw new UnauthorizedException('missing-context')
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

    let page: { yjsState: unknown } | null = null
    try {
      page = await this.prisma.knowledgePage.findFirst({
        where: { id: ctx.pageId, tenantId: ctx.tenantId, workspaceId: ctx.workspaceId, deletedAt: null },
        select: { yjsState: true },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Failed to load Yjs state: ${message}`)
      throw new InternalServerErrorException('collab-db-error')
    }

    if (!page?.yjsState) return

    if (!(page.yjsState instanceof Uint8Array)) {
      this.logger.warn(
        `Unexpected Yjs state type for page ${ctx.pageId}; skipping applyUpdate`,
      )
      return
    }

    try {
      applyUpdate(payload.document, page.yjsState)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.warn(`Failed to apply Yjs update for page ${ctx.pageId}: ${message}`)
    }
  }

  private async onStoreDocument(payload: onStoreDocumentPayload): Promise<void> {
    const ctx = this.getContext(payload.context)

    const state = toPrismaBytes(encodeStateAsUpdate(payload.document))
    const where = { id: ctx.pageId, tenantId: ctx.tenantId, workspaceId: ctx.workspaceId, deletedAt: null }
    const persistKey = `${ctx.tenantId}:${ctx.workspaceId}:${ctx.pageId}`

    const existing = this.pendingPersists.get(persistKey)
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
        this.pendingPersists.delete(persistKey)
      }
    }, PERSIST_DEBOUNCE_MS)

    this.pendingPersists.set(persistKey, { timeout, state, where })
  }
}
