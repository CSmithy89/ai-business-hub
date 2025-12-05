'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Pencil, Trash2, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { CreateRoleModal } from './create-role-modal'

/**
 * Role data structure
 */
interface Role {
  id: string
  name: string
  description: string | null
  permissions: string[]
  isBuiltIn: boolean
  createdAt: string | null
  updatedAt: string | null
}

interface RolesResponse {
  success: boolean
  data: {
    builtInRoles: Role[]
    customRoles: Role[]
  }
}

/**
 * RolesList Component
 * Story 09-14: Implement Custom Role Creation
 *
 * Displays all workspace roles (built-in + custom) with management actions.
 */
export function RolesList() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null)

  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)
    ?.activeWorkspaceId

  // Fetch roles
  const { data, isLoading, error } = useQuery<RolesResponse>({
    queryKey: ['roles', workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/roles`)
      if (!response.ok) {
        throw new Error('Failed to fetch roles')
      }
      return response.json()
    },
    enabled: !!workspaceId,
  })

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/roles/${roleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete role')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', workspaceId] })
      toast.success('Role deleted successfully')
      setRoleToDelete(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-gray-500">Loading roles...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center text-red-600">
            Failed to load roles. Please try again.
          </div>
        </CardContent>
      </Card>
    )
  }

  const { builtInRoles = [], customRoles = [] } = data?.data || {}

  return (
    <>
      <div className="space-y-4">
        {/* Built-in Roles Section */}
        {builtInRoles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Built-in Roles</h4>
            <div className="grid gap-4 md:grid-cols-2">
              {builtInRoles.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-gray-500" />
                        <CardTitle className="capitalize">{role.name}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        Built-in
                      </Badge>
                    </div>
                    {role.description && (
                      <CardDescription>{role.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{role.permissions.length}</span> permissions
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Custom Roles Section */}
        {customRoles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Roles</h4>
            <div className="grid gap-4 md:grid-cols-2">
              {customRoles.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-[#FF6B6B]" />
                        <CardTitle>{role.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="ml-2 border-[#FF6B6B] text-[#FF6B6B]">
                        Custom
                      </Badge>
                    </div>
                    {role.description && (
                      <CardDescription>{role.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{role.permissions.length}</span> permissions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRoleToEdit(role)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRoleToDelete(role)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {customRoles.length === 0 && (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No custom roles yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create custom roles to define specific permissions for your team members
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.name}"? This action
              cannot be undone. Make sure no members are assigned to this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roleToDelete && deleteMutation.mutate(roleToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Role'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Role Modal */}
      {roleToEdit && (
        <CreateRoleModal
          existingRole={roleToEdit}
          onClose={() => setRoleToEdit(null)}
        />
      )}
    </>
  )
}
