import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { RolesGuard } from './roles.guard'

describe('RolesGuard', () => {
  let guard: RolesGuard
  let reflector: Reflector

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile()

    guard = module.get<RolesGuard>(RolesGuard)
    reflector = module.get<Reflector>(Reflector)
  })

  const createMockExecutionContext = (
    memberRole?: string,
    requiredRoles?: string[],
  ): ExecutionContext => {
    const mockRequest = {
      memberRole,
    }

    if (requiredRoles !== undefined) {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles)
    }

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any
  }

  describe('canActivate', () => {
    it('should allow requests when user has required role', () => {
      const context = createMockExecutionContext('admin', ['admin', 'owner'])

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should reject requests when user lacks required role', () => {
      const context = createMockExecutionContext('member', ['admin', 'owner'])

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient permissions. Required roles: admin, owner. Your role: member',
      )
    })

    it('should allow requests when no @Roles() decorator present', () => {
      const context = createMockExecutionContext('member', undefined)

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should allow requests when @Roles() decorator has empty array', () => {
      const context = createMockExecutionContext('member', [])

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should work with single role requirement', () => {
      const context = createMockExecutionContext('owner', ['owner'])

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should work with multiple role requirements (OR logic)', () => {
      const ownerContext = createMockExecutionContext('owner', ['admin', 'owner'])
      const adminContext = createMockExecutionContext('admin', ['admin', 'owner'])
      const memberContext = createMockExecutionContext('member', ['admin', 'owner'])

      expect(guard.canActivate(ownerContext)).toBe(true)
      expect(guard.canActivate(adminContext)).toBe(true)
      expect(() => guard.canActivate(memberContext)).toThrow(ForbiddenException)
    })

    it('should handle missing role context gracefully', () => {
      const context = createMockExecutionContext(undefined, ['admin'])

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
      expect(() => guard.canActivate(context)).toThrow('Role context missing')
    })

    it('should allow owner to access owner-only endpoints', () => {
      const context = createMockExecutionContext('owner', ['owner'])

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should deny non-owner to access owner-only endpoints', () => {
      const context = createMockExecutionContext('admin', ['owner'])

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })

    it('should allow admin to access admin and owner endpoints', () => {
      const context = createMockExecutionContext('admin', ['admin', 'owner'])

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should allow member to access member, viewer, and guest endpoints', () => {
      const context = createMockExecutionContext('member', ['member', 'viewer', 'guest'])

      const result = guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should deny viewer to access member-only endpoints', () => {
      const context = createMockExecutionContext('viewer', ['member', 'admin', 'owner'])

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })

    it('should deny guest to access non-guest endpoints', () => {
      const context = createMockExecutionContext('guest', ['member', 'admin', 'owner'])

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    })

    it('should properly extract roles from both handler and class decorators', () => {
      const mockContext = createMockExecutionContext('admin', ['admin'])
      const handlerFn = () => null
      class TestController {}
      const getHandlerSpy = jest.fn(() => handlerFn)
      const getClassSpy = jest.fn(() => TestController)

      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((_key, _targets) => {
        return ['admin']
      })

      mockContext.getHandler = getHandlerSpy as any
      mockContext.getClass = getClassSpy as any

      guard.canActivate(mockContext)

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'roles',
        [handlerFn, TestController],
      )
    })
  })
})
