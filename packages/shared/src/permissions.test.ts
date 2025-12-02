/**
 * Permission Matrix System Tests
 * Comprehensive test coverage for permission utilities
 */

import { describe, it, expect } from 'vitest'
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  getPermissions,
  canChangeRole,
  canRemoveMember,
  hasModulePermission,
  type Permission,
  type ModulePermissions,
} from './permissions'
import type { WorkspaceRole } from './types/workspace'

describe('Permission Constants', () => {
  it('should have all permission constants defined', () => {
    expect(PERMISSIONS.WORKSPACE_READ).toBe('workspace:read')
    expect(PERMISSIONS.WORKSPACE_UPDATE).toBe('workspace:update')
    expect(PERMISSIONS.WORKSPACE_DELETE).toBe('workspace:delete')
    expect(PERMISSIONS.MEMBERS_VIEW).toBe('members:view')
    expect(PERMISSIONS.MEMBERS_INVITE).toBe('members:invite')
    expect(PERMISSIONS.MEMBERS_REMOVE).toBe('members:remove')
    expect(PERMISSIONS.MEMBERS_CHANGE_ROLE).toBe('members:change_role')
    expect(PERMISSIONS.RECORDS_VIEW).toBe('records:view')
    expect(PERMISSIONS.RECORDS_CREATE).toBe('records:create')
    expect(PERMISSIONS.RECORDS_EDIT).toBe('records:edit')
    expect(PERMISSIONS.RECORDS_DELETE).toBe('records:delete')
    expect(PERMISSIONS.APPROVALS_VIEW).toBe('approvals:view')
    expect(PERMISSIONS.APPROVALS_APPROVE).toBe('approvals:approve')
    expect(PERMISSIONS.APPROVALS_REJECT).toBe('approvals:reject')
    expect(PERMISSIONS.AGENTS_VIEW).toBe('agents:view')
    expect(PERMISSIONS.AGENTS_CONFIGURE).toBe('agents:configure')
    expect(PERMISSIONS.AGENTS_RUN).toBe('agents:run')
    expect(PERMISSIONS.API_KEYS_VIEW).toBe('api_keys:view')
    expect(PERMISSIONS.API_KEYS_CREATE).toBe('api_keys:create')
    expect(PERMISSIONS.API_KEYS_REVOKE).toBe('api_keys:revoke')
    expect(PERMISSIONS.MODULE_VIEW).toBe('module:view')
    expect(PERMISSIONS.MODULE_ADMIN).toBe('module:admin')
  })

  it('should have 22 permissions in total', () => {
    const permissionCount = Object.keys(PERMISSIONS).length
    expect(permissionCount).toBe(22)
  })

  it('should have no duplicate permission values', () => {
    const values = Object.values(PERMISSIONS)
    const uniqueValues = new Set(values)
    expect(uniqueValues.size).toBe(values.length)
  })

  it('should follow naming convention (CATEGORY_ACTION)', () => {
    const keys = Object.keys(PERMISSIONS)
    keys.forEach((key) => {
      expect(key).toMatch(/^[A-Z_]+$/)
    })
  })

  it('should follow value format (category:action)', () => {
    const values = Object.values(PERMISSIONS)
    values.forEach((value) => {
      expect(value).toMatch(/^[a-z_]+:[a-z_]+$/)
    })
  })
})

describe('Role Permission Mappings', () => {
  it('should define permissions for all 5 roles', () => {
    const roles: WorkspaceRole[] = ['owner', 'admin', 'member', 'viewer', 'guest']
    roles.forEach((role) => {
      expect(ROLE_PERMISSIONS[role]).toBeDefined()
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true)
    })
  })

  it('owner should have all permissions', () => {
    const allPermissions = Object.values(PERMISSIONS)
    const ownerPermissions = ROLE_PERMISSIONS.owner

    expect(ownerPermissions.length).toBe(allPermissions.length)
    allPermissions.forEach((permission) => {
      expect(ownerPermissions).toContain(permission)
    })
  })

  it('admin should have all permissions except WORKSPACE_DELETE', () => {
    const adminPermissions = ROLE_PERMISSIONS.admin

    // Should not have WORKSPACE_DELETE
    expect(adminPermissions).not.toContain(PERMISSIONS.WORKSPACE_DELETE)

    // Should have WORKSPACE_READ and UPDATE
    expect(adminPermissions).toContain(PERMISSIONS.WORKSPACE_READ)
    expect(adminPermissions).toContain(PERMISSIONS.WORKSPACE_UPDATE)

    // Should have all member management permissions
    expect(adminPermissions).toContain(PERMISSIONS.MEMBERS_VIEW)
    expect(adminPermissions).toContain(PERMISSIONS.MEMBERS_INVITE)
    expect(adminPermissions).toContain(PERMISSIONS.MEMBERS_REMOVE)
    expect(adminPermissions).toContain(PERMISSIONS.MEMBERS_CHANGE_ROLE)

    // Should have all record permissions
    expect(adminPermissions).toContain(PERMISSIONS.RECORDS_VIEW)
    expect(adminPermissions).toContain(PERMISSIONS.RECORDS_CREATE)
    expect(adminPermissions).toContain(PERMISSIONS.RECORDS_EDIT)
    expect(adminPermissions).toContain(PERMISSIONS.RECORDS_DELETE)

    // Should have 21 permissions (22 total - 1 WORKSPACE_DELETE)
    expect(adminPermissions.length).toBe(21)
  })

  it('member should have limited permissions', () => {
    const memberPermissions = ROLE_PERMISSIONS.member

    // Should have
    expect(memberPermissions).toContain(PERMISSIONS.WORKSPACE_READ)
    expect(memberPermissions).toContain(PERMISSIONS.MEMBERS_VIEW)
    expect(memberPermissions).toContain(PERMISSIONS.RECORDS_VIEW)
    expect(memberPermissions).toContain(PERMISSIONS.RECORDS_CREATE)
    expect(memberPermissions).toContain(PERMISSIONS.RECORDS_EDIT)
    expect(memberPermissions).toContain(PERMISSIONS.APPROVALS_VIEW)
    expect(memberPermissions).toContain(PERMISSIONS.AGENTS_VIEW)
    expect(memberPermissions).toContain(PERMISSIONS.AGENTS_RUN)
    expect(memberPermissions).toContain(PERMISSIONS.MODULE_VIEW)

    // Should not have
    expect(memberPermissions).not.toContain(PERMISSIONS.WORKSPACE_UPDATE)
    expect(memberPermissions).not.toContain(PERMISSIONS.WORKSPACE_DELETE)
    expect(memberPermissions).not.toContain(PERMISSIONS.MEMBERS_INVITE)
    expect(memberPermissions).not.toContain(PERMISSIONS.RECORDS_DELETE)
    expect(memberPermissions).not.toContain(PERMISSIONS.AGENTS_CONFIGURE)
    expect(memberPermissions).not.toContain(PERMISSIONS.MODULE_ADMIN)
  })

  it('viewer should have read-only permissions', () => {
    const viewerPermissions = ROLE_PERMISSIONS.viewer

    // Should have
    expect(viewerPermissions).toContain(PERMISSIONS.WORKSPACE_READ)
    expect(viewerPermissions).toContain(PERMISSIONS.MEMBERS_VIEW)
    expect(viewerPermissions).toContain(PERMISSIONS.RECORDS_VIEW)
    expect(viewerPermissions).toContain(PERMISSIONS.AGENTS_VIEW)
    expect(viewerPermissions).toContain(PERMISSIONS.MODULE_VIEW)

    // Should not have write permissions
    expect(viewerPermissions).not.toContain(PERMISSIONS.WORKSPACE_UPDATE)
    expect(viewerPermissions).not.toContain(PERMISSIONS.RECORDS_CREATE)
    expect(viewerPermissions).not.toContain(PERMISSIONS.RECORDS_EDIT)
    expect(viewerPermissions).not.toContain(PERMISSIONS.RECORDS_DELETE)
    expect(viewerPermissions).not.toContain(PERMISSIONS.MEMBERS_INVITE)
    expect(viewerPermissions).not.toContain(PERMISSIONS.AGENTS_RUN)
  })

  it('guest should have minimal permissions', () => {
    const guestPermissions = ROLE_PERMISSIONS.guest

    // Should have
    expect(guestPermissions).toContain(PERMISSIONS.WORKSPACE_READ)
    expect(guestPermissions).toContain(PERMISSIONS.RECORDS_VIEW)

    // Should be very limited (only 2 permissions)
    expect(guestPermissions.length).toBe(2)
  })

  it('should follow permission hierarchy (owner > admin > member > viewer > guest)', () => {
    const ownerCount = ROLE_PERMISSIONS.owner.length
    const adminCount = ROLE_PERMISSIONS.admin.length
    const memberCount = ROLE_PERMISSIONS.member.length
    const viewerCount = ROLE_PERMISSIONS.viewer.length
    const guestCount = ROLE_PERMISSIONS.guest.length

    expect(ownerCount).toBeGreaterThan(adminCount)
    expect(adminCount).toBeGreaterThan(memberCount)
    expect(memberCount).toBeGreaterThan(viewerCount)
    expect(viewerCount).toBeGreaterThan(guestCount)
  })
})

describe('hasPermission Function', () => {
  it('should return true when role has permission', () => {
    expect(hasPermission('owner', PERMISSIONS.WORKSPACE_DELETE)).toBe(true)
    expect(hasPermission('admin', PERMISSIONS.WORKSPACE_UPDATE)).toBe(true)
    expect(hasPermission('member', PERMISSIONS.RECORDS_VIEW)).toBe(true)
    expect(hasPermission('viewer', PERMISSIONS.WORKSPACE_READ)).toBe(true)
    expect(hasPermission('guest', PERMISSIONS.RECORDS_VIEW)).toBe(true)
  })

  it('should return false when role lacks permission', () => {
    expect(hasPermission('admin', PERMISSIONS.WORKSPACE_DELETE)).toBe(false)
    expect(hasPermission('member', PERMISSIONS.MEMBERS_INVITE)).toBe(false)
    expect(hasPermission('viewer', PERMISSIONS.RECORDS_CREATE)).toBe(false)
    expect(hasPermission('guest', PERMISSIONS.AGENTS_VIEW)).toBe(false)
  })

  it('owner can access WORKSPACE_DELETE', () => {
    expect(hasPermission('owner', PERMISSIONS.WORKSPACE_DELETE)).toBe(true)
  })

  it('admin cannot access WORKSPACE_DELETE', () => {
    expect(hasPermission('admin', PERMISSIONS.WORKSPACE_DELETE)).toBe(false)
  })

  it('member cannot access MEMBERS_INVITE', () => {
    expect(hasPermission('member', PERMISSIONS.MEMBERS_INVITE)).toBe(false)
  })

  it('viewer cannot access RECORDS_CREATE', () => {
    expect(hasPermission('viewer', PERMISSIONS.RECORDS_CREATE)).toBe(false)
  })

  it('should handle all roles consistently', () => {
    const roles: WorkspaceRole[] = ['owner', 'admin', 'member', 'viewer', 'guest']
    roles.forEach((role) => {
      const result = hasPermission(role, PERMISSIONS.WORKSPACE_READ)
      expect(typeof result).toBe('boolean')
    })
  })
})

describe('getPermissions Function', () => {
  it('should return complete permission array for owner', () => {
    const permissions = getPermissions('owner')
    expect(permissions.length).toBe(22)
    expect(permissions).toContain(PERMISSIONS.WORKSPACE_DELETE)
  })

  it('should return correct array for each role', () => {
    const ownerPerms = getPermissions('owner')
    const adminPerms = getPermissions('admin')
    const memberPerms = getPermissions('member')
    const viewerPerms = getPermissions('viewer')
    const guestPerms = getPermissions('guest')

    expect(ownerPerms.length).toBe(22)
    expect(adminPerms.length).toBe(21)
    expect(memberPerms.length).toBe(9)
    expect(viewerPerms.length).toBe(5)
    expect(guestPerms.length).toBe(2)
  })

  it('should return readonly arrays', () => {
    const permissions = getPermissions('admin')
    // TypeScript enforces readonly, but we can test that it's the same reference
    expect(permissions).toBe(ROLE_PERMISSIONS.admin)
  })

  it('should return the same reference on multiple calls', () => {
    const perms1 = getPermissions('member')
    const perms2 = getPermissions('member')
    expect(perms1).toBe(perms2)
  })
})

describe('canChangeRole Function', () => {
  it('owner can modify admin role', () => {
    expect(canChangeRole('owner', 'admin')).toBe(true)
  })

  it('owner can modify member role', () => {
    expect(canChangeRole('owner', 'member')).toBe(true)
  })

  it('owner can modify viewer role', () => {
    expect(canChangeRole('owner', 'viewer')).toBe(true)
  })

  it('owner can modify guest role', () => {
    expect(canChangeRole('owner', 'guest')).toBe(true)
  })

  it('owner cannot modify owner role', () => {
    expect(canChangeRole('owner', 'owner')).toBe(false)
  })

  it('admin can modify member role', () => {
    expect(canChangeRole('admin', 'member')).toBe(true)
  })

  it('admin can modify viewer role', () => {
    expect(canChangeRole('admin', 'viewer')).toBe(true)
  })

  it('admin can modify guest role', () => {
    expect(canChangeRole('admin', 'guest')).toBe(true)
  })

  it('admin cannot modify admin role', () => {
    expect(canChangeRole('admin', 'admin')).toBe(false)
  })

  it('admin cannot modify owner role', () => {
    expect(canChangeRole('admin', 'owner')).toBe(false)
  })

  it('member cannot modify any roles', () => {
    expect(canChangeRole('member', 'owner')).toBe(false)
    expect(canChangeRole('member', 'admin')).toBe(false)
    expect(canChangeRole('member', 'member')).toBe(false)
    expect(canChangeRole('member', 'viewer')).toBe(false)
    expect(canChangeRole('member', 'guest')).toBe(false)
  })

  it('viewer cannot modify any roles', () => {
    expect(canChangeRole('viewer', 'owner')).toBe(false)
    expect(canChangeRole('viewer', 'admin')).toBe(false)
    expect(canChangeRole('viewer', 'member')).toBe(false)
    expect(canChangeRole('viewer', 'viewer')).toBe(false)
    expect(canChangeRole('viewer', 'guest')).toBe(false)
  })

  it('guest cannot modify any roles', () => {
    expect(canChangeRole('guest', 'owner')).toBe(false)
    expect(canChangeRole('guest', 'admin')).toBe(false)
    expect(canChangeRole('guest', 'member')).toBe(false)
    expect(canChangeRole('guest', 'viewer')).toBe(false)
    expect(canChangeRole('guest', 'guest')).toBe(false)
  })
})

describe('canRemoveMember Function', () => {
  it('should follow same rules as canChangeRole', () => {
    // Test a sample of rules
    expect(canRemoveMember('owner', 'admin')).toBe(true)
    expect(canRemoveMember('owner', 'owner')).toBe(false)
    expect(canRemoveMember('admin', 'member')).toBe(true)
    expect(canRemoveMember('admin', 'owner')).toBe(false)
    expect(canRemoveMember('member', 'viewer')).toBe(false)
  })

  it('owner can remove non-owners', () => {
    expect(canRemoveMember('owner', 'admin')).toBe(true)
    expect(canRemoveMember('owner', 'member')).toBe(true)
    expect(canRemoveMember('owner', 'viewer')).toBe(true)
    expect(canRemoveMember('owner', 'guest')).toBe(true)
  })

  it('admin can remove members/viewers/guests', () => {
    expect(canRemoveMember('admin', 'member')).toBe(true)
    expect(canRemoveMember('admin', 'viewer')).toBe(true)
    expect(canRemoveMember('admin', 'guest')).toBe(true)
  })

  it('admin cannot remove admins or owners', () => {
    expect(canRemoveMember('admin', 'admin')).toBe(false)
    expect(canRemoveMember('admin', 'owner')).toBe(false)
  })

  it('lower roles cannot remove anyone', () => {
    expect(canRemoveMember('member', 'guest')).toBe(false)
    expect(canRemoveMember('viewer', 'guest')).toBe(false)
    expect(canRemoveMember('guest', 'guest')).toBe(false)
  })
})

describe('hasModulePermission Function', () => {
  it('should check base role permission when no overrides', () => {
    expect(
      hasModulePermission('member', 'bm-crm', PERMISSIONS.MODULE_VIEW)
    ).toBe(true)

    expect(
      hasModulePermission('member', 'bm-crm', PERMISSIONS.MODULE_ADMIN)
    ).toBe(false)
  })

  it('should check base role when module not in overrides', () => {
    const overrides: ModulePermissions = {
      'bm-crm': { role: 'admin' },
    }

    // Check different module (bm-pm not in overrides)
    expect(
      hasModulePermission(
        'member',
        'bm-pm',
        PERMISSIONS.MODULE_ADMIN,
        overrides
      )
    ).toBe(false)
  })

  it('should apply role elevation override (member → admin in module)', () => {
    const overrides: ModulePermissions = {
      'bm-crm': { role: 'admin' },
    }

    // Member elevated to admin in CRM should have MODULE_ADMIN
    expect(
      hasModulePermission(
        'member',
        'bm-crm',
        PERMISSIONS.MODULE_ADMIN,
        overrides
      )
    ).toBe(true)

    // Should also have other admin permissions in CRM
    expect(
      hasModulePermission(
        'member',
        'bm-crm',
        PERMISSIONS.RECORDS_DELETE,
        overrides
      )
    ).toBe(true)
  })

  it('role elevation grants all permissions of elevated role', () => {
    const overrides: ModulePermissions = {
      'bm-crm': { role: 'admin' },
    }

    // Member elevated to admin should have all admin permissions
    const adminPermissions = getPermissions('admin')
    adminPermissions.forEach((permission) => {
      expect(
        hasModulePermission('member', 'bm-crm', permission, overrides)
      ).toBe(true)
    })
  })

  it('should apply specific permission override', () => {
    const overrides: ModulePermissions = {
      bmc: {
        permissions: [PERMISSIONS.RECORDS_VIEW, PERMISSIONS.RECORDS_CREATE],
      },
    }

    // Viewer should have granted permissions in bmc
    expect(
      hasModulePermission('viewer', 'bmc', PERMISSIONS.RECORDS_VIEW, overrides)
    ).toBe(true)

    expect(
      hasModulePermission(
        'viewer',
        'bmc',
        PERMISSIONS.RECORDS_CREATE,
        overrides
      )
    ).toBe(true)

    // But not other permissions
    expect(
      hasModulePermission('viewer', 'bmc', PERMISSIONS.RECORDS_EDIT, overrides)
    ).toBe(false)

    expect(
      hasModulePermission(
        'viewer',
        'bmc',
        PERMISSIONS.RECORDS_DELETE,
        overrides
      )
    ).toBe(false)
  })

  it('specific permissions only grant listed permissions', () => {
    const overrides: ModulePermissions = {
      'bm-pm': {
        permissions: [PERMISSIONS.RECORDS_VIEW],
      },
    }

    // Guest should have only RECORDS_VIEW in pm
    expect(
      hasModulePermission('guest', 'bm-pm', PERMISSIONS.RECORDS_VIEW, overrides)
    ).toBe(true)

    // But not other permissions
    expect(
      hasModulePermission(
        'guest',
        'bm-pm',
        PERMISSIONS.RECORDS_CREATE,
        overrides
      )
    ).toBe(false)
  })

  it('should handle null modulePermissions gracefully', () => {
    expect(
      hasModulePermission('member', 'bm-crm', PERMISSIONS.MODULE_VIEW, null)
    ).toBe(true)

    expect(
      hasModulePermission('member', 'bm-crm', PERMISSIONS.MODULE_ADMIN, null)
    ).toBe(false)
  })

  it('should handle undefined modulePermissions gracefully', () => {
    expect(
      hasModulePermission(
        'member',
        'bm-crm',
        PERMISSIONS.MODULE_VIEW,
        undefined
      )
    ).toBe(true)

    expect(
      hasModulePermission(
        'member',
        'bm-crm',
        PERMISSIONS.MODULE_ADMIN,
        undefined
      )
    ).toBe(false)
  })

  it('should handle empty modulePermissions object', () => {
    const overrides: ModulePermissions = {}

    expect(
      hasModulePermission(
        'member',
        'bm-crm',
        PERMISSIONS.MODULE_VIEW,
        overrides
      )
    ).toBe(true)

    expect(
      hasModulePermission(
        'member',
        'bm-crm',
        PERMISSIONS.MODULE_ADMIN,
        overrides
      )
    ).toBe(false)
  })

  it('should fall back to base role when override has neither role nor permissions', () => {
    const overrides: ModulePermissions = {
      'bm-crm': {}, // Empty override
    }

    // Should fall back to member permissions
    expect(
      hasModulePermission(
        'member',
        'bm-crm',
        PERMISSIONS.MODULE_VIEW,
        overrides
      )
    ).toBe(true)

    expect(
      hasModulePermission(
        'member',
        'bm-crm',
        PERMISSIONS.MODULE_ADMIN,
        overrides
      )
    ).toBe(false)
  })

  it('should handle complex multi-module override scenario', () => {
    const overrides: ModulePermissions = {
      'bm-crm': { role: 'admin' },
      bmc: { permissions: [PERMISSIONS.RECORDS_VIEW] },
      'bm-pm': { role: 'viewer' },
    }

    const member: WorkspaceRole = 'member'

    // CRM: elevated to admin
    expect(
      hasModulePermission(member, 'bm-crm', PERMISSIONS.MODULE_ADMIN, overrides)
    ).toBe(true)

    // Content: specific permission
    expect(
      hasModulePermission(member, 'bmc', PERMISSIONS.RECORDS_VIEW, overrides)
    ).toBe(true)
    expect(
      hasModulePermission(member, 'bmc', PERMISSIONS.RECORDS_CREATE, overrides)
    ).toBe(false)

    // PM: demoted to viewer
    expect(
      hasModulePermission(member, 'bm-pm', PERMISSIONS.RECORDS_CREATE, overrides)
    ).toBe(false)
    expect(
      hasModulePermission(member, 'bm-pm', PERMISSIONS.RECORDS_VIEW, overrides)
    ).toBe(true)

    // Other module: base role
    expect(
      hasModulePermission(
        member,
        'bm-other',
        PERMISSIONS.RECORDS_VIEW,
        overrides
      )
    ).toBe(true)
  })
})

describe('Edge Cases', () => {
  it('should handle permission checks for all defined permissions', () => {
    const allPermissions = Object.values(PERMISSIONS)
    allPermissions.forEach((permission) => {
      const result = hasPermission('owner', permission as Permission)
      expect(typeof result).toBe('boolean')
      expect(result).toBe(true) // Owner has all permissions
    })
  })

  it('should handle all role combinations in canChangeRole', () => {
    const roles: WorkspaceRole[] = ['owner', 'admin', 'member', 'viewer', 'guest']

    roles.forEach((actorRole) => {
      roles.forEach((targetRole) => {
        const result = canChangeRole(actorRole, targetRole)
        expect(typeof result).toBe('boolean')
      })
    })
  })

  it('should handle module permissions with non-existent module ID', () => {
    const overrides: ModulePermissions = {
      'bm-crm': { role: 'admin' },
    }

    expect(
      hasModulePermission(
        'member',
        'non-existent-module',
        PERMISSIONS.MODULE_VIEW,
        overrides
      )
    ).toBe(true)
  })

  it('should handle invalid permissions array in override', () => {
    const overrides: ModulePermissions = {
      'bm-crm': {
        permissions: [] as Permission[], // Empty array
      },
    }

    // Should not grant any permissions with empty array
    expect(
      hasModulePermission(
        'member',
        'bm-crm',
        PERMISSIONS.RECORDS_VIEW,
        overrides
      )
    ).toBe(false) // Not in empty array, falls back to base which has it... actually member has RECORDS_VIEW

    // Test with permission member doesn't have
    expect(
      hasModulePermission(
        'member',
        'bm-crm',
        PERMISSIONS.RECORDS_DELETE,
        overrides
      )
    ).toBe(false)
  })
})
