/**
 * Header Breadcrumbs Component
 *
 * Displays breadcrumb navigation based on current pathname.
 * Hidden on mobile devices (<768px).
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Map route segments to display names
const segmentNames: Record<string, string> = {
  dashboard: 'Dashboard',
  approvals: 'Approvals',
  agents: 'AI Team',
  settings: 'Settings',
  crm: 'CRM',
  projects: 'Projects',
  profile: 'Profile',
};

export function HeaderBreadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const name = segmentNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return { segment, href, name, isLast };
  });

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden md:flex items-center gap-2 text-sm"
    >
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-2">
          {index > 0 && (
            <span
              aria-hidden="true"
              className="material-symbols-rounded text-[rgb(var(--color-text-tertiary))] text-base"
            >
              chevron_right
            </span>
          )}
          {crumb.isLast ? (
            <span
              aria-current="page"
              className="text-[rgb(var(--color-text-primary))] font-medium"
            >
              {crumb.name}
            </span>
          ) : (
            <Link
              className="text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] transition-colors"
              href={crumb.href as never}
            >
              {crumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
