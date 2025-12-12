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
 *
 * Epic: 07 - UI Shell
 * Story: 07-2 - Create Sidebar Navigation
 */

'use client';

import { useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { WorkspaceSelector } from '@/components/workspace/workspace-selector';

interface SidebarWorkspaceSwitcherProps {
  /** Whether sidebar is in collapsed state */
  collapsed: boolean;
}

/**
 * For this implementation, we'll use a simplified approach:
 * - Display a mock workspace (in production, this would come from session/context)
 * - Use WorkspaceSelector component in a modal/dialog pattern
 *
 * TODO: Integrate with actual session workspace data when Epic 02 context is available
 */
export function SidebarWorkspaceSwitcher({ collapsed }: SidebarWorkspaceSwitcherProps) {
  const [showSelector, setShowSelector] = useState(false);

  // Mock workspace data - in production, this would come from session or context
  const currentWorkspace = {
    id: 'mock-workspace-id',
    name: 'Acme Corp',
  };

  // Generate initials from workspace name
  const initials = currentWorkspace.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
        {showSelector && (
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
      {showSelector && (
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
