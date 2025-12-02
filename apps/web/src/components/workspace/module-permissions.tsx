'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, AlertCircle, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ModulePermissions } from '@hyvve/shared'

interface ModulePermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberName: string
  memberRole: string
  currentOverrides: ModulePermissions | null
  onSave: (overrides: ModulePermissions) => Promise<void>
}

/**
 * Available modules in the system
 * In production, this would be fetched from installed modules
 */
const AVAILABLE_MODULES = [
  { id: 'bm-crm', name: 'CRM', description: 'Customer Relationship Management' },
  {
    id: 'bmc',
    name: 'Content Management',
    description: 'Content creation and publishing',
  },
  {
    id: 'bm-brand',
    name: 'Brand Management',
    description: 'Brand assets and identity',
  },
  {
    id: 'bm-pm',
    name: 'Project Management',
    description: 'Project tracking and collaboration',
  },
]

/**
 * Dialog component for managing member module permissions
 *
 * Allows admins to grant module-specific permission overrides to members.
 * Supports role elevation pattern for MVP (specific permissions can be added later).
 */
export function ModulePermissionsDialog({
  open,
  onOpenChange,
  memberName,
  memberRole,
  currentOverrides,
  onSave,
}: ModulePermissionsDialogProps) {
  const [overrides, setOverrides] = useState<ModulePermissions>(
    currentOverrides || {}
  )
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member' | 'viewer'>(
    'admin'
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Add a new module override
   */
  const handleAddOverride = () => {
    if (!selectedModule) return

    setOverrides({
      ...overrides,
      [selectedModule]: { role: selectedRole },
    })
    setSelectedModule('')
    setError(null)
  }

  /**
   * Remove a module override
   */
  const handleRemoveOverride = (moduleId: string) => {
    const newOverrides = { ...overrides }
    delete newOverrides[moduleId]
    setOverrides(newOverrides)
    setError(null)
  }

  /**
   * Save changes and close dialog
   */
  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      await onSave(overrides)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to save module permissions:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save module permissions. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  /**
   * Cancel and revert changes
   */
  const handleCancel = () => {
    setOverrides(currentOverrides || {})
    setError(null)
    onOpenChange(false)
  }

  /**
   * Get module info by ID
   */
  const getModuleInfo = (moduleId: string) => {
    return (
      AVAILABLE_MODULES.find((m) => m.id === moduleId) || {
        id: moduleId,
        name: moduleId,
        description: 'Unknown module',
      }
    )
  }

  /**
   * Get available modules (not yet overridden)
   */
  const availableModules = AVAILABLE_MODULES.filter((m) => !overrides[m.id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Module Permissions for {memberName}</DialogTitle>
          <DialogDescription>
            Grant elevated permissions for specific modules without changing the
            member&apos;s global role.
          </DialogDescription>
          <div className="mt-2">
            <span className="text-sm text-muted-foreground">Base role: </span>
            <Badge variant="secondary">{memberRole}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Overrides */}
          <div>
            <Label className="text-base font-semibold">Current Module Overrides</Label>
            {Object.keys(overrides).length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                No module overrides. This member uses their base role in all modules.
              </p>
            ) : (
              <div className="space-y-2 mt-3">
                {Object.entries(overrides).map(([moduleId, override]) => {
                  const moduleInfo = getModuleInfo(moduleId)
                  return (
                    <div
                      key={moduleId}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{moduleInfo.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {override.role ? (
                            <>
                              Role: <Badge variant="outline">{override.role}</Badge>
                            </>
                          ) : (
                            <>
                              Permissions:{' '}
                              {override.permissions?.length || 0} granted
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOverride(moduleId)}
                        aria-label={`Remove override for ${moduleInfo.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Add Override Section */}
          {availableModules.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Add Module Override</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <Label htmlFor="module" className="text-sm">
                    Module
                  </Label>
                  <Select
                    value={selectedModule}
                    onValueChange={setSelectedModule}
                  >
                    <SelectTrigger id="module" className="mt-1.5">
                      <SelectValue placeholder="Select a module" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{module.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {module.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="role" className="text-sm">
                    Elevated Role
                  </Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(v) => setSelectedRole(v as any)}
                  >
                    <SelectTrigger id="role" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex flex-col">
                          <span className="font-medium">Admin</span>
                          <span className="text-xs text-muted-foreground">
                            Full module access
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="member">
                        <div className="flex flex-col">
                          <span className="font-medium">Member</span>
                          <span className="text-xs text-muted-foreground">
                            Standard module access
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex flex-col">
                          <span className="font-medium">Viewer</span>
                          <span className="text-xs text-muted-foreground">
                            Read-only module access
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleAddOverride}
                className="mt-3"
                disabled={!selectedModule}
                size="sm"
              >
                Add Override
              </Button>
            </div>
          )}

          {/* Permission Precedence Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Permission Resolution Order:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Check if base role has the permission</li>
                <li>If module override exists, apply elevated role&apos;s permissions</li>
                <li>Fall back to base role if no override for that module</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
