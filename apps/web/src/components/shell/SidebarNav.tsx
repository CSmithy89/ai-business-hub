/**
 * Sidebar Navigation Component
 *
 * Contains all navigation items organized in sections:
 * - Main section: Dashboard, Approvals, AI Team, Settings
 * - Modules section: CRM, Projects
 *
 * Epic: 07 - UI Shell
 * Story: 07-2 - Create Sidebar Navigation
 */

'use client';

import { SidebarSection } from './SidebarSection';
import { SidebarNavItem } from './SidebarNavItem';
import { useApprovalCount } from '@/hooks/use-approval-count';

interface SidebarNavProps {
  /** Whether sidebar is in collapsed state */
  collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  // Fetch approval count for badge
  const approvalCount = useApprovalCount();

  return (
    <nav className="flex-1 overflow-y-auto p-4 pt-8">
      {/* Main Section */}
      <SidebarSection title="Main" collapsed={collapsed}>
        <SidebarNavItem
          icon="grid_view"
          label="Dashboard"
          href="/dashboard"
          collapsed={collapsed}
        />
        <SidebarNavItem
          icon="check_circle"
          label="Approvals"
          href="/dashboard/approvals"
          badge={approvalCount}
          collapsed={collapsed}
        />
        <SidebarNavItem
          icon="smart_toy"
          label="AI Team"
          href="/dashboard/agents"
          collapsed={collapsed}
        />
        <SidebarNavItem
          icon="settings"
          label="Settings"
          href="/dashboard/settings"
          collapsed={collapsed}
        />
      </SidebarSection>

      {/* Modules Section */}
      <SidebarSection title="Modules" collapsed={collapsed}>
        <SidebarNavItem
          icon="group"
          label="CRM"
          href="/dashboard/crm"
          statusDot="secondary"
          collapsed={collapsed}
        />
        <SidebarNavItem
          icon="folder_open"
          label="Projects"
          href="/dashboard/projects"
          statusDot="atlas"
          collapsed={collapsed}
        />
      </SidebarSection>
    </nav>
  );
}
