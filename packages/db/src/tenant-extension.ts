import { PrismaClient } from '@prisma/client'
import { AsyncLocalStorage } from 'async_hooks'

/**
 * Async local storage for tenant context
 * Stores the current workspace ID for automatic query scoping
 */
export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>()

/**
 * Models that are NOT tenant-scoped (global entities)
 */
const NON_TENANT_MODELS = ['User', 'Session', 'Account', 'Workspace', 'VerificationToken', 'WorkspaceInvitation']

/**
 * Creates a Prisma Client with automatic tenant scoping
 *
 * All queries will automatically filter by the current tenant ID from context.
 * Throws error if tenant context is not set.
 *
 * @example
 * ```ts
 * const db = createTenantPrismaClient()
 *
 * tenantContext.run({ tenantId: 'workspace-123' }, async () => {
 *   // All queries automatically scoped to workspace-123
 *   const approvals = await db.approvalItem.findMany()
 * })
 * ```
 */
export function createTenantPrismaClient() {
  const prisma = new PrismaClient()

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Get tenant context
          const context = tenantContext.getStore()
          if (!context?.tenantId) {
            throw new Error(
              `Tenant context required for database access. Model: ${model}, Operation: ${operation}`
            )
          }

          const tenantId = context.tenantId

          // Skip tenant filtering for non-tenant tables
          if (NON_TENANT_MODELS.includes(model)) {
            return query(args)
          }

          // Add tenant filter to read operations
          if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(operation)) {
            // Type assertion needed for Prisma's complex type system
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(args as any).where = { ...(args as any).where, workspaceId: tenantId }
          }

          // Add tenant to create operations
          if (operation === 'create') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(args as any).data = { ...(args as any).data, workspaceId: tenantId }
          }

          if (operation === 'createMany') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (Array.isArray((args as any).data)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(args as any).data = (args as any).data.map((item: any) => ({ ...item, workspaceId: tenantId }))
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(args as any).data = { ...(args as any).data, workspaceId: tenantId }
            }
          }

          // Add tenant filter to update/delete operations
          if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(args as any).where = { ...(args as any).where, workspaceId: tenantId }
          }

          return query(args)
        },
      },
    },
  })
}
