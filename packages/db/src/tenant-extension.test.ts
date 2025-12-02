/**
 * Tenant Extension Tests
 *
 * NOTE: These tests require vitest to be configured in the workspace.
 * To run: Add vitest to package.json devDependencies and create vitest.config.ts
 *
 * Test Strategy:
 * - Context Management: Test withTenantContext and getTenantId helpers
 * - Read Operations: Verify auto-filtering by workspace for findMany, findFirst, etc.
 * - Write Operations: Verify auto-injection of workspaceId for create operations
 * - Global Models: Verify User, Session, Workspace, etc. are not filtered
 * - Error Handling: Verify queries without context throw appropriate errors
 * - Edge Cases: Complex where clauses, explicit workspace filters
 *
 * Run tests with: pnpm test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { createTenantPrismaClient, withTenantContext, getTenantId } from './tenant-extension'

// Test database setup
const testDb = new PrismaClient()
const tenantDb = createTenantPrismaClient()

// Test workspace IDs
const WORKSPACE_A = 'test-workspace-a'
const WORKSPACE_B = 'test-workspace-b'

describe('Tenant Extension', () => {
  beforeAll(async () => {
    // Create test workspaces
    await testDb.workspace.createMany({
      data: [
        { id: WORKSPACE_A, name: 'Test Workspace A', slug: 'test-workspace-a' },
        { id: WORKSPACE_B, name: 'Test Workspace B', slug: 'test-workspace-b' },
      ],
      skipDuplicates: true,
    })
  })

  afterAll(async () => {
    // Clean up test data
    await testDb.approvalItem.deleteMany({
      where: { workspaceId: { in: [WORKSPACE_A, WORKSPACE_B] } },
    })
    await testDb.workspace.deleteMany({
      where: { id: { in: [WORKSPACE_A, WORKSPACE_B] } },
    })
    await testDb.$disconnect()
  })

  beforeEach(async () => {
    // Clean approval items before each test
    await testDb.approvalItem.deleteMany({
      where: { workspaceId: { in: [WORKSPACE_A, WORKSPACE_B] } },
    })
  })

  describe('Context Management', () => {
    it('should set tenant context with withTenantContext', () => {
      withTenantContext(WORKSPACE_A, () => {
        const tenantId = getTenantId()
        expect(tenantId).toBe(WORKSPACE_A)
      })
    })

    it('should clear context after withTenantContext execution', () => {
      withTenantContext(WORKSPACE_A, () => {
        expect(getTenantId()).toBe(WORKSPACE_A)
      })
      expect(getTenantId()).toBeUndefined()
    })

    it('should return undefined when no context is set', () => {
      const tenantId = getTenantId()
      expect(tenantId).toBeUndefined()
    })

    it('should maintain correct context in nested calls', () => {
      withTenantContext(WORKSPACE_A, () => {
        expect(getTenantId()).toBe(WORKSPACE_A)

        withTenantContext(WORKSPACE_B, () => {
          expect(getTenantId()).toBe(WORKSPACE_B)
        })

        expect(getTenantId()).toBe(WORKSPACE_A)
      })
    })

    it('should propagate context through async operations', async () => {
      await withTenantContext(WORKSPACE_A, async () => {
        expect(getTenantId()).toBe(WORKSPACE_A)

        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(getTenantId()).toBe(WORKSPACE_A)
      })
    })
  })

  describe('Read Operations', () => {
    beforeEach(async () => {
      // Create test data in both workspaces
      await testDb.approvalItem.createMany({
        data: [
          {
            workspaceId: WORKSPACE_A,
            type: 'test',
            title: 'Approval A1',
            confidenceScore: 85,
            aiRecommendation: 'approve',
            requestedBy: 'system',
            dueAt: new Date(),
          },
          {
            workspaceId: WORKSPACE_A,
            type: 'test',
            title: 'Approval A2',
            confidenceScore: 75,
            aiRecommendation: 'approve',
            requestedBy: 'system',
            dueAt: new Date(),
          },
          {
            workspaceId: WORKSPACE_B,
            type: 'test',
            title: 'Approval B1',
            confidenceScore: 90,
            aiRecommendation: 'approve',
            requestedBy: 'system',
            dueAt: new Date(),
          },
        ],
      })
    })

    it('should auto-filter findMany by workspace', async () => {
      const approvals = await withTenantContext(WORKSPACE_A, async () => {
        return tenantDb.approvalItem.findMany()
      })

      expect(approvals).toHaveLength(2)
      expect(approvals.every((a) => a.workspaceId === WORKSPACE_A)).toBe(true)
    })

    it('should auto-filter findFirst by workspace', async () => {
      const approval = await withTenantContext(WORKSPACE_A, async () => {
        return tenantDb.approvalItem.findFirst({
          where: { title: 'Approval A1' },
        })
      })

      expect(approval).toBeTruthy()
      expect(approval?.workspaceId).toBe(WORKSPACE_A)
    })

    it('should auto-filter count by workspace', async () => {
      const count = await withTenantContext(WORKSPACE_A, async () => {
        return tenantDb.approvalItem.count()
      })

      expect(count).toBe(2)
    })

    it('should block cross-tenant access', async () => {
      const approvals = await withTenantContext(WORKSPACE_B, async () => {
        return tenantDb.approvalItem.findMany({
          where: { title: { contains: 'Approval A' } },
        })
      })

      expect(approvals).toHaveLength(0)
    })

    it('should combine user filters with tenant filter', async () => {
      const approval = await withTenantContext(WORKSPACE_A, async () => {
        return tenantDb.approvalItem.findFirst({
          where: { confidenceScore: { gte: 80 } },
        })
      })

      expect(approval).toBeTruthy()
      expect(approval?.workspaceId).toBe(WORKSPACE_A)
      expect(approval?.confidenceScore).toBeGreaterThanOrEqual(80)
    })
  })

  describe('Write Operations', () => {
    it('should auto-inject workspaceId on create', async () => {
      const approval = await withTenantContext(WORKSPACE_A, async () => {
        return tenantDb.approvalItem.create({
          data: {
            type: 'test',
            title: 'New Approval',
            confidenceScore: 80,
            aiRecommendation: 'approve',
            requestedBy: 'system',
            dueAt: new Date(),
          },
        })
      })

      expect(approval.workspaceId).toBe(WORKSPACE_A)

      // Verify it was actually saved with correct workspace
      const found = await testDb.approvalItem.findUnique({
        where: { id: approval.id },
      })
      expect(found?.workspaceId).toBe(WORKSPACE_A)
    })

    it('should auto-inject workspaceId on createMany', async () => {
      const result = await withTenantContext(WORKSPACE_A, async () => {
        return tenantDb.approvalItem.createMany({
          data: [
            {
              type: 'test',
              title: 'Bulk Approval 1',
              confidenceScore: 70,
              aiRecommendation: 'approve',
              requestedBy: 'system',
              dueAt: new Date(),
            },
            {
              type: 'test',
              title: 'Bulk Approval 2',
              confidenceScore: 80,
              aiRecommendation: 'approve',
              requestedBy: 'system',
              dueAt: new Date(),
            },
          ],
        })
      })

      expect(result.count).toBe(2)

      // Verify all were created with correct workspace
      const approvals = await testDb.approvalItem.findMany({
        where: { title: { contains: 'Bulk Approval' } },
      })
      expect(approvals).toHaveLength(2)
      expect(approvals.every((a) => a.workspaceId === WORKSPACE_A)).toBe(true)
    })

    it('should auto-filter update by workspace', async () => {
      // Create an approval in workspace A
      const approval = await testDb.approvalItem.create({
        data: {
          workspaceId: WORKSPACE_A,
          type: 'test',
          title: 'To Update',
          confidenceScore: 70,
          aiRecommendation: 'approve',
          requestedBy: 'system',
          dueAt: new Date(),
        },
      })

      // Try to update from workspace B context (should fail silently)
      await withTenantContext(WORKSPACE_B, async () => {
        await tenantDb.approvalItem.update({
          where: { id: approval.id },
          data: { confidenceScore: 90 },
        }).catch(() => {
          // Expected to fail - no record found in workspace B
        })
      })

      // Verify it wasn't updated
      const found = await testDb.approvalItem.findUnique({
        where: { id: approval.id },
      })
      expect(found?.confidenceScore).toBe(70)

      // Update from correct workspace should work
      await withTenantContext(WORKSPACE_A, async () => {
        await tenantDb.approvalItem.update({
          where: { id: approval.id },
          data: { confidenceScore: 90 },
        })
      })

      const updated = await testDb.approvalItem.findUnique({
        where: { id: approval.id },
      })
      expect(updated?.confidenceScore).toBe(90)
    })

    it('should auto-filter updateMany by workspace', async () => {
      // Create approvals in both workspaces
      await testDb.approvalItem.createMany({
        data: [
          {
            workspaceId: WORKSPACE_A,
            type: 'test',
            title: 'Update Many A',
            confidenceScore: 70,
            aiRecommendation: 'approve',
            requestedBy: 'system',
            dueAt: new Date(),
          },
          {
            workspaceId: WORKSPACE_B,
            type: 'test',
            title: 'Update Many B',
            confidenceScore: 70,
            aiRecommendation: 'approve',
            requestedBy: 'system',
            dueAt: new Date(),
          },
        ],
      })

      // Update all with confidence 70 from workspace A context
      const result = await withTenantContext(WORKSPACE_A, async () => {
        return tenantDb.approvalItem.updateMany({
          where: { confidenceScore: 70 },
          data: { confidenceScore: 85 },
        })
      })

      expect(result.count).toBe(1)

      // Verify only workspace A was updated
      const approvalA = await testDb.approvalItem.findFirst({
        where: { title: 'Update Many A' },
      })
      const approvalB = await testDb.approvalItem.findFirst({
        where: { title: 'Update Many B' },
      })

      expect(approvalA?.confidenceScore).toBe(85)
      expect(approvalB?.confidenceScore).toBe(70)
    })

    it('should auto-filter delete by workspace', async () => {
      // Create approval in workspace A
      const approval = await testDb.approvalItem.create({
        data: {
          workspaceId: WORKSPACE_A,
          type: 'test',
          title: 'To Delete',
          confidenceScore: 70,
          aiRecommendation: 'approve',
          requestedBy: 'system',
          dueAt: new Date(),
        },
      })

      // Try to delete from workspace B (should fail)
      await withTenantContext(WORKSPACE_B, async () => {
        await tenantDb.approvalItem.delete({
          where: { id: approval.id },
        }).catch(() => {
          // Expected to fail
        })
      })

      // Verify it still exists
      let found = await testDb.approvalItem.findUnique({
        where: { id: approval.id },
      })
      expect(found).toBeTruthy()

      // Delete from correct workspace
      await withTenantContext(WORKSPACE_A, async () => {
        await tenantDb.approvalItem.delete({
          where: { id: approval.id },
        })
      })

      // Verify it's deleted
      found = await testDb.approvalItem.findUnique({
        where: { id: approval.id },
      })
      expect(found).toBeNull()
    })

    it('should auto-filter deleteMany by workspace', async () => {
      // Create approvals in both workspaces
      await testDb.approvalItem.createMany({
        data: [
          {
            workspaceId: WORKSPACE_A,
            type: 'test',
            title: 'Delete Many A1',
            confidenceScore: 60,
            aiRecommendation: 'approve',
            requestedBy: 'system',
            dueAt: new Date(),
          },
          {
            workspaceId: WORKSPACE_A,
            type: 'test',
            title: 'Delete Many A2',
            confidenceScore: 60,
            aiRecommendation: 'approve',
            requestedBy: 'system',
            dueAt: new Date(),
          },
          {
            workspaceId: WORKSPACE_B,
            type: 'test',
            title: 'Delete Many B',
            confidenceScore: 60,
            aiRecommendation: 'approve',
            requestedBy: 'system',
            dueAt: new Date(),
          },
        ],
      })

      // Delete all with confidence 60 from workspace A
      const result = await withTenantContext(WORKSPACE_A, async () => {
        return tenantDb.approvalItem.deleteMany({
          where: { confidenceScore: 60 },
        })
      })

      expect(result.count).toBe(2)

      // Verify only workspace A items were deleted
      const remainingA = await testDb.approvalItem.count({
        where: { workspaceId: WORKSPACE_A, confidenceScore: 60 },
      })
      const remainingB = await testDb.approvalItem.count({
        where: { workspaceId: WORKSPACE_B, confidenceScore: 60 },
      })

      expect(remainingA).toBe(0)
      expect(remainingB).toBe(1)
    })
  })

  describe('Global Models', () => {
    it('should not filter User queries', async () => {
      await withTenantContext(WORKSPACE_A, async () => {
        // Should not throw error and should not filter
        const users = await tenantDb.user.findMany()
        // Just verify it doesn't throw
        expect(Array.isArray(users)).toBe(true)
      })
    })

    it('should not filter Session queries', async () => {
      await withTenantContext(WORKSPACE_A, async () => {
        const sessions = await tenantDb.session.findMany()
        expect(Array.isArray(sessions)).toBe(true)
      })
    })

    it('should not filter Workspace queries', async () => {
      await withTenantContext(WORKSPACE_A, async () => {
        const workspaces = await tenantDb.workspace.findMany()
        expect(Array.isArray(workspaces)).toBe(true)
        // Should find both workspaces, not just WORKSPACE_A
        expect(workspaces.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('should not filter Account queries', async () => {
      await withTenantContext(WORKSPACE_A, async () => {
        const accounts = await tenantDb.account.findMany()
        expect(Array.isArray(accounts)).toBe(true)
      })
    })

    it('should not filter VerificationToken queries', async () => {
      await withTenantContext(WORKSPACE_A, async () => {
        const tokens = await tenantDb.verificationToken.findMany()
        expect(Array.isArray(tokens)).toBe(true)
      })
    })

    it('should not filter WorkspaceInvitation queries', async () => {
      await withTenantContext(WORKSPACE_A, async () => {
        const invitations = await tenantDb.workspaceInvitation.findMany()
        expect(Array.isArray(invitations)).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    it('should throw error when querying tenant model without context', async () => {
      await expect(async () => {
        await tenantDb.approvalItem.findMany()
      }).rejects.toThrow('Tenant context required for database access')
    })

    it('should include model name in error message', async () => {
      await expect(async () => {
        await tenantDb.approvalItem.findMany()
      }).rejects.toThrow('Model: ApprovalItem')
    })

    it('should include operation in error message', async () => {
      await expect(async () => {
        await tenantDb.approvalItem.findMany()
      }).rejects.toThrow('Operation: findMany')
    })

    it('should throw error on create without context', async () => {
      await expect(async () => {
        await tenantDb.approvalItem.create({
          data: {
            type: 'test',
            title: 'No Context',
            confidenceScore: 70,
            aiRecommendation: 'approve',
            requestedBy: 'system',
            dueAt: new Date(),
          },
        })
      }).rejects.toThrow('Tenant context required')
    })

    it('should throw error on update without context', async () => {
      await expect(async () => {
        await tenantDb.approvalItem.update({
          where: { id: 'some-id' },
          data: { confidenceScore: 90 },
        })
      }).rejects.toThrow('Tenant context required')
    })

    it('should throw error on delete without context', async () => {
      await expect(async () => {
        await tenantDb.approvalItem.delete({
          where: { id: 'some-id' },
        })
      }).rejects.toThrow('Tenant context required')
    })
  })

  describe('Edge Cases', () => {
    it('should handle explicit workspaceId in where clause', async () => {
      // Create approval
      await testDb.approvalItem.create({
        data: {
          workspaceId: WORKSPACE_A,
          type: 'test',
          title: 'Explicit Filter',
          confidenceScore: 70,
          aiRecommendation: 'approve',
          requestedBy: 'system',
          dueAt: new Date(),
        },
      })

      // Query with explicit wrong workspace should return nothing
      const approvals = await withTenantContext(WORKSPACE_A, async () => {
        return tenantDb.approvalItem.findMany({
          where: { workspaceId: WORKSPACE_B },
        })
      })

      // The tenant filter (WORKSPACE_A) AND user filter (WORKSPACE_B) = no results
      expect(approvals).toHaveLength(0)
    })

    it('should handle empty where clause', async () => {
      await testDb.approvalItem.create({
        data: {
          workspaceId: WORKSPACE_A,
          type: 'test',
          title: 'Empty Where',
          confidenceScore: 70,
          aiRecommendation: 'approve',
          requestedBy: 'system',
          dueAt: new Date(),
        },
      })

      const approvals = await withTenantContext(WORKSPACE_A, async () => {
        return tenantDb.approvalItem.findMany({})
      })

      expect(approvals.every((a) => a.workspaceId === WORKSPACE_A)).toBe(true)
    })

    it('should handle complex where conditions', async () => {
      await testDb.approvalItem.createMany({
        data: [
          {
            workspaceId: WORKSPACE_A,
            type: 'urgent',
            title: 'Complex 1',
            confidenceScore: 85,
            aiRecommendation: 'approve',
            requestedBy: 'system',
            dueAt: new Date(),
          },
          {
            workspaceId: WORKSPACE_A,
            type: 'normal',
            title: 'Complex 2',
            confidenceScore: 90,
            aiRecommendation: 'approve',
            requestedBy: 'system',
            dueAt: new Date(),
          },
        ],
      })

      const approvals = await withTenantContext(WORKSPACE_A, async () => {
        return tenantDb.approvalItem.findMany({
          where: {
            OR: [{ type: 'urgent' }, { confidenceScore: { gte: 90 } }],
          },
        })
      })

      expect(approvals).toHaveLength(2)
      expect(approvals.every((a) => a.workspaceId === WORKSPACE_A)).toBe(true)
    })
  })
})
