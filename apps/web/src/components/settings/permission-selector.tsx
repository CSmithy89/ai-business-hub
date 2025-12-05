'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { PERMISSION_CATEGORIES } from '@/lib/permissions'

/**
 * Props for PermissionSelector component
 */
interface PermissionSelectorProps {
  selectedPermissions: string[]
  onChange: (permissions: string[]) => void
  disabled?: boolean
}

/**
 * PermissionSelector Component
 * Story 09-14: Implement Custom Role Creation
 *
 * Displays permission checkboxes grouped by category.
 * Allows users to select multiple permissions for custom roles.
 */
export function PermissionSelector({
  selectedPermissions,
  onChange,
  disabled = false,
}: PermissionSelectorProps) {
  /**
   * Toggle a single permission
   */
  const handleTogglePermission = (permissionId: string) => {
    const isSelected = selectedPermissions.includes(permissionId)

    if (isSelected) {
      // Remove permission
      onChange(selectedPermissions.filter((p) => p !== permissionId))
    } else {
      // Add permission
      onChange([...selectedPermissions, permissionId])
    }
  }

  /**
   * Toggle all permissions in a category
   */
  const handleToggleCategory = (categoryPermissions: string[]) => {
    const allSelected = categoryPermissions.every((p) =>
      selectedPermissions.includes(p)
    )

    if (allSelected) {
      // Remove all category permissions
      onChange(
        selectedPermissions.filter((p) => !categoryPermissions.includes(p))
      )
    } else {
      // Add all category permissions
      const newPermissions = [...selectedPermissions]
      categoryPermissions.forEach((p) => {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p)
        }
      })
      onChange(newPermissions)
    }
  }

  /**
   * Check if all permissions in a category are selected
   */
  const isCategoryFullySelected = (categoryPermissions: string[]) => {
    return categoryPermissions.every((p) => selectedPermissions.includes(p))
  }

  /**
   * Check if some (but not all) permissions in a category are selected
   */
  const isCategoryPartiallySelected = (categoryPermissions: string[]) => {
    const selected = categoryPermissions.filter((p) =>
      selectedPermissions.includes(p)
    )
    return selected.length > 0 && selected.length < categoryPermissions.length
  }

  return (
    <div className="space-y-6">
      {PERMISSION_CATEGORIES.map((category) => {
        const categoryPermissionIds = category.permissions.map((p) => p.id)
        const isFullySelected = isCategoryFullySelected(categoryPermissionIds)
        const isPartiallySelected = isCategoryPartiallySelected(categoryPermissionIds)

        return (
          <div key={category.id} className="space-y-3">
            {/* Category Header with Select All */}
            <div className="flex items-start gap-3 pb-2 border-b">
              <Checkbox
                id={`category-${category.id}`}
                checked={isFullySelected}
                onCheckedChange={() => handleToggleCategory(categoryPermissionIds)}
                disabled={disabled}
                className={isPartiallySelected ? 'data-[state=checked]:bg-gray-400' : ''}
              />
              <div className="flex-1">
                <Label
                  htmlFor={`category-${category.id}`}
                  className="text-sm font-semibold text-gray-900 cursor-pointer"
                >
                  {category.label}
                </Label>
                <p className="text-xs text-gray-600 mt-0.5">
                  {category.description}
                </p>
              </div>
            </div>

            {/* Individual Permissions */}
            <div className="space-y-2 pl-6">
              {category.permissions.map((permission) => (
                <div key={permission.id} className="flex items-start gap-3">
                  <Checkbox
                    id={permission.id}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={() => handleTogglePermission(permission.id)}
                    disabled={disabled}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={permission.id}
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      {permission.label}
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {permission.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Summary */}
      {selectedPermissions.length > 0 && (
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">
              {selectedPermissions.length}
            </span>{' '}
            permission{selectedPermissions.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  )
}
