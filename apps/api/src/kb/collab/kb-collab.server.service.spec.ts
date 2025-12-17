import { Test } from '@nestjs/testing'
import { Document, type onAuthenticatePayload, type onLoadDocumentPayload, type onStoreDocumentPayload } from '@hocuspocus/server'
import { encodeStateAsUpdate } from 'yjs'
import { PrismaService } from '../../common/services/prisma.service'
import { ConfigService } from '@nestjs/config'
import { KbCollabServerService } from './kb-collab.server.service'

type PrismaMock = {
  session: { findUnique: jest.Mock }
  knowledgePage: { findFirst: jest.Mock; updateMany: jest.Mock }
  workspaceMember: { findUnique: jest.Mock }
}

function createAuthPayload(overrides: Partial<onAuthenticatePayload>): onAuthenticatePayload {
  return {
    context: {},
    documentName: 'kb:page:page-1',
    instance: {} as unknown as onAuthenticatePayload['instance'],
    requestHeaders: {},
    requestParameters: new URLSearchParams(),
    request: {} as unknown as onAuthenticatePayload['request'],
    socketId: 'socket-1',
    token: 'token',
    connectionConfig: { readOnly: false, isAuthenticated: false },
    ...overrides,
  }
}

function createLoadPayload(overrides: Partial<onLoadDocumentPayload>): onLoadDocumentPayload {
  return {
    context: {},
    document: new Document('kb:page:page-1'),
    documentName: 'kb:page:page-1',
    instance: {} as unknown as onLoadDocumentPayload['instance'],
    requestHeaders: {},
    requestParameters: new URLSearchParams(),
    socketId: 'socket-1',
    connectionConfig: { readOnly: false, isAuthenticated: true },
    ...overrides,
  }
}

function createStorePayload(overrides: Partial<onStoreDocumentPayload>): onStoreDocumentPayload {
  return {
    clientsCount: 1,
    context: {},
    document: new Document('kb:page:page-1'),
    documentName: 'kb:page:page-1',
    instance: {} as unknown as onStoreDocumentPayload['instance'],
    requestHeaders: {},
    requestParameters: new URLSearchParams(),
    socketId: 'socket-1',
    ...overrides,
  }
}

describe('KbCollabServerService', () => {
  let service: KbCollabServerService
  let prisma: PrismaMock

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        KbCollabServerService,
        {
          provide: PrismaService,
          useValue: {
            session: { findUnique: jest.fn() },
            knowledgePage: { findFirst: jest.fn(), updateMany: jest.fn() },
            workspaceMember: { findUnique: jest.fn() },
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile()

    service = moduleRef.get(KbCollabServerService)
    prisma = moduleRef.get(PrismaService) as unknown as PrismaMock
  })

  it('rejects invalid document names during authentication', async () => {
    prisma.session.findUnique.mockResolvedValueOnce({
      expiresAt: new Date(Date.now() + 60_000),
      activeWorkspaceId: 'ws-1',
      user: { id: 'user-1' },
    })

    const payload = createAuthPayload({ documentName: 'not-kb-doc', token: 'token' })

    await expect(
      (service as unknown as { onAuthenticate(p: onAuthenticatePayload): Promise<unknown> }).onAuthenticate(payload),
    ).rejects.toThrow('invalid-document')
  })

  it('authenticates and returns context for valid kb page docs', async () => {
    prisma.session.findUnique.mockResolvedValueOnce({
      expiresAt: new Date(Date.now() + 60_000),
      activeWorkspaceId: 'ws-1',
      user: { id: 'user-1' },
    })
    prisma.knowledgePage.findFirst.mockResolvedValueOnce({
      id: 'page-1',
      tenantId: 'ws-1',
      workspaceId: 'ws-1',
    })
    prisma.workspaceMember.findUnique.mockResolvedValueOnce({ id: 'm-1' })

    const payload = createAuthPayload({ documentName: 'kb:page:page-1', token: 'token' })
    const ctx = await (service as unknown as { onAuthenticate(p: onAuthenticatePayload): Promise<any> }).onAuthenticate(payload)

    expect(ctx).toEqual({
      userId: 'user-1',
      workspaceId: 'ws-1',
      tenantId: 'ws-1',
      pageId: 'page-1',
    })
  })

  it('loads persisted yjs state into the document', async () => {
    const docWithState = new Document('kb:page:page-1')
    docWithState.getText('content').insert(0, 'hello')
    const encoded = Buffer.from(encodeStateAsUpdate(docWithState))

    prisma.knowledgePage.findFirst.mockResolvedValueOnce({ yjsState: encoded })

    const payload = createLoadPayload({
      context: { userId: 'user-1', workspaceId: 'ws-1', tenantId: 'ws-1', pageId: 'page-1' },
    })

    await (service as unknown as { onLoadDocument(p: onLoadDocumentPayload): Promise<void> }).onLoadDocument(payload)

    expect(payload.document.getText('content').toString()).toBe('hello')
    payload.document.destroy()
    docWithState.destroy()
  })

  it('debounces yjs state persistence', async () => {
    jest.useFakeTimers()

    prisma.knowledgePage.updateMany.mockResolvedValue({ count: 1 })

    const payload = createStorePayload({
      context: { userId: 'user-1', workspaceId: 'ws-1', tenantId: 'ws-1', pageId: 'page-1' },
    })
    payload.document.getText('content').insert(0, 'hello')

    await (service as unknown as { onStoreDocument(p: onStoreDocumentPayload): Promise<void> }).onStoreDocument(payload)
    await (service as unknown as { onStoreDocument(p: onStoreDocumentPayload): Promise<void> }).onStoreDocument(payload)

    expect(prisma.knowledgePage.updateMany).not.toHaveBeenCalled()

    jest.advanceTimersByTime(5_000)
    await jest.runOnlyPendingTimersAsync()

    expect(prisma.knowledgePage.updateMany).toHaveBeenCalledTimes(1)

    jest.clearAllTimers()
    jest.useRealTimers()
    payload.document.destroy()
  })
})
