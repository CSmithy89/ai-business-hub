/**
 * Module Permission Validation Utilities
 *
 * Provides validation for module-level permission overrides stored in
 * WorkspaceMember.modulePermissions JSON field. Supports two override patterns:
 * 1. Role Elevation: Grant all permissions of an elevated role within a module
 * 2. Specific Permissions: Grant only specific permissions within a module
 *
 * @module module-permissions
 */

import { z } from 'zod'
import { PERMISSIONS, type Permission } from './permissions'

// ===========================================
// VALIDATION SCHEMAS
// ===========================================

/**
 * Zod schema for a single module permission override
 *
 * Validates that override has either role or permissions (or both)
 * Role values are limited to 'admin' | 'member' | 'viewer' (not 'owner' or 'guest')
 *
 * @example
 * ```typescript
 * // Valid: role elevation
 * { role: 'admin' }
 *
 * // Valid: specific permissions
 * { permissions: ['records:view', 'records:create'] }
 *
 * // Invalid: missing both
 * { }
 * ```
 */
export const modulePermissionOverrideSchema = z
  .object({
    /** Elevated role for this module (admin/member/viewer only) */
    role: z.enum(['admin', 'member', 'viewer']).optional(),
    /** Specific permissions granted in this module */
    permissions: z.array(z.string()).optional(),
  })
  .refine((data) => data.role !== undefined || data.permissions !== undefined, {
    message: 'Must specify either role or permissions (or both)',
  })

/**
 * Zod schema for module permissions map
 *
 * Validates the structure of the modulePermissions JSON field.
 * Keys are module IDs (non-empty strings), values are override objects.
 *
 * @example
 * ```typescript
 * {
 *   'bm-crm': { role: 'admin' },
 *   'bmc': { permissions: ['records:view', 'records:create'] }
 * }
 * ```
 */
export const modulePermissionsSchema = z.record(
  z.string().min(1, 'Module ID cannot be empty'),
  modulePermissionOverrideSchema
)

/**
 * Type for validated module permissions
 * Derived from Zod schema for type safety
 */
export type ValidatedModulePermissions = z.infer<typeof modulePermissionsSchema>

// ===========================================
// VALIDATION FUNCTIONS
// ===========================================

/**
 * Validate module permissions structure
 *
 * Uses Zod schema to validate the modulePermissions JSON field.
 * Ensures structure is correct before saving to database.
 *
 * @param data - Unknown data to validate
 * @returns Validated module permissions object
 * @throws ZodError if validation fails
 *
 * @example
 * ```typescript
 * try {
 *   const validated = validateModulePermissions({
 *     'bm-crm': { role: 'admin' }
 *   })
 *   // validated is type-safe ValidatedModulePermissions
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     console.error('Validation failed:', error.errors)
 *   }
 * }
 * ```
 */
export function validateModulePermissions(
  data: unknown
): ValidatedModulePermissions {
  return modulePermissionsSchema.parse(data)
}

/**
 * Validate permission values array
 *
 * Checks that all permission strings in the array are valid Permission values
 * from the PERMISSIONS constant. Used to validate specific permissions in overrides.
 *
 * @param permissions - Array of permission strings to validate
 * @returns true if all permissions are valid, false otherwise
 *
 * @example
 * ```typescript
 * // Valid permissions
 * validatePermissionValues(['records:view', 'records:create']) // true
 *
 * // Invalid permission
 * validatePermissionValues(['invalid:permission']) // false
 *
 * // Mixed valid/invalid
 * validatePermissionValues(['records:view', 'bad:perm']) // false
 * ```
 */
export function validatePermissionValues(
  permissions: string[]
): permissions is Permission[] {
  const validPermissions = new Set(Object.values(PERMISSIONS))
  return permissions.every((p) => validPermissions.has(p as Permission))
}

/**
 * Validate a single module permission override
 *
 * Validates both structure and permission values for a single override.
 * More thorough than schema validation alone.
 *
 * @param moduleId - Module identifier to validate
 * @param override - Override object to validate
 * @returns Validation result with success flag and optional error message
 *
 * @example
 * ```typescript
 * const result = validateSingleOverride('bm-crm', { role: 'admin' })
 * if (!result.valid) {
 *   console.error(result.error)
 * }
 * ```
 */
export function validateSingleOverride(
  moduleId: string,
  override: unknown
): { valid: boolean; error?: string } {
  // Validate module ID
  if (!moduleId || moduleId.trim() === '') {
    return { valid: false, error: 'Module ID cannot be empty' }
  }

  // Validate override structure
  try {
    const validated = modulePermissionOverrideSchema.parse(override)

    // If override has specific permissions, validate them
    if (validated.permissions) {
      if (validated.permissions.length === 0) {
        return {
          valid: false,
          error: 'Permissions array cannot be empty',
        }
      }

      if (!validatePermissionValues(validated.permissions)) {
        return {
          valid: false,
          error: `Invalid permission values in module ${moduleId}`,
        }
      }
    }

    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.issues.map((e) => e.message).join(', '),
      }
    }
    return { valid: false, error: 'Unknown validation error' }
  }
}

/**
 * Validate complete module permissions map
 *
 * Validates structure and all permission values for the entire map.
 * More thorough than schema validation alone.
 *
 * @param modulePermissions - Module permissions map to validate
 * @returns Validation result with success flag and optional errors array
 *
 * @example
 * ```typescript
 * const result = validateCompleteOverrides({
 *   'bm-crm': { role: 'admin' },
 *   'bmc': { permissions: ['records:view'] }
 * })
 *
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors)
 * }
 * ```
 */
export function validateCompleteOverrides(
  modulePermissions: unknown
): { valid: boolean; errors?: string[] } {
  // Validate structure
  try {
    const validated = validateModulePermissions(modulePermissions)

    // Validate each override's permission values
    const errors: string[] = []

    for (const [moduleId, override] of Object.entries(validated)) {
      const result = validateSingleOverride(moduleId, override)
      if (!result.valid && result.error) {
        errors.push(result.error)
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors }
    }

    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
      }
    }
    return { valid: false, errors: ['Unknown validation error'] }
  }
}

// ===========================================
// DOCUMENTATION FUNCTIONS
// ===========================================

/**
 * Get permission precedence documentation
 *
 * Returns formatted documentation explaining the order in which permissions
 * are resolved when module overrides are present. Useful for UI tooltips
 * and API documentation.
 *
 * @returns Formatted permission precedence explanation
 *
 * @example
 * ```typescript
 * const docs = getPermissionPrecedence()
 * console.log(docs)
 * // Outputs:
 * // Permission Resolution Order:
 * // 1. Check if base role has the permission
 * // ...
 * ```
 */
export function getPermissionPrecedence(): string {
  return `
Permission Resolution Order:
1. Check if base role has the permission
2. If module overrides exist for the requested module:
   a. If override specifies role elevation, check elevated role's permissions
   b. If override specifies specific permissions, check if permission is in list
3. Fall back to base role permission

Example Scenarios:

Scenario 1: Role Elevation
- Base role: member (has records:view, records:create, records:edit)
- Module override: { "bm-crm": { "role": "admin" } }
- Checking MODULE_ADMIN in bm-crm module: Uses admin role → GRANTED
- Checking MODULE_ADMIN in bmc module: Uses member role → DENIED

Scenario 2: Specific Permissions
- Base role: viewer (has workspace:read, records:view)
- Module override: { "bmc": { "permissions": ["records:view", "records:create"] } }
- Checking records:create in bmc module: In override list → GRANTED
- Checking records:delete in bmc module: Not in override, viewer doesn't have → DENIED
- Checking records:create in bm-crm module: No override, viewer doesn't have → DENIED

Scenario 3: No Override
- Base role: admin
- Module override: {} (no overrides)
- Checking any permission in any module: Uses admin role → Depends on admin permissions
  `.trim()
}

/**
 * Get available override patterns documentation
 *
 * Returns documentation of the two supported override patterns with examples.
 * Useful for UI help text and API documentation.
 *
 * @returns Formatted override patterns documentation
 */
export function getOverridePatterns(): string {
  return `
Module Permission Override Patterns:

Pattern 1: Role Elevation
Grants ALL permissions of the elevated role within the specified module.

Structure:
{
  "module-id": { "role": "admin" | "member" | "viewer" }
}

Example:
{
  "bm-crm": { "role": "admin" }
}

Effect: Member becomes Admin within CRM module only. All admin permissions
are granted in that module, but base role still applies in other modules.

Use Case: Grant elevated permissions across entire module without specifying
individual permissions.

---

Pattern 2: Specific Permissions
Grants ONLY the specified permissions within the module.

Structure:
{
  "module-id": { "permissions": ["permission1", "permission2"] }
}

Example:
{
  "bmc": { "permissions": ["records:view", "records:create"] }
}

Effect: Viewer can view and create records in content module, but cannot
delete or perform other admin actions.

Use Case: Grant specific permissions without full role elevation. More
fine-grained control than role elevation.

---

Pattern 3: Combined (Advanced)
Combines both role elevation and specific permissions.

Structure:
{
  "module-id": { "role": "member", "permissions": ["records:delete"] }
}

Effect: Grants all member permissions PLUS records:delete in the module.

Note: This pattern is less common and may be confusing. Prefer using either
role elevation or specific permissions, not both.
  `.trim()
}

/**
 * Get security guidelines for module overrides
 *
 * Returns security best practices for using module permission overrides.
 * Important for admin UI and documentation.
 *
 * @returns Formatted security guidelines
 */
export function getSecurityGuidelines(): string {
  return `
Security Guidelines for Module Permission Overrides:

1. Principle of Least Privilege
   - Only grant the minimum permissions needed for the user's role
   - Prefer specific permissions over full role elevation when possible
   - Regularly review and remove unnecessary overrides

2. No Owner Elevation
   - Module overrides cannot grant 'owner' role
   - Owner is a global role with workspace deletion permissions
   - Overrides are limited to 'admin', 'member', or 'viewer' roles

3. Validation is Critical
   - Always validate override structure before saving
   - Validate permission values against PERMISSIONS constant
   - Reject invalid structures to prevent privilege escalation

4. Audit All Changes
   - Log all module permission changes to audit_logs
   - Include before/after values, actor, and timestamp
   - Create immutable audit trail for security investigations

5. Admin-Only Access
   - Only admins and owners can modify module permissions
   - Members cannot grant themselves elevated permissions
   - Use role-based access control to protect override endpoints

6. Regular Reviews
   - Periodically review module overrides for appropriateness
   - Remove overrides when team members change responsibilities
   - Monitor for unusual or suspicious override patterns

7. Documentation
   - Document why each override was granted
   - Include business justification in audit log metadata
   - Maintain clear records of permission decisions
  `.trim()
}
