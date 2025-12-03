import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../src/common/guards/auth.guard';
import { TenantGuard } from '../src/common/guards/tenant.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PrismaService } from '../src/common/services/prisma.service';

/**
 * Permission Flow E2E Tests
 *
 * Story 03-2: Auth Guards for NestJS
 * Story 03-3: Permission Middleware
 * Story 04-2: Approval Queue API Endpoints (permission verification)
 *
 * Tests the full guard chain flow for approval endpoints:
 * 1. AuthGuard (JWT validation)
 * 2. TenantGuard (workspace membership)
 * 3. RolesGuard (role-based access)
 *
 * Permission Matrix for Approval Module:
 * | Endpoint                         | Owner | Admin | Member |
 * |----------------------------------|-------|-------|--------|
 * | GET /approvals                   | yes   | yes   | yes    |
 * | GET /approvals/:id               | yes   | yes   | yes    |
 * | POST /approvals/:id/approve      | yes   | yes   | no     |
 * | POST /approvals/:id/reject       | yes   | yes   | no     |
 * | POST /approvals/bulk             | yes   | yes   | no     |
 * | GET /approvals/escalation-config | yes   | yes   | no     |
 * | PUT /approvals/escalation-config | yes   | no    | no     |
 */
describe('Permission Flow E2E Tests', () => {
  let authGuard: AuthGuard;
  let tenantGuard: TenantGuard;
  let rolesGuard: RolesGuard;
  let prisma: PrismaService;
  let reflector: Reflector;

  // Test data - simulates real users/sessions/workspaces
  const testWorkspaceId = 'workspace-e2e-001';
  const testOwnerId = 'user-owner-001';
  const testAdminId = 'user-admin-001';
  const testMemberId = 'user-member-001';
  const testNonMemberId = 'user-nonmember-001';

  const mockUser = (id: string, role: string) => ({
    id,
    email: `${role}@test.com`,
    name: `Test ${role}`,
    emailVerified: true,
  });

  const mockSession = (userId: string, workspaceId: string | null = testWorkspaceId) => ({
    id: `session-${userId}`,
    token: `token-${userId}`,
    userId,
    expiresAt: new Date(Date.now() + 86400000),
    activeWorkspaceId: workspaceId,
    user: mockUser(userId, userId.split('-')[1]),
  });

  const mockWorkspace = {
    id: testWorkspaceId,
    name: 'E2E Test Workspace',
    slug: 'e2e-test-workspace',
  };

  const mockMember = (userId: string, role: string) => ({
    id: `member-${userId}`,
    userId,
    workspaceId: testWorkspaceId,
    role,
    modulePermissions: null,
    workspace: mockWorkspace,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        TenantGuard,
        RolesGuard,
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
            workspaceMember: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
    tenantGuard = module.get<TenantGuard>(TenantGuard);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    prisma = module.get<PrismaService>(PrismaService);
    reflector = module.get<Reflector>(Reflector);
  });

  const createContext = (
    token: string,
    workspaceId: string,
    isPublic: boolean = false,
    requiredRoles?: string[],
  ): ExecutionContext => {
    const mockRequest = {
      headers: { authorization: `Bearer ${token}` },
      params: { workspaceId },
      body: {},
      query: { workspaceId },
      user: undefined as any,
      workspaceId: undefined as string | undefined,
      workspace: undefined as any,
      memberRole: undefined as string | undefined,
      modulePermissions: undefined as any,
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'isPublic') return isPublic;
      if (key === 'roles') return requiredRoles;
      return undefined;
    });

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('Approval List Endpoint - GET /approvals (owner, admin, member)', () => {
    const requiredRoles = ['owner', 'admin', 'member'];

    it('should allow owner to list approvals', async () => {
      const context = createContext(`token-${testOwnerId}`, testWorkspaceId, false, requiredRoles);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testOwnerId) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testOwnerId, 'owner') as any);

      await authGuard.canActivate(context);
      await tenantGuard.canActivate(context);
      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow admin to list approvals', async () => {
      const context = createContext(`token-${testAdminId}`, testWorkspaceId, false, requiredRoles);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testAdminId) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testAdminId, 'admin') as any);

      await authGuard.canActivate(context);
      await tenantGuard.canActivate(context);
      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow member to list approvals', async () => {
      const context = createContext(`token-${testMemberId}`, testWorkspaceId, false, requiredRoles);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testMemberId) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testMemberId, 'member') as any);

      await authGuard.canActivate(context);
      await tenantGuard.canActivate(context);
      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Approve/Reject Endpoints - POST /approvals/:id/approve|reject (owner, admin)', () => {
    const requiredRoles = ['owner', 'admin'];

    it('should allow owner to approve/reject', async () => {
      const context = createContext(`token-${testOwnerId}`, testWorkspaceId, false, requiredRoles);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testOwnerId) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testOwnerId, 'owner') as any);

      await authGuard.canActivate(context);
      await tenantGuard.canActivate(context);
      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow admin to approve/reject', async () => {
      const context = createContext(`token-${testAdminId}`, testWorkspaceId, false, requiredRoles);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testAdminId) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testAdminId, 'admin') as any);

      await authGuard.canActivate(context);
      await tenantGuard.canActivate(context);
      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny member from approving/rejecting', async () => {
      const context = createContext(`token-${testMemberId}`, testWorkspaceId, false, requiredRoles);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testMemberId) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testMemberId, 'member') as any);

      await authGuard.canActivate(context);
      await tenantGuard.canActivate(context);

      expect(() => rolesGuard.canActivate(context)).toThrow('Insufficient permissions');
    });
  });

  describe('Escalation Config Endpoints - PUT /approvals/escalation-config (owner only)', () => {
    const requiredRoles = ['owner'];

    it('should allow owner to update escalation config', async () => {
      const context = createContext(`token-${testOwnerId}`, testWorkspaceId, false, requiredRoles);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testOwnerId) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testOwnerId, 'owner') as any);

      await authGuard.canActivate(context);
      await tenantGuard.canActivate(context);
      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny admin from updating escalation config', async () => {
      const context = createContext(`token-${testAdminId}`, testWorkspaceId, false, requiredRoles);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testAdminId) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testAdminId, 'admin') as any);

      await authGuard.canActivate(context);
      await tenantGuard.canActivate(context);

      expect(() => rolesGuard.canActivate(context)).toThrow('Insufficient permissions');
    });

    it('should deny member from updating escalation config', async () => {
      const context = createContext(`token-${testMemberId}`, testWorkspaceId, false, requiredRoles);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testMemberId) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testMemberId, 'member') as any);

      await authGuard.canActivate(context);
      await tenantGuard.canActivate(context);

      expect(() => rolesGuard.canActivate(context)).toThrow('Insufficient permissions');
    });
  });

  describe('Get Escalation Config - GET /approvals/escalation-config (owner, admin)', () => {
    const requiredRoles = ['owner', 'admin'];

    it('should allow owner to get escalation config', async () => {
      const context = createContext(`token-${testOwnerId}`, testWorkspaceId, false, requiredRoles);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testOwnerId) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testOwnerId, 'owner') as any);

      await authGuard.canActivate(context);
      await tenantGuard.canActivate(context);
      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow admin to get escalation config', async () => {
      const context = createContext(`token-${testAdminId}`, testWorkspaceId, false, requiredRoles);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testAdminId) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testAdminId, 'admin') as any);

      await authGuard.canActivate(context);
      await tenantGuard.canActivate(context);
      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny member from getting escalation config', async () => {
      const context = createContext(`token-${testMemberId}`, testWorkspaceId, false, requiredRoles);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testMemberId) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testMemberId, 'member') as any);

      await authGuard.canActivate(context);
      await tenantGuard.canActivate(context);

      expect(() => rolesGuard.canActivate(context)).toThrow('Insufficient permissions');
    });
  });

  describe('Cross-Workspace Access Prevention', () => {
    it('should deny access to non-members', async () => {
      const context = createContext(`token-${testNonMemberId}`, testWorkspaceId);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testNonMemberId, null) as any);
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(null);

      await authGuard.canActivate(context);

      await expect(tenantGuard.canActivate(context)).rejects.toThrow('not a member');
    });

    it('should deny access with invalid token', async () => {
      const context = createContext('invalid-token', testWorkspaceId);

      jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(null);

      await expect(authGuard.canActivate(context)).rejects.toThrow();
    });
  });

  describe('Complete Permission Matrix Verification', () => {
    const matrix = [
      { endpoint: 'GET /approvals', roles: ['owner', 'admin', 'member'], owner: true, admin: true, member: true },
      { endpoint: 'GET /approvals/:id', roles: ['owner', 'admin', 'member'], owner: true, admin: true, member: true },
      { endpoint: 'POST /approvals/:id/approve', roles: ['owner', 'admin'], owner: true, admin: true, member: false },
      { endpoint: 'POST /approvals/:id/reject', roles: ['owner', 'admin'], owner: true, admin: true, member: false },
      { endpoint: 'POST /approvals/bulk', roles: ['owner', 'admin'], owner: true, admin: true, member: false },
      { endpoint: 'GET /approvals/escalation-config', roles: ['owner', 'admin'], owner: true, admin: true, member: false },
      { endpoint: 'PUT /approvals/escalation-config', roles: ['owner'], owner: true, admin: false, member: false },
    ];

    matrix.forEach(({ endpoint, roles, owner, admin, member }) => {
      describe(endpoint, () => {
        if (owner) {
          it('should allow owner', async () => {
            const context = createContext(`token-${testOwnerId}`, testWorkspaceId, false, roles);
            jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testOwnerId) as any);
            jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testOwnerId, 'owner') as any);

            await authGuard.canActivate(context);
            await tenantGuard.canActivate(context);
            expect(rolesGuard.canActivate(context)).toBe(true);
          });
        }

        if (admin) {
          it('should allow admin', async () => {
            const context = createContext(`token-${testAdminId}`, testWorkspaceId, false, roles);
            jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testAdminId) as any);
            jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testAdminId, 'admin') as any);

            await authGuard.canActivate(context);
            await tenantGuard.canActivate(context);
            expect(rolesGuard.canActivate(context)).toBe(true);
          });
        } else {
          it('should deny admin', async () => {
            const context = createContext(`token-${testAdminId}`, testWorkspaceId, false, roles);
            jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testAdminId) as any);
            jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testAdminId, 'admin') as any);

            await authGuard.canActivate(context);
            await tenantGuard.canActivate(context);
            expect(() => rolesGuard.canActivate(context)).toThrow('Insufficient permissions');
          });
        }

        if (member) {
          it('should allow member', async () => {
            const context = createContext(`token-${testMemberId}`, testWorkspaceId, false, roles);
            jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testMemberId) as any);
            jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testMemberId, 'member') as any);

            await authGuard.canActivate(context);
            await tenantGuard.canActivate(context);
            expect(rolesGuard.canActivate(context)).toBe(true);
          });
        } else {
          it('should deny member', async () => {
            const context = createContext(`token-${testMemberId}`, testWorkspaceId, false, roles);
            jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(mockSession(testMemberId) as any);
            jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(mockMember(testMemberId, 'member') as any);

            await authGuard.canActivate(context);
            await tenantGuard.canActivate(context);
            expect(() => rolesGuard.canActivate(context)).toThrow('Insufficient permissions');
          });
        }
      });
    });
  });
});
