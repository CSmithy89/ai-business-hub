'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, Loader2, Building2, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useWorkspace } from '@/hooks/use-workspace'
import type { WorkspaceWithRole } from '@hyvve/shared'

interface WorkspaceSelectorProps {
  /** Current workspace ID from session */
  currentWorkspaceId: string | null
  /** Current workspace name for display */
  currentWorkspaceName?: string
  /** Callback when user wants to create new workspace */
  onCreateWorkspace?: () => void
}

/**
 * Workspace selector dropdown component
 * Displays current workspace and allows switching between workspaces
 */
export function WorkspaceSelector({
  currentWorkspaceId,
  currentWorkspaceName,
  onCreateWorkspace,
}: WorkspaceSelectorProps) {
  const { fetchWorkspaces, switchWorkspace, isSwitching } = useWorkspace()
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch workspaces when dropdown opens
  useEffect(() => {
    if (isOpen && workspaces.length === 0) {
      setIsLoading(true)
      fetchWorkspaces()
        .then(setWorkspaces)
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, workspaces.length, fetchWorkspaces])

  // Get current workspace display name
  const displayName = currentWorkspaceName || 'Select Workspace'

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Format role for display
  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  // Get role badge variant
  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  async function handleSelect(workspace: WorkspaceWithRole) {
    if (workspace.id === currentWorkspaceId) {
      setIsOpen(false)
      return
    }

    await switchWorkspace(workspace.id)
    setIsOpen(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Workspace</label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Workspace help"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">What&apos;s a Workspace?</p>
              <p className="text-xs">
                Your workspace is your team&apos;s container. It holds your businesses, team members, and AI configuration.
              </p>
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium mb-1">Structure:</p>
                <p className="text-xs text-muted-foreground">
                  Workspace → Businesses → Workflows
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
            disabled={isSwitching}
          >
            <div className="flex items-center gap-2 truncate">
              {isSwitching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {currentWorkspaceName ? getInitials(currentWorkspaceName) : <Building2 className="h-3 w-3" />}
                </div>
              )}
              <span className="truncate">{isSwitching ? 'Switching...' : displayName}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="start">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No workspaces found
          </div>
        ) : (
          <>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleSelect(workspace)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0">
                    {getInitials(workspace.name)}
                  </div>
                  <div className="flex-1 truncate">
                    <span className="truncate">{workspace.name}</span>
                  </div>
                  <Badge variant={getRoleBadgeVariant(workspace.role)} className="ml-auto">
                    {formatRole(workspace.role)}
                  </Badge>
                  {workspace.id === currentWorkspaceId && (
                    <Check className="h-4 w-4 shrink-0" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {onCreateWorkspace && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setIsOpen(false)
                onCreateWorkspace()
              }}
              className="cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create new workspace
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  )
}
