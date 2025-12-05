'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PermissionSelector } from './permission-selector'
import { RoleTemplateSelector } from './role-template-selector'
import { isBuiltInRole } from '@/lib/permissions'
import { type RoleTemplate } from '@/lib/role-templates'

/**
 * Form validation schema
 */
const createRoleSchema = z.object({
  name: z
    .string()
    .min(3, 'Role name must be at least 3 characters')
    .max(50, 'Role name must be under 50 characters')
    .trim()
    .refine((name) => !isBuiltInRole(name), {
      message: 'Cannot use built-in role names (owner, admin, member, viewer, guest)',
    }),
  description: z.string().max(200, 'Description must be under 200 characters').optional(),
  permissions: z
    .array(z.string())
    .min(1, 'At least one permission is required'),
})

type CreateRoleFormData = z.infer<typeof createRoleSchema>

/**
 * Props for CreateRoleModal component
 */
interface CreateRoleModalProps {
  existingRole?: {
    id: string
    name: string
    description: string | null
    permissions: string[]
  }
  onClose?: () => void
}

/**
 * CreateRoleModal Component
 * Story 09-14: Implement Custom Role Creation
 * Story 09-15: Implement Permission Templates
 *
 * Modal for creating or editing custom roles with permission selection.
 * Supports template-based quick setup and custom from-scratch creation.
 */
export function CreateRoleModal({ existingRole, onClose }: CreateRoleModalProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(!!existingRole)
  const [showTemplateSelector, setShowTemplateSelector] = useState(!existingRole)
  const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate | null>(null)
  const isEditMode = !!existingRole

  const workspaceId = (session?.session as { activeWorkspaceId?: string } | undefined)
    ?.activeWorkspaceId

  // Form state
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: existingRole
      ? {
          name: existingRole.name,
          description: existingRole.description || '',
          permissions: existingRole.permissions,
        }
      : {
          name: '',
          description: '',
          permissions: [],
        },
  })

  const selectedPermissions = watch('permissions')

  // Update form when existingRole changes
  useEffect(() => {
    if (existingRole) {
      reset({
        name: existingRole.name,
        description: existingRole.description || '',
        permissions: existingRole.permissions,
      })
      setOpen(true)
      setShowTemplateSelector(false) // Skip template selection in edit mode
    }
  }, [existingRole, reset])

  // Create/update role mutation
  const mutation = useMutation({
    mutationFn: async (data: CreateRoleFormData) => {
      const url = isEditMode
        ? `/api/workspaces/${workspaceId}/roles/${existingRole.id}`
        : `/api/workspaces/${workspaceId}/roles`

      const method = isEditMode ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} role`)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', workspaceId] })
      toast.success(
        isEditMode ? 'Role updated successfully' : 'Role created successfully'
      )
      handleClose()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  /**
   * Handle form submission
   */
  const onSubmit = (data: CreateRoleFormData) => {
    mutation.mutate(data)
  }

  /**
   * Handle modal close
   */
  const handleClose = () => {
    setOpen(false)
    reset()
    setShowTemplateSelector(!existingRole) // Reset to template selector for create mode
    setSelectedTemplate(null)
    if (onClose) {
      onClose()
    }
  }

  /**
   * Handle template selection
   */
  const handleTemplateSelect = (template: RoleTemplate) => {
    setSelectedTemplate(template)
    setValue('name', template.name, { shouldValidate: true })
    setValue('description', template.description, { shouldValidate: true })
    setValue('permissions', template.permissions, { shouldValidate: true })
    setShowTemplateSelector(false)
  }

  /**
   * Handle start from scratch
   */
  const handleStartFromScratch = () => {
    setSelectedTemplate(null)
    setValue('name', '', { shouldValidate: false })
    setValue('description', '', { shouldValidate: false })
    setValue('permissions', [], { shouldValidate: false })
    setShowTemplateSelector(false)
  }

  /**
   * Handle back to template selection
   */
  const handleBackToTemplates = () => {
    setShowTemplateSelector(true)
    setSelectedTemplate(null)
  }

  /**
   * Handle permission change
   */
  const handlePermissionsChange = (permissions: string[]) => {
    setValue('permissions', permissions, { shouldValidate: true })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!existingRole && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Role
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Custom Role' : 'Create Custom Role'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the role name, description, and permissions.'
              : showTemplateSelector
              ? 'Choose a template to get started quickly, or create a custom role from scratch.'
              : selectedTemplate
              ? `Customize the ${selectedTemplate.name} template to fit your needs.`
              : 'Define a custom role with specific permissions for your team members.'}
          </DialogDescription>
        </DialogHeader>

        {/* Template Selection Step */}
        {!isEditMode && showTemplateSelector && (
          <RoleTemplateSelector
            onSelectTemplate={handleTemplateSelect}
            onStartFromScratch={handleStartFromScratch}
            disabled={mutation.isPending}
          />
        )}

        {/* Role Configuration Form */}
        {!showTemplateSelector && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Role Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Role Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Content Manager, Developer"
              {...register('name')}
              disabled={mutation.isPending}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Role Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this role can do..."
              rows={3}
              {...register('description')}
              disabled={mutation.isPending}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <Label>
              Permissions <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-4">
              Select the permissions this role should have
            </p>
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <PermissionSelector
                selectedPermissions={selectedPermissions}
                onChange={handlePermissionsChange}
                disabled={mutation.isPending}
              />
            </div>
            {errors.permissions && (
              <p className="text-sm text-red-600">{errors.permissions.message}</p>
            )}
          </div>

          <DialogFooter>
            {/* Back button (only in create mode, not template selector) */}
            {!isEditMode && !showTemplateSelector && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToTemplates}
                disabled={mutation.isPending}
              >
                Back to Templates
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : isEditMode ? (
                'Update Role'
              ) : (
                'Create Role'
              )}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
