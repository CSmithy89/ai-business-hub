'use client';

/**
 * CopilotKit Page Context Hook - Story DM-01.5
 *
 * Provides current page/navigation context to CopilotKit agents
 * using the useCopilotReadable hook. This enables agents to
 * understand where the user is in the application.
 *
 * @see https://docs.copilotkit.ai/reference/hooks/useCopilotReadable
 * Epic: DM-01 | Story: DM-01.5
 */

import { useMemo } from 'react';
import { useCopilotReadable } from '@copilotkit/react-core';
import { usePathname, useParams, useSearchParams } from 'next/navigation';
import type { PageContext, PageSection } from './types';

/**
 * Maps a pathname to its corresponding page section
 *
 * @param pathname - The current URL pathname
 * @returns The PageSection identifier for the given path
 */
export function getSection(pathname: string): PageSection {
  // PM routes use /dashboard/pm/[slug] pattern
  // Check for specific subpages first, then general project detail
  const pmSlugMatch = pathname.match(/^\/dashboard\/pm\/([^/]+)/);

  if (pmSlugMatch) {
    const slug = pmSlugMatch[1];
    // Skip known non-project routes
    if (slug === 'new' || slug === 'dependencies' || slug === 'portfolio') {
      return 'projects';
    }

    // Tasks section within a project
    if (pathname.includes('/tasks')) {
      return 'tasks';
    }

    // Project detail (with any subpath like /settings, /team, /docs, /workflows)
    return 'project-detail';
  }

  // Projects list/overview (base PM route)
  if (pathname.startsWith('/dashboard/pm')) {
    return 'projects';
  }

  // Knowledge base
  if (pathname.startsWith('/dashboard/kb')) {
    return 'knowledge-base';
  }

  // Settings (any settings page)
  if (pathname.startsWith('/settings')) {
    return 'settings';
  }

  // Onboarding flow
  if (pathname.startsWith('/onboarding')) {
    return 'onboarding';
  }

  // Main dashboard
  if (pathname === '/dashboard' || pathname === '/') {
    return 'dashboard';
  }

  // Fallback for unrecognized paths
  return 'other';
}

/**
 * Provides current page/navigation context to CopilotKit agents.
 *
 * This hook tracks the user's location in the application and shares
 * it with AI agents, enabling them to provide context-aware assistance.
 *
 * Usage: Call in the root dashboard layout to make page context
 * globally available to agents.
 *
 * @example
 * ```tsx
 * // In dashboard layout
 * export default function DashboardLayout({ children }) {
 *   useCopilotPageContext();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useCopilotPageContext(): void {
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();

  // Memoize context and description to prevent unnecessary re-registrations
  const { description, context } = useMemo(() => {
    const section = getSection(pathname ?? '');

    // Convert params to plain object (params from Next.js is a Proxy)
    const paramsObject: Record<string, string> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === 'string') {
          paramsObject[key] = value;
        } else if (Array.isArray(value)) {
          // Handle catch-all routes like [...slug]
          paramsObject[key] = value.join('/');
        }
      }
    }

    // Convert searchParams to plain object
    const searchParamsObject: Record<string, string> = {};
    if (searchParams) {
      searchParams.forEach((value, key) => {
        searchParamsObject[key] = value;
      });
    }

    const ctx: PageContext = {
      pathname: pathname ?? '',
      section,
      params: paramsObject,
      searchParams: searchParamsObject,
    };

    const desc = `Current page context: The user is viewing the "${section}" section at path "${pathname ?? '/'}". This helps you understand what the user is looking at and provide relevant assistance. Use this context when the user refers to "this page", "here", or asks questions about what they're currently viewing.`;

    return { description: desc, context: ctx };
  }, [pathname, params, searchParams]);

  useCopilotReadable({
    description,
    value: context,
  });
}
