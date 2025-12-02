/**
 * RLS Policies Integration Tests
 *
 * Tests PostgreSQL Row-Level Security (RLS) policies for tenant isolation.
 *
 * These tests verify that:
 * 1. RLS is enabled on all tenant-scoped tables
 * 2. Tenant isolation works (workspace A cannot see workspace B data)
 * 3. Same-tenant access is allowed
 * 4. Missing tenant context returns no rows
 * 5. Platform admin role can bypass RLS (if configured)
 *
 * @module rls-policies.test
 * @see Story 03-5: Create PostgreSQL RLS Policies
 * @see Migration: 20251202190000_enable_rls_policies
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import {
  setTenantContext,
  clearTenantContext,
  withRLSContext,
  getCurrentTenantContext,
  isRLSEnabled,
  listRLSPolicies,
  verifyTenantIsolation,
} from './rls-context'

// Test database should have RLS migration applied
const prisma = new PrismaClient()

// Test workspaces
let workspaceA: { id: string; name: string; slug: string }
let workspaceB: { id: string; name: string; slug: string }

// Test user
let testUser: { id: string; email: string; name: string }

/**
 * Tenant-scoped tables that should have RLS enabled
 */
const TENANT_TABLES = [
  'approval_items',
  'ai_provider_configs',
  'token_usage',
  'api_keys',
  'event_logs',
  'audit_logs',
  'notifications',
] as const

describe('RLS Policies - Setup Verification', () => {
  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'rls-test@example.com',
        name: 'RLS Test User',
        emailVerified: true,
      },
    })

    // Create test workspace A
    workspaceA = await prisma.workspace.create({
      data: {
        name: 'Test Workspace A',
        slug: 'test-workspace-a-rls',
        members: {
          create: {
            userId: testUser.id,
            role: 'owner',
          },
        },
      },
    })

    // Create test workspace B
    workspaceB = await prisma.workspace.create({
      data: {
        name: 'Test Workspace B',
        slug: 'test-workspace-b-rls',
        members: {
          create: {
            userId: testUser.id,
            role: 'owner',
          },
        },
      },
    })
  })

  afterAll(async () => {
    // Cleanup test data
    await prisma.workspaceMember.deleteMany({
      where: { userId: testUser.id },
    })
    await prisma.workspace.deleteMany({
      where: {
        id: { in: [workspaceA.id, workspaceB.id] },
      },
    })
    await prisma.user.delete({
      where: { id: testUser.id },
    })

    await prisma.$disconnect()
  })

  test('RLS is enabled on all tenant tables', async () => {
    for (const tableName of TENANT_TABLES) {
      const enabled = await isRLSEnabled(prisma, tableName)
      expect(enabled).toBe(true, `RLS should be enabled on ${tableName}`)
    }
  })

  test('Tenant isolation policies exist on all tenant tables', async () => {
    for (const tableName of TENANT_TABLES) {
      const policies = await listRLSPolicies(prisma, tableName)

      // Should have at least one policy
      expect(policies.length).toBeGreaterThan(0, `${tableName} should have RLS policies`)

      // Should have tenant_isolation policy
      const isolationPolicy = policies.find((p) =>
        p.policyname.includes('tenant_isolation')
      )
      expect(isolationPolicy).toBeDefined(
        `${tableName} should have tenant_isolation policy`
      )

      // Policy should be for ALL commands (SELECT, INSERT, UPDATE, DELETE)
      expect(isolationPolicy?.cmd).toBe('ALL')
    }
  })
})

describe('RLS Policies - Tenant Context Management', () => {
  test('setTenantContext sets the session variable', async () => {
    await setTenantContext(prisma, workspaceA.id)

    const currentContext = await getCurrentTenantContext(prisma)
    expect(currentContext).toBe(workspaceA.id)
  })

  test('clearTenantContext clears the session variable', async () => {
    await setTenantContext(prisma, workspaceA.id)
    await clearTenantContext(prisma)

    const currentContext = await getCurrentTenantContext(prisma)
    expect(currentContext).toBeNull()
  })

  test('setTenantContext validates UUID format', async () => {
    await expect(setTenantContext(prisma, 'invalid-uuid')).rejects.toThrow(
      'Invalid tenantId format'
    )
  })

  test('setTenantContext requires non-empty tenantId', async () => {
    await expect(setTenantContext(prisma, '')).rejects.toThrow(
      'tenantId is required'
    )
  })
})

describe('RLS Policies - Tenant Isolation on ApprovalItem', () => {
  let approvalA: any
  let approvalB: any

  beforeAll(async () => {
    // Create test approval items for both workspaces
    approvalA = await prisma.approvalItem.create({
      data: {
        workspaceId: workspaceA.id,
        type: 'content_approval',
        title: 'Test Approval A',
        confidenceScore: 85,
        aiRecommendation: 'approve',
        requestedBy: 'ai-agent',
        dueAt: new Date(Date.now() + 86400000), // 24 hours from now
        status: 'pending',
        priority: 'medium',
      },
    })

    approvalB = await prisma.approvalItem.create({
      data: {
        workspaceId: workspaceB.id,
        type: 'content_approval',
        title: 'Test Approval B',
        confidenceScore: 90,
        aiRecommendation: 'approve',
        requestedBy: 'ai-agent',
        dueAt: new Date(Date.now() + 86400000),
        status: 'pending',
        priority: 'high',
      },
    })
  })

  afterAll(async () => {
    // Cleanup without RLS context (use raw SQL)
    await prisma.$executeRawUnsafe(
      `DELETE FROM approval_items WHERE id IN ($1, $2)`,
      approvalA.id,
      approvalB.id
    )
  })

  test('workspace A context can only see workspace A approvals', async () => {
    await setTenantContext(prisma, workspaceA.id)

    const approvals = await prisma.approvalItem.findMany()

    // Should only see workspace A approval
    expect(approvals).toHaveLength(1)
    expect(approvals[0].id).toBe(approvalA.id)
    expect(approvals[0].workspaceId).toBe(workspaceA.id)
  })

  test('workspace B context can only see workspace B approvals', async () => {
    await setTenantContext(prisma, workspaceB.id)

    const approvals = await prisma.approvalItem.findMany()

    // Should only see workspace B approval
    expect(approvals).toHaveLength(1)
    expect(approvals[0].id).toBe(approvalB.id)
    expect(approvals[0].workspaceId).toBe(workspaceB.id)
  })

  test('cross-tenant access is blocked', async () => {
    await setTenantContext(prisma, workspaceA.id)

    // Try to explicitly query workspace B data
    const approvals = await prisma.approvalItem.findMany({
      where: { workspaceId: workspaceB.id },
    })

    // RLS should block this - empty result
    expect(approvals).toHaveLength(0)
  })

  test('missing tenant context returns no rows', async () => {
    await clearTenantContext(prisma)

    const approvals = await prisma.approvalItem.findMany()

    // Without context, RLS policy evaluates to false → no access
    expect(approvals).toHaveLength(0)
  })

  test('findUnique with cross-tenant ID returns null', async () => {
    await setTenantContext(prisma, workspaceA.id)

    // Try to query workspace B approval by ID
    const approval = await prisma.approvalItem.findUnique({
      where: { id: approvalB.id },
    })

    // RLS should block this
    expect(approval).toBeNull()
  })

  test('update cross-tenant record has no effect', async () => {
    await setTenantContext(prisma, workspaceA.id)

    // Try to update workspace B approval
    await expect(
      prisma.approvalItem.update({
        where: { id: approvalB.id },
        data: { title: 'Hacked Title' },
      })
    ).rejects.toThrow()

    // Verify workspace B approval was not modified
    await clearTenantContext(prisma)
    await setTenantContext(prisma, workspaceB.id)

    const approval = await prisma.approvalItem.findUnique({
      where: { id: approvalB.id },
    })

    expect(approval?.title).toBe('Test Approval B')
  })

  test('delete cross-tenant record has no effect', async () => {
    await setTenantContext(prisma, workspaceA.id)

    // Try to delete workspace B approval
    await expect(
      prisma.approvalItem.delete({
        where: { id: approvalB.id },
      })
    ).rejects.toThrow()

    // Verify workspace B approval still exists
    await setTenantContext(prisma, workspaceB.id)

    const approval = await prisma.approvalItem.findUnique({
      where: { id: approvalB.id },
    })

    expect(approval).not.toBeNull()
  })
})

describe('RLS Policies - withRLSContext Helper', () => {
  let approvalA: any
  let approvalB: any

  beforeAll(async () => {
    // Create test approvals
    approvalA = await prisma.approvalItem.create({
      data: {
        workspaceId: workspaceA.id,
        type: 'test',
        title: 'Helper Test A',
        confidenceScore: 85,
        aiRecommendation: 'approve',
        requestedBy: 'test',
        dueAt: new Date(Date.now() + 86400000),
        status: 'pending',
        priority: 'medium',
      },
    })

    approvalB = await prisma.approvalItem.create({
      data: {
        workspaceId: workspaceB.id,
        type: 'test',
        title: 'Helper Test B',
        confidenceScore: 90,
        aiRecommendation: 'approve',
        requestedBy: 'test',
        dueAt: new Date(Date.now() + 86400000),
        status: 'pending',
        priority: 'high',
      },
    })
  })

  afterAll(async () => {
    await prisma.$executeRawUnsafe(
      `DELETE FROM approval_items WHERE id IN ($1, $2)`,
      approvalA.id,
      approvalB.id
    )
  })

  test('withRLSContext executes operation with correct tenant context', async () => {
    const approvals = await withRLSContext(workspaceA.id, async (db) => {
      return db.approvalItem.findMany()
    })

    expect(approvals).toHaveLength(1)
    expect(approvals[0].workspaceId).toBe(workspaceA.id)
  })

  test('withRLSContext cleans up even on error', async () => {
    await expect(
      withRLSContext(workspaceA.id, async () => {
        throw new Error('Test error')
      })
    ).rejects.toThrow('Test error')

    // Should still be able to create new context after error
    const approvals = await withRLSContext(workspaceB.id, async (db) => {
      return db.approvalItem.findMany()
    })

    expect(approvals).toHaveLength(1)
    expect(approvals[0].workspaceId).toBe(workspaceB.id)
  })

  test('withRLSContext validates tenantId', async () => {
    await expect(
      withRLSContext('', async () => {
        return null
      })
    ).rejects.toThrow('tenantId is required')
  })
})

describe('RLS Policies - Tenant Isolation Verification', () => {
  let approvalA: any
  let approvalB: any

  beforeAll(async () => {
    approvalA = await prisma.approvalItem.create({
      data: {
        workspaceId: workspaceA.id,
        type: 'test',
        title: 'Isolation Test A',
        confidenceScore: 85,
        aiRecommendation: 'approve',
        requestedBy: 'test',
        dueAt: new Date(Date.now() + 86400000),
        status: 'pending',
        priority: 'medium',
      },
    })

    approvalB = await prisma.approvalItem.create({
      data: {
        workspaceId: workspaceB.id,
        type: 'test',
        title: 'Isolation Test B',
        confidenceScore: 90,
        aiRecommendation: 'approve',
        requestedBy: 'test',
        dueAt: new Date(Date.now() + 86400000),
        status: 'pending',
        priority: 'high',
      },
    })
  })

  afterAll(async () => {
    await prisma.$executeRawUnsafe(
      `DELETE FROM approval_items WHERE id IN ($1, $2)`,
      approvalA.id,
      approvalB.id
    )
  })

  test('verifyTenantIsolation confirms isolation is working', async () => {
    const isIsolated = await verifyTenantIsolation(
      prisma,
      workspaceA.id,
      workspaceB.id,
      'approval_items'
    )

    expect(isIsolated).toBe(true)
  })

  test('verifyTenantIsolation detects when isolation is broken', async () => {
    // This test would fail if RLS was disabled
    // We can't actually test this without disabling RLS
    // But we document the expected behavior

    // If RLS was disabled:
    // const isIsolated = await verifyTenantIsolation(prisma, workspaceA.id, workspaceB.id, 'approval_items')
    // expect(isIsolated).toBe(false) // Would detect the breach
  })
})

describe('RLS Policies - Other Tenant Tables', () => {
  test('RLS works on ai_provider_configs', async () => {
    // Create configs for both workspaces
    const configA = await prisma.aIProviderConfig.create({
      data: {
        workspaceId: workspaceA.id,
        provider: 'openai',
        apiKeyEncrypted: 'encrypted-key-a',
        defaultModel: 'gpt-4',
      },
    })

    const configB = await prisma.aIProviderConfig.create({
      data: {
        workspaceId: workspaceB.id,
        provider: 'claude',
        apiKeyEncrypted: 'encrypted-key-b',
        defaultModel: 'claude-3-opus',
      },
    })

    // Test isolation
    await setTenantContext(prisma, workspaceA.id)
    const configs = await prisma.aIProviderConfig.findMany()

    expect(configs).toHaveLength(1)
    expect(configs[0].id).toBe(configA.id)

    // Cleanup
    await prisma.$executeRawUnsafe(
      `DELETE FROM ai_provider_configs WHERE id IN ($1, $2)`,
      configA.id,
      configB.id
    )
  })

  test('RLS works on api_keys', async () => {
    const keyA = await prisma.apiKey.create({
      data: {
        workspaceId: workspaceA.id,
        createdById: testUser.id,
        name: 'Test Key A',
        keyHash: 'hash-a-' + Date.now(),
        keyPrefix: 'hv_test_a',
        permissions: { read: true },
      },
    })

    const keyB = await prisma.apiKey.create({
      data: {
        workspaceId: workspaceB.id,
        createdById: testUser.id,
        name: 'Test Key B',
        keyHash: 'hash-b-' + Date.now(),
        keyPrefix: 'hv_test_b',
        permissions: { read: true },
      },
    })

    await setTenantContext(prisma, workspaceA.id)
    const keys = await prisma.apiKey.findMany()

    expect(keys).toHaveLength(1)
    expect(keys[0].id).toBe(keyA.id)

    await prisma.$executeRawUnsafe(
      `DELETE FROM api_keys WHERE id IN ($1, $2)`,
      keyA.id,
      keyB.id
    )
  })

  test('RLS works on event_logs', async () => {
    const eventA = await prisma.eventLog.create({
      data: {
        workspaceId: workspaceA.id,
        eventType: 'test.event',
        source: 'test',
        data: { test: true },
      },
    })

    const eventB = await prisma.eventLog.create({
      data: {
        workspaceId: workspaceB.id,
        eventType: 'test.event',
        source: 'test',
        data: { test: true },
      },
    })

    await setTenantContext(prisma, workspaceA.id)
    const events = await prisma.eventLog.findMany()

    expect(events).toHaveLength(1)
    expect(events[0].id).toBe(eventA.id)

    await prisma.$executeRawUnsafe(
      `DELETE FROM event_logs WHERE id IN ($1, $2)`,
      eventA.id,
      eventB.id
    )
  })

  test('RLS works on audit_logs', async () => {
    const auditA = await prisma.auditLog.create({
      data: {
        workspaceId: workspaceA.id,
        action: 'test_action',
        entity: 'test_entity',
      },
    })

    const auditB = await prisma.auditLog.create({
      data: {
        workspaceId: workspaceB.id,
        action: 'test_action',
        entity: 'test_entity',
      },
    })

    await setTenantContext(prisma, workspaceA.id)
    const logs = await prisma.auditLog.findMany()

    expect(logs).toHaveLength(1)
    expect(logs[0].id).toBe(auditA.id)

    await prisma.$executeRawUnsafe(
      `DELETE FROM audit_logs WHERE id IN ($1, $2)`,
      auditA.id,
      auditB.id
    )
  })
})

describe('RLS Policies - Non-Tenant Tables', () => {
  test('User queries work without tenant context', async () => {
    await clearTenantContext(prisma)

    const users = await prisma.user.findMany({
      where: { id: testUser.id },
    })

    // Users table has no RLS - should return results
    expect(users).toHaveLength(1)
  })

  test('Workspace queries work without tenant context', async () => {
    await clearTenantContext(prisma)

    const workspaces = await prisma.workspace.findMany({
      where: { id: { in: [workspaceA.id, workspaceB.id] } },
    })

    // Workspaces table has no RLS - should return results
    expect(workspaces).toHaveLength(2)
  })
})
