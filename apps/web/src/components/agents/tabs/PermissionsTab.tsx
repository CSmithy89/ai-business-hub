'use client'

import { useState } from 'react'
import type { Agent } from '@hyvve/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle2, XCircle, Database, Settings, AlertTriangle } from 'lucide-react'

interface PermissionsTabProps {
  agent: Agent
  isEditing: boolean
}

/**
 * PermissionsTab Component
 *
 * Displays and allows editing of agent permissions and data access.
 */
export function PermissionsTab({ agent, isEditing }: PermissionsTabProps) {
  const [permissions, setPermissions] = useState(agent.permissions)

  // Module access configuration
  const modules = [
    { id: 'crm', name: 'CRM', description: 'Access to customer and contact data' },
    { id: 'content', name: 'Content', description: 'Access to content library and generation' },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Access to reports and analytics data',
    },
    { id: 'finance', name: 'Finance', description: 'Access to financial data and transactions' },
  ]

  const toggleModuleAccess = (moduleId: string) => {
    if (!isEditing) return

    const newDataAccess = permissions.dataAccess.includes(moduleId)
      ? permissions.dataAccess.filter(m => m !== moduleId)
      : [...permissions.dataAccess, moduleId]

    setPermissions({ ...permissions, dataAccess: newDataAccess })
  }

  // Permission matrix for display
  const permissionMatrix = [
    {
      resource: 'CRM Data',
      read: permissions.dataAccess.includes('crm'),
      write: permissions.dataAccess.includes('crm') && permissions.canExecuteActions,
      delete: false,
    },
    {
      resource: 'Content Library',
      read: permissions.dataAccess.includes('content'),
      write: permissions.dataAccess.includes('content') && permissions.canExecuteActions,
      delete: false,
    },
    {
      resource: 'Analytics',
      read: permissions.dataAccess.includes('analytics'),
      write: false,
      delete: false,
    },
    {
      resource: 'Financial Data',
      read: permissions.dataAccess.includes('finance'),
      write: permissions.dataAccess.includes('finance') && permissions.canExecuteActions,
      delete: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Data Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle className="text-lg">Data Access</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.map(module => (
            <div
              key={module.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`module-${module.id}`} className="font-medium">
                    {module.name}
                  </Label>
                  {permissions.dataAccess.includes(module.id) && (
                    <Badge variant="secondary" className="text-xs">
                      Enabled
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </div>
              <Switch
                id={`module-${module.id}`}
                checked={permissions.dataAccess.includes(module.id)}
                onCheckedChange={() => toggleModuleAccess(module.id)}
                disabled={!isEditing}
              />
            </div>
          ))}

          {permissions.dataAccess.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span>At least one module must be enabled</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle className="text-lg">Action Permissions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex-1">
              <Label htmlFor="can-execute" className="font-medium">
                Can Execute Actions
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow this agent to perform actions and make changes
              </p>
            </div>
            <Switch
              id="can-execute"
              checked={permissions.canExecuteActions}
              onCheckedChange={(checked: boolean) =>
                setPermissions({ ...permissions, canExecuteActions: checked })
              }
              disabled={!isEditing || agent.team === 'orchestrator'}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex-1">
              <Label htmlFor="requires-approval" className="font-medium">
                Requires Approval
              </Label>
              <p className="text-sm text-muted-foreground">
                All actions must be approved before execution
              </p>
            </div>
            <Switch
              id="requires-approval"
              checked={permissions.requiresApproval}
              onCheckedChange={(checked: boolean) =>
                setPermissions({ ...permissions, requiresApproval: checked })
              }
              disabled={!isEditing}
            />
          </div>

          {agent.team === 'orchestrator' && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
              <AlertTriangle className="h-4 w-4" />
              <span>Orchestrator agents must have execution permissions enabled</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Permission Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead className="text-center">Read</TableHead>
                  <TableHead className="text-center">Write</TableHead>
                  <TableHead className="text-center">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionMatrix.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.resource}</TableCell>
                    <TableCell className="text-center">
                      {row.read ? (
                        <CheckCircle2 className="inline h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="inline h-5 w-5 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.write ? (
                        <CheckCircle2 className="inline h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="inline h-5 w-5 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.delete ? (
                        <CheckCircle2 className="inline h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="inline h-5 w-5 text-gray-400" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
