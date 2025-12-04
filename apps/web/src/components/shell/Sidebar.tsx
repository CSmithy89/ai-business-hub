/**
 * Sidebar Component (Placeholder)
 *
 * This is a placeholder for the full Sidebar implementation in Story 07.2.
 * Currently shows a basic sidebar with collapse/expand functionality.
 */

'use client';

import { useUIStore } from '@/stores/ui';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={`
        fixed top-[60px] left-0 bottom-0 z-20 flex flex-col
        border-r border-[rgb(var(--color-border-default))]
        bg-[rgb(var(--color-bg-secondary))] p-3
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Sidebar content placeholder */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-[rgb(var(--color-text-secondary))] text-center">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="text-xl">☰</div>
            </div>
          ) : (
            <>
              Sidebar placeholder
              <br />
              Story 07.2
            </>
          )}
        </div>
      </div>

      {/* Collapse/Expand toggle button */}
      <button
        onClick={toggleSidebar}
        className="mt-auto flex h-9 w-full items-center justify-center rounded-md
                   text-[rgb(var(--color-text-secondary))]
                   transition-colors duration-150
                   hover:bg-[rgb(var(--color-bg-hover))]"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="text-lg">
          {sidebarCollapsed ? '→' : '←'}
        </span>
      </button>
    </aside>
  );
}
