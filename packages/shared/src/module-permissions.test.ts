/**
 * Unit tests for module permission validation utilities
 */

import { describe, it, expect } from 'vitest'
import {
  validateModulePermissions,
  validatePermissionValues,
  validateSingleOverride,
  validateCompleteOverrides,
  getPermissionPrecedence,
  getOverridePatterns,
  getSecurityGuidelines,
  modulePermissionOverrideSchema,
  modulePermissionsSchema,
} from './module-permissions'
import { PERMISSIONS } from './permissions'

describe('Module Permission Validation', () => {
  describe('modulePermissionOverrideSchema', () => {
    it('should accept valid role elevation override', () => {
      const result = modulePermissionOverrideSchema.safeParse({ role: 'admin' })
      expect(result.success).toBe(true)
    })

    it('should accept valid specific permissions override', () => {
      const result = modulePermissionOverrideSchema.safeParse({
        permissions: ['records:view', 'records:create'],
      })
      expect(result.success).toBe(true)
    })

    it('should accept override with both role and permissions', () => {
      const result = modulePermissionOverrideSchema.safeParse({
        role: 'member',
        permissions: ['records:delete'],
      })
      expect(result.success).toBe(true)
    })

    it('should reject override with neither role nor permissions', () => {
      const result = modulePermissionOverrideSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should reject invalid role value', () => {
      const result = modulePermissionOverrideSchema.safeParse({ role: 'owner' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid role value (guest)', () => {
      const result = modulePermissionOverrideSchema.safeParse({ role: 'guest' })
      expect(result.success).toBe(false)
    })

    it('should reject non-array permissions', () => {
      const result = modulePermissionOverrideSchema.safeParse({
        permissions: 'not-an-array',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('modulePermissionsSchema', () => {
    it('should accept valid module permissions map', () => {
      const result = modulePermissionsSchema.safeParse({
        'bm-crm': { role: 'admin' },
        bmc: { permissions: ['records:view'] },
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty module ID', () => {
      const result = modulePermissionsSchema.safeParse({
        '': { role: 'admin' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid override in map', () => {
      const result = modulePermissionsSchema.safeParse({
        'bm-crm': {},
      })
      expect(result.success).toBe(false)
    })

    it('should accept empty map', () => {
      const result = modulePermissionsSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('validateModulePermissions', () => {
    it('should validate correct structure', () => {
      const result = validateModulePermissions({
        'bm-crm': { role: 'admin' },
      })
      expect(result).toEqual({
        'bm-crm': { role: 'admin' },
      })
    })

    it('should throw on invalid structure', () => {
      expect(() => {
        validateModulePermissions({
          'bm-crm': {},
        })
      }).toThrow()
    })

    it('should throw on empty module ID', () => {
      expect(() => {
        validateModulePermissions({
          '': { role: 'admin' },
        })
      }).toThrow()
    })

    it('should handle multiple modules', () => {
      const result = validateModulePermissions({
        'bm-crm': { role: 'admin' },
        bmc: { permissions: ['records:view', 'records:create'] },
        'bm-brand': { role: 'member' },
      })
      expect(Object.keys(result)).toHaveLength(3)
    })
  })

  describe('validatePermissionValues', () => {
    it('should accept valid permission values', () => {
      const result = validatePermissionValues([
        PERMISSIONS.RECORDS_VIEW,
        PERMISSIONS.RECORDS_CREATE,
      ])
      expect(result).toBe(true)
    })

    it('should reject invalid permission value', () => {
      const result = validatePermissionValues(['invalid:permission'])
      expect(result).toBe(false)
    })

    it('should reject mixed valid and invalid permissions', () => {
      const result = validatePermissionValues([
        PERMISSIONS.RECORDS_VIEW,
        'invalid:permission',
      ])
      expect(result).toBe(false)
    })

    it('should accept empty array', () => {
      const result = validatePermissionValues([])
      expect(result).toBe(true)
    })

    it('should accept all valid permissions', () => {
      const allPermissions = Object.values(PERMISSIONS)
      const result = validatePermissionValues(allPermissions)
      expect(result).toBe(true)
    })
  })

  describe('validateSingleOverride', () => {
    it('should validate role elevation override', () => {
      const result = validateSingleOverride('bm-crm', { role: 'admin' })
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should validate specific permissions override', () => {
      const result = validateSingleOverride('bmc', {
        permissions: [PERMISSIONS.RECORDS_VIEW, PERMISSIONS.RECORDS_CREATE],
      })
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty module ID', () => {
      const result = validateSingleOverride('', { role: 'admin' })
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Module ID cannot be empty')
    })

    it('should reject whitespace-only module ID', () => {
      const result = validateSingleOverride('   ', { role: 'admin' })
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Module ID cannot be empty')
    })

    it('should reject empty permissions array', () => {
      const result = validateSingleOverride('bmc', { permissions: [] })
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Permissions array cannot be empty')
    })

    it('should reject invalid permission values', () => {
      const result = validateSingleOverride('bmc', {
        permissions: ['invalid:permission'],
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid permission values')
    })

    it('should reject override with neither role nor permissions', () => {
      const result = validateSingleOverride('bm-crm', {})
      expect(result.valid).toBe(false)
    })

    it('should reject invalid role value', () => {
      const result = validateSingleOverride('bm-crm', { role: 'superadmin' })
      expect(result.valid).toBe(false)
    })
  })

  describe('validateCompleteOverrides', () => {
    it('should validate complete valid overrides map', () => {
      const result = validateCompleteOverrides({
        'bm-crm': { role: 'admin' },
        bmc: { permissions: [PERMISSIONS.RECORDS_VIEW] },
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should reject overrides with invalid permission values', () => {
      const result = validateCompleteOverrides({
        'bm-crm': { role: 'admin' },
        bmc: { permissions: ['invalid:permission'] },
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
    })

    it('should reject overrides with empty module ID', () => {
      const result = validateCompleteOverrides({
        '': { role: 'admin' },
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should reject overrides with empty permissions array', () => {
      const result = validateCompleteOverrides({
        bmc: { permissions: [] },
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should collect multiple errors', () => {
      const result = validateCompleteOverrides({
        '': { role: 'admin' },
        bmc: { permissions: [] },
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
    })

    it('should accept empty overrides map', () => {
      const result = validateCompleteOverrides({})
      expect(result.valid).toBe(true)
    })
  })

  describe('Documentation Functions', () => {
    describe('getPermissionPrecedence', () => {
      it('should return non-empty documentation', () => {
        const docs = getPermissionPrecedence()
        expect(docs.length).toBeGreaterThan(0)
      })

      it('should include key concepts', () => {
        const docs = getPermissionPrecedence()
        expect(docs).toContain('Permission Resolution Order')
        expect(docs).toContain('base role')
        expect(docs).toContain('override')
      })

      it('should include examples', () => {
        const docs = getPermissionPrecedence()
        expect(docs).toContain('Example')
        expect(docs).toContain('Scenario')
      })
    })

    describe('getOverridePatterns', () => {
      it('should return non-empty documentation', () => {
        const docs = getOverridePatterns()
        expect(docs.length).toBeGreaterThan(0)
      })

      it('should describe both patterns', () => {
        const docs = getOverridePatterns()
        expect(docs).toContain('Role Elevation')
        expect(docs).toContain('Specific Permissions')
      })

      it('should include examples', () => {
        const docs = getOverridePatterns()
        expect(docs).toContain('Example')
        expect(docs).toContain('bm-crm')
      })
    })

    describe('getSecurityGuidelines', () => {
      it('should return non-empty documentation', () => {
        const docs = getSecurityGuidelines()
        expect(docs.length).toBeGreaterThan(0)
      })

      it('should include security principles', () => {
        const docs = getSecurityGuidelines()
        expect(docs).toContain('Security Guidelines')
        expect(docs).toContain('Least Privilege')
        expect(docs).toContain('Audit')
      })

      it('should warn about owner elevation', () => {
        const docs = getSecurityGuidelines()
        expect(docs).toContain('Owner')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle null module permissions', () => {
      expect(() => validateModulePermissions(null)).toThrow()
    })

    it('should handle undefined module permissions', () => {
      expect(() => validateModulePermissions(undefined)).toThrow()
    })

    it('should handle non-object module permissions', () => {
      expect(() => validateModulePermissions('not-an-object')).toThrow()
    })

    it('should handle array instead of object', () => {
      expect(() => validateModulePermissions([])).toThrow()
    })

    it('should handle module ID with special characters', () => {
      const result = validateSingleOverride('bm-crm-v2.0', { role: 'admin' })
      expect(result.valid).toBe(true)
    })

    it('should handle very long module ID', () => {
      const longId = 'a'.repeat(1000)
      const result = validateSingleOverride(longId, { role: 'admin' })
      expect(result.valid).toBe(true)
    })

    it('should handle large number of overrides', () => {
      const manyOverrides: Record<string, { role: 'admin' }> = {}
      for (let i = 0; i < 100; i++) {
        manyOverrides[`module-${i}`] = { role: 'admin' }
      }
      const result = validateCompleteOverrides(manyOverrides)
      expect(result.valid).toBe(true)
    })

    it('should handle large permissions array', () => {
      const allPermissions = Object.values(PERMISSIONS)
      const result = validateSingleOverride('bmc', { permissions: allPermissions })
      expect(result.valid).toBe(true)
    })
  })

  describe('Real-World Scenarios', () => {
    it('should validate CRM admin elevation', () => {
      const overrides = {
        'bm-crm': { role: 'admin' as const },
      }
      const result = validateCompleteOverrides(overrides)
      expect(result.valid).toBe(true)
    })

    it('should validate content module specific permissions', () => {
      const overrides = {
        bmc: {
          permissions: [
            PERMISSIONS.RECORDS_VIEW,
            PERMISSIONS.RECORDS_CREATE,
            PERMISSIONS.RECORDS_EDIT,
          ],
        },
      }
      const result = validateCompleteOverrides(overrides)
      expect(result.valid).toBe(true)
    })

    it('should validate multiple module overrides', () => {
      const overrides = {
        'bm-crm': { role: 'admin' as const },
        bmc: { permissions: [PERMISSIONS.RECORDS_VIEW] },
        'bm-brand': { role: 'member' as const },
      }
      const result = validateCompleteOverrides(overrides)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid real-world scenario', () => {
      const overrides: Record<string, { role: string }> = {
        'bm-crm': { role: 'owner' }, // Invalid: owner not allowed
      }
      const result = validateCompleteOverrides(overrides)
      expect(result.valid).toBe(false)
    })
  })
})
