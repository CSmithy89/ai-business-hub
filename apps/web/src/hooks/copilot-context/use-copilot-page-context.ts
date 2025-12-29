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
  // Project detail pages (must check before general projects)
  if (pathname.startsWith('/dashboard/pm/projects/')) {
    return 'project-detail';
  }

  // Tasks section
  if (pathname.startsWith('/dashboard/pm/tasks')) {
    return 'tasks';
  }

  // Projects list/overview
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

  const section = getSection(pathname);

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
  searchParams.forEach((value, key) => {
    searchParamsObject[key] = value;
  });

  const context: PageContext = {
    pathname,
    section,
    params: paramsObject,
    searchParams: searchParamsObject,
  };

  useCopilotReadable({
    description: `Current page context: The user is viewing the "${section}" section at path "${pathname}". This helps you understand what the user is looking at and provide relevant assistance. Use this context when the user refers to "this page", "here", or asks questions about what they're currently viewing.`,
    value: context,
  });
}
