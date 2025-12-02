/**
 * RLS Context Management
 *
 * Helper functions to manage PostgreSQL Row-Level Security (RLS) tenant context.
 *
 * These functions set the `app.tenant_id` session variable that RLS policies use
 * to filter queries. This provides database-level tenant isolation as part of
 * our defense-in-depth multi-tenancy architecture.
 *
 * @module rls-context
 * @see Story 03-5: Create PostgreSQL RLS Policies
 * @see Migration: 20251202190000_enable_rls_policies
 */

import { PrismaClient } from '@prisma/client'

/**
 * Set the tenant context for RLS policies
 *
 * Sets the PostgreSQL session variable `app.tenant_id` that RLS policies use
 * to filter queries. This must be called before any tenant-scoped queries.
 *
 * @param prisma - Prisma client instance
 * @param tenantId - Workspace UUID to set as current tenant context
 *
 * @example
 * ```typescript
 * const prisma = new PrismaClient()
 * await setTenantContext(prisma, 'workspace-123')
 *
 * // Now all queries are filtered to workspace-123
 * const approvals = await prisma.approvalItem.findMany()
 * ```
 *
 * @throws {Prisma.PrismaClientKnownRequestError} If database connection fails
 */
export async function setTenantContext(
  prisma: PrismaClient,
  tenantId: string
): Promise<void> {
  if (!tenantId) {
    throw new Error('tenantId is required for RLS context')
  }

  // Validate tenantId is a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(tenantId)) {
    throw new Error(`Invalid tenantId format: ${tenantId}. Must be a valid UUID.`)
  }

  // Set LOCAL ensures the variable is transaction-scoped
  // It will be cleared when the transaction commits/rolls back
  await prisma.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`)
}

/**
 * Clear the tenant context
 *
 * Resets the `app.tenant_id` session variable. After this call, RLS policies
 * will deny all access to tenant-scoped tables (policies evaluate to false).
 *
 * @param prisma - Prisma client instance
 *
 * @example
 * ```typescript
 * await clearTenantContext(prisma)
 *
 * // Now queries will return empty results due to RLS
 * const approvals = await prisma.approvalItem.findMany() // []
 * ```
 */
export async function clearTenantContext(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`RESET app.tenant_id`)
}

/**
 * Execute an operation within a tenant context
 *
 * Creates a new Prisma client, sets the tenant context, executes the operation,
 * and ensures the client is properly disconnected afterwards.
 *
 * This is the recommended way to use RLS in application code as it ensures
 * proper cleanup even if the operation throws an error.
 *
 * @param tenantId - Workspace UUID to set as current tenant context
 * @param operation - Async operation to execute with tenant context
 * @returns Result of the operation
 *
 * @example
 * ```typescript
 * const approvals = await withRLSContext('workspace-123', async (prisma) => {
 *   return prisma.approvalItem.findMany({
 *     where: { status: 'pending' }
 *   })
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Complex operation with multiple queries
 * const result = await withRLSContext('workspace-456', async (prisma) => {
 *   const [approvals, configs, usage] = await Promise.all([
 *     prisma.approvalItem.count(),
 *     prisma.aIProviderConfig.findMany(),
 *     prisma.tokenUsage.aggregate({ _sum: { totalTokens: true } })
 *   ])
 *
 *   return { approvals, configs, usage }
 * })
 * ```
 *
 * @throws {Error} If tenantId is invalid
 * @throws Any error thrown by the operation
 */
export async function withRLSContext<T>(
  tenantId: string,
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  if (!tenantId) {
    throw new Error('tenantId is required for RLS context')
  }

  // Create a new Prisma client for this operation
  const prisma = new PrismaClient()

  try {
    // Set the tenant context
    await setTenantContext(prisma, tenantId)

    // Execute the operation
    const result = await operation(prisma)

    return result
  } finally {
    // Always disconnect the client, even if operation throws
    await prisma.$disconnect()
  }
}

/**
 * Get the current tenant context (for debugging)
 *
 * Retrieves the current value of `app.tenant_id` session variable.
 * Useful for debugging and logging purposes.
 *
 * @param prisma - Prisma client instance
 * @returns Current tenant ID or null if not set
 *
 * @example
 * ```typescript
 * const currentTenant = await getCurrentTenantContext(prisma)
 * console.log('Current tenant:', currentTenant)
 * ```
 */
export async function getCurrentTenantContext(
  prisma: PrismaClient
): Promise<string | null> {
  try {
    const result = await prisma.$queryRaw<Array<{ current_setting: string }>>`
      SELECT current_setting('app.tenant_id', true) as current_setting
    `

    return result[0]?.current_setting || null
  } catch (error) {
    // If the setting doesn't exist, return null
    return null
  }
}

/**
 * Verify RLS is enabled on a table
 *
 * Checks if Row-Level Security is enabled on the specified table.
 * Useful for testing and validation.
 *
 * @param prisma - Prisma client instance
 * @param tableName - Name of the table to check
 * @returns True if RLS is enabled, false otherwise
 *
 * @example
 * ```typescript
 * const isEnabled = await isRLSEnabled(prisma, 'approval_items')
 * if (!isEnabled) {
 *   throw new Error('RLS not enabled on approval_items!')
 * }
 * ```
 */
export async function isRLSEnabled(
  prisma: PrismaClient,
  tableName: string
): Promise<boolean> {
  const result = await prisma.$queryRaw<Array<{ rowsecurity: boolean }>>`
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = ${tableName}
  `

  return result[0]?.rowsecurity || false
}

/**
 * List all RLS policies on a table
 *
 * Retrieves all RLS policies defined on the specified table.
 * Useful for debugging and validation.
 *
 * @param prisma - Prisma client instance
 * @param tableName - Name of the table to check
 * @returns Array of policy definitions
 *
 * @example
 * ```typescript
 * const policies = await listRLSPolicies(prisma, 'approval_items')
 * console.log('Policies:', policies)
 * // [{ policyname: 'tenant_isolation_approval_items', permissive: 'PERMISSIVE', ... }]
 * ```
 */
export async function listRLSPolicies(
  prisma: PrismaClient,
  tableName: string
): Promise<Array<{
  policyname: string
  permissive: string
  roles: string[]
  cmd: string
  qual: string | null
}>> {
  const result = await prisma.$queryRaw<Array<{
    policyname: string
    permissive: string
    roles: string[]
    cmd: string
    qual: string | null
  }>>`
    SELECT
      policyname,
      permissive,
      roles,
      cmd,
      qual
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = ${tableName}
  `

  return result
}

/**
 * Verify tenant isolation is working
 *
 * Tests that RLS properly isolates tenant data by attempting to query
 * a different workspace's data.
 *
 * @param prisma - Prisma client instance
 * @param tenantId - Current tenant context
 * @param otherTenantId - Different tenant to test isolation against
 * @param tableName - Table to test (must have workspace_id column)
 * @returns True if isolation is working (no cross-tenant access)
 *
 * @example
 * ```typescript
 * const isIsolated = await verifyTenantIsolation(
 *   prisma,
 *   'workspace-123',
 *   'workspace-456',
 *   'approval_items'
 * )
 *
 * if (!isIsolated) {
 *   throw new Error('Tenant isolation breach detected!')
 * }
 * ```
 *
 * @internal This is primarily for testing purposes
 */
export async function verifyTenantIsolation(
  prisma: PrismaClient,
  tenantId: string,
  otherTenantId: string,
  tableName: string
): Promise<boolean> {
  // Set context to tenantId
  await setTenantContext(prisma, tenantId)

  // Try to query otherTenantId's data
  const result = await prisma.$queryRawUnsafe<Array<any>>(
    `SELECT COUNT(*) as count FROM "${tableName}" WHERE workspace_id = $1`,
    otherTenantId
  )

  const count = parseInt(result[0]?.count || '0', 10)

  // If count is 0, isolation is working (RLS blocked cross-tenant access)
  return count === 0
}
