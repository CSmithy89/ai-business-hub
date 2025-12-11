/**
 * Sidebar Navigation Component
 *
 * Contains all navigation items organized in sections:
 * - Main section: Dashboard, Approvals, AI Team, Settings
 * - Businesses section: Portfolio, Planning, Branding, Validation (collapsible)
 * - Modules section: CRM, Projects
 *
 * Epic: 07 - UI Shell
 * Story: 07-2 - Create Sidebar Navigation
 * Updated: Story 15.1 - Replace Material Icons with Lucide
 * Updated: Story 15.11 - Add Businesses collapsible navigation
 */

'use client';

import {
  LayoutGrid,
  CheckCircle,
  Bot,
  Settings,
  Users,
  FolderOpen,
  Building2,
  ClipboardList,
  Palette,
  CheckSquare,
} from 'lucide-react';
import { SidebarSection } from './SidebarSection';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarNavGroup } from './SidebarNavGroup';
import { SidebarNavSubItem } from './SidebarNavSubItem';
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
          icon={LayoutGrid}
          label="Dashboard"
          href="/dashboard"
          collapsed={collapsed}
        />
        <SidebarNavItem
          icon={CheckCircle}
          label="Approvals"
          href="/approvals"
          badge={approvalCount}
          collapsed={collapsed}
        />
        <SidebarNavItem
          icon={Bot}
          label="AI Team"
          href="/agents"
          collapsed={collapsed}
        />
        <SidebarNavItem
          icon={Settings}
          label="Settings"
          href="/settings"
          collapsed={collapsed}
        />
      </SidebarSection>

      {/* Businesses Section */}
      <SidebarSection title="Businesses" collapsed={collapsed}>
        <SidebarNavGroup
          icon={Building2}
          label="Businesses"
          baseHref="/businesses"
          collapsed={collapsed}
        >
          <SidebarNavSubItem
            icon={LayoutGrid}
            label="Portfolio"
            href="/businesses"
            inTooltip={collapsed}
          />
          <SidebarNavSubItem
            icon={ClipboardList}
            label="Planning"
            href="/businesses/planning"
            inTooltip={collapsed}
          />
          <SidebarNavSubItem
            icon={Palette}
            label="Branding"
            href="/businesses/branding"
            inTooltip={collapsed}
          />
          <SidebarNavSubItem
            icon={CheckSquare}
            label="Validation"
            href="/businesses/validation"
            inTooltip={collapsed}
          />
        </SidebarNavGroup>
      </SidebarSection>

      {/* Modules Section */}
      <SidebarSection title="Modules" collapsed={collapsed}>
        <SidebarNavItem
          icon={Users}
          label="CRM"
          href="/crm"
          statusDot="secondary"
          collapsed={collapsed}
        />
        <SidebarNavItem
          icon={FolderOpen}
          label="Projects"
          href="/projects"
          statusDot="atlas"
          collapsed={collapsed}
        />
      </SidebarSection>
    </nav>
  );
}
