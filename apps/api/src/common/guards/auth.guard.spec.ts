import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthGuard } from './auth.guard'
import { PrismaService } from '../services/prisma.service'

describe('AuthGuard', () => {
  let guard: AuthGuard
  let prisma: PrismaService
  let reflector: Reflector

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    emailVerified: true,
  }

  const mockSession = {
    id: 'session-1',
    token: 'valid-token',
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
    activeWorkspaceId: 'workspace-1',
    user: mockUser,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            session: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    guard = module.get<AuthGuard>(AuthGuard)
    prisma = module.get<PrismaService>(PrismaService)
    reflector = module.get<Reflector>(Reflector)
  })

  const createMockExecutionContext = (
    authHeader?: string,
    isPublic = false,
  ): ExecutionContext => {
    const mockRequest = {
      headers: authHeader ? { authorization: authHeader } : {},
      user: undefined,
    }

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic)

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any
  }

  describe('canActivate', () => {
    it('should allow requests with valid JWT token', async () => {
      const context = createMockExecutionContext('Bearer valid-token')
      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession as any)

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(context.switchToHttp().getRequest().user).toEqual({
        ...mockUser,
        sessionId: 'session-1',
        activeWorkspaceId: 'workspace-1',
      })
    })

    it('should reject requests with missing token', async () => {
      const context = createMockExecutionContext()

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
      await expect(guard.canActivate(context)).rejects.toThrow(
        'No authentication token provided',
      )
    })

    it('should reject requests with invalid token', async () => {
      const context = createMockExecutionContext('Bearer invalid-token')
      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(null)

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid or expired authentication token',
      )
    })

    it('should reject requests with expired token', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 86400000), // 24 hours ago
      }
      const context = createMockExecutionContext('Bearer expired-token')
      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(expiredSession as any)

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
    })

    it('should bypass authentication for @Public() endpoints', async () => {
      const context = createMockExecutionContext(undefined, true)

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(prisma.session.findUnique).not.toHaveBeenCalled()
    })

    it('should extract user from token and attach to request', async () => {
      const context = createMockExecutionContext('Bearer valid-token')
      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession as any)

      await guard.canActivate(context)

      const request = context.switchToHttp().getRequest()
      expect(request.user).toBeDefined()
      expect(request.user.id).toBe('user-1')
      expect(request.user.email).toBe('test@example.com')
      expect(request.user.activeWorkspaceId).toBe('workspace-1')
    })

    it('should handle malformed Authorization header', async () => {
      const context = createMockExecutionContext('InvalidFormat')

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
    })

    it('should handle missing user in session', async () => {
      const sessionWithoutUser = {
        ...mockSession,
        user: null,
      }
      const context = createMockExecutionContext('Bearer valid-token')
      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(sessionWithoutUser as any)

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
    })
  })
})
