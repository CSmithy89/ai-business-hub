/**
 * Header Breadcrumbs Component
 *
 * Displays breadcrumb navigation based on current pathname.
 * Shows all levels on desktop, last 2 levels on mobile.
 *
 * Story: 16-23 - Implement Breadcrumb Polish
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// Map route segments to display names (properly capitalized)
const segmentNames: Record<string, string> = {
  dashboard: 'Dashboard',
  approvals: 'Approvals',
  agents: 'AI Team',
  settings: 'Settings',
  crm: 'CRM',
  projects: 'Projects',
  pm: 'Projects', // Project Management section
  kb: 'Knowledge Base',
  profile: 'Profile',
  security: 'Security',
  sessions: 'Sessions',
  appearance: 'Appearance',
  'ai-config': 'AI Configuration',
  providers: 'AI Providers',
  'agent-preferences': 'Agent Preferences',
  usage: 'Token Usage',
  members: 'Members',
  roles: 'Roles',
  general: 'General',
  businesses: 'Businesses',
  planning: 'Planning',
  branding: 'Branding',
  validation: 'Validation',
  new: 'New',
  help: 'Help',
};

// Format segment name with proper capitalization
function formatSegmentName(segment: string): string {
  // Check for known segment names
  if (segmentNames[segment]) {
    return segmentNames[segment];
  }

  // Handle kebab-case to Title Case
  return segment
    .split('-')
    .map((word) => {
      // Handle special cases like AI, CRM, PM, KB, etc.
      const upperWords = ['ai', 'crm', 'api', 'ui', 'ux', 'pm', 'kb', 'id', 'qa'];
      if (upperWords.includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Max characters before truncation
const MAX_BREADCRUMB_LENGTH = 20;

function truncateName(name: string): string {
  if (name.length <= MAX_BREADCRUMB_LENGTH) {
    return name;
  }
  return name.slice(0, MAX_BREADCRUMB_LENGTH - 3) + '...';
}

export function HeaderBreadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  // Guard against null/undefined pathname during certain lifecycle moments
  const segments = (pathname ?? '').split('/').filter(Boolean);

  // Build breadcrumbs array with Dashboard as first item
  const breadcrumbs = [
    { segment: 'home', href: '/dashboard', name: 'Home', isLast: segments.length === 0 },
    ...segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const name = formatSegmentName(segment);
      const isLast = index === segments.length - 1;

      return { segment, href, name, isLast };
    }),
  ];

  // For mobile: show only last 2 levels (excluding home if there are more)
  const mobileBreadcrumbs = breadcrumbs.length > 2
    ? breadcrumbs.slice(-2)
    : breadcrumbs;

  if (breadcrumbs.length === 1) {
    // Only home, don't show breadcrumbs
    return null;
  }

  return (
    <>
      {/* Desktop: Full breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="hidden md:flex items-center gap-2 text-sm"
      >
        {breadcrumbs.map((crumb, index) => (
          <div key={`${crumb.segment}:${crumb.href}`} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight
                className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]"
                aria-hidden="true"
              />
            )}
            {crumb.isLast ? (
              <span
                aria-current="page"
                className="text-[rgb(var(--color-text-primary))] font-medium truncate max-w-[200px]"
                title={crumb.name}
              >
                {truncateName(crumb.name)}
              </span>
            ) : crumb.segment === 'home' ? (
              <Link
                className="text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] transition-colors"
                href={crumb.href as never}
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                className={cn(
                  'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] transition-colors',
                  'truncate max-w-[150px]'
                )}
                href={crumb.href as never}
                title={crumb.name}
              >
                {truncateName(crumb.name)}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Mobile: Last 2 levels only */}
      <nav
        aria-label="Breadcrumb"
        className="flex md:hidden items-center gap-1.5 text-sm"
      >
        {mobileBreadcrumbs.map((crumb, index) => (
          <div key={`${crumb.segment}:${crumb.href}`} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight
                className="h-3.5 w-3.5 text-[rgb(var(--color-text-tertiary))]"
                aria-hidden="true"
              />
            )}
            {crumb.isLast ? (
              <span
                aria-current="page"
                className="text-[rgb(var(--color-text-primary))] font-medium truncate max-w-[120px]"
                title={crumb.name}
              >
                {truncateName(crumb.name)}
              </span>
            ) : (
              <Link
                className="text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] transition-colors truncate max-w-[100px]"
                href={crumb.href as never}
                title={crumb.name}
              >
                {truncateName(crumb.name)}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </>
  );
}
