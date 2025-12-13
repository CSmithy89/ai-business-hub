/**
 * Sidebar Workspace Switcher Component
 *
 * Displays current workspace with avatar at bottom of sidebar.
 * Integrates with WorkspaceSelector from Epic 02 for switching functionality.
 *
 * Features:
 * - Gradient avatar with workspace initials
 * - Workspace name display (expanded state)
 * - Dropdown indicator (expanded state)
 * - Click opens workspace switcher dropdown
 * - Fetches current workspace from session
 *
 * Epic: 07 - UI Shell
 * Story: 07-2 - Create Sidebar Navigation
 * Updated: Story 16-4 - Clarify Workspace vs Business Relationship
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronsUpDown, Building2 } from 'lucide-react';
import { WorkspaceSelector } from '@/components/workspace/workspace-selector';
import type { WorkspaceWithRole } from '@hyvve/shared';

interface SidebarWorkspaceSwitcherProps {
  /** Whether sidebar is in collapsed state */
  collapsed: boolean;
}

/**
 * Fetches the current workspace from the session
 */
export function SidebarWorkspaceSwitcher({ collapsed }: SidebarWorkspaceSwitcherProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current workspace on mount
  useEffect(() => {
    async function fetchCurrentWorkspace() {
      try {
        const response = await fetch('/api/workspaces');
        const result = await response.json();

        if (result.success && result.data?.length > 0) {
          // For now, use the first workspace as current
          // In the future, we could fetch the activeWorkspaceId from session
          setCurrentWorkspace(result.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch workspace:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCurrentWorkspace();
  }, []);

  // Generate initials from workspace name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = currentWorkspace?.name ? getInitials(currentWorkspace.name) : null;

  // Show loading state
  if (isLoading) {
    if (collapsed) {
      return (
        <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
      );
    }
    return (
      <div className="flex w-full items-center gap-3 rounded-md p-2">
        <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
        <div className="flex-1 h-4 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  // Show placeholder if no workspace
  if (!currentWorkspace) {
    if (collapsed) {
      return (
        <button
          type="button"
          onClick={() => setShowSelector((prev) => !prev)}
          className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground"
          aria-label="Select workspace"
        >
          <Building2 className="h-4 w-4" />
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setShowSelector((prev) => !prev)}
        className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-[rgb(var(--color-bg-tertiary))]"
        aria-label="Select workspace"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="flex-1 text-sm font-medium text-muted-foreground">
          Select workspace
        </span>
        <ChevronsUpDown className="h-4 w-4 text-[rgb(var(--color-text-secondary))]" />
      </button>
    );
  }

  if (collapsed) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowSelector((prev) => !prev)}
          className="h-10 w-10 rounded-md bg-gradient-to-br from-[rgb(var(--color-primary-500))] to-[rgb(var(--color-agent-atlas))] flex items-center justify-center text-sm font-bold text-white transition-opacity hover:opacity-90"
          aria-label="Switch workspace"
        >
          {initials}
        </button>

        {/* Workspace selector dialog - shown when clicked */}
        {showSelector && currentWorkspace && (
          <div className="absolute bottom-16 left-2 z-50">
            <WorkspaceSelector
              currentWorkspaceId={currentWorkspace.id}
              currentWorkspaceName={currentWorkspace.name}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowSelector((prev) => !prev)}
        className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-[rgb(var(--color-bg-tertiary))]"
        aria-label="Switch workspace"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-[rgb(var(--color-primary-500))] to-[rgb(var(--color-agent-atlas))] text-sm font-bold text-white">
          {initials}
        </div>
        <span className="flex-1 text-sm font-medium text-[rgb(var(--color-text-primary))]">
          {currentWorkspace.name}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-[rgb(var(--color-text-secondary))]" />
      </button>

      {/* Workspace selector dialog - shown when clicked */}
      {showSelector && currentWorkspace && (
        <div className="absolute bottom-16 left-4 z-50">
          <WorkspaceSelector
            currentWorkspaceId={currentWorkspace.id}
            currentWorkspaceName={currentWorkspace.name}
          />
        </div>
      )}
    </>
  );
}
