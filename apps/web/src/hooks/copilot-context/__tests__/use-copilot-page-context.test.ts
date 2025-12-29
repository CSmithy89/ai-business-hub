/**
 * Unit Tests for useCopilotPageContext Hook - Story DM-01.5
 *
 * Tests the page context hook that provides navigation context to CopilotKit agents.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock Next.js navigation hooks
const mockUsePathname = vi.fn();
const mockUseParams = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useParams: () => mockUseParams(),
  useSearchParams: () => mockUseSearchParams(),
}));

// Mock CopilotKit
const mockUseCopilotReadable = vi.fn();

vi.mock('@copilotkit/react-core', () => ({
  useCopilotReadable: (options: { description: string; value: unknown }) => {
    mockUseCopilotReadable(options);
  },
}));

// Import the functions to test AFTER mocks are set up
import {
  useCopilotPageContext,
  getSection,
} from '../use-copilot-page-context';

describe('getSection', () => {
  it('identifies dashboard section correctly', () => {
    expect(getSection('/dashboard')).toBe('dashboard');
    expect(getSection('/')).toBe('dashboard');
  });

  it('identifies project detail section correctly', () => {
    expect(getSection('/dashboard/pm/projects/my-project')).toBe(
      'project-detail'
    );
    expect(getSection('/dashboard/pm/projects/test-slug/tasks')).toBe(
      'project-detail'
    );
    expect(getSection('/dashboard/pm/projects/abc123/overview')).toBe(
      'project-detail'
    );
  });

  it('identifies tasks section correctly', () => {
    expect(getSection('/dashboard/pm/tasks')).toBe('tasks');
    expect(getSection('/dashboard/pm/tasks/create')).toBe('tasks');
  });

  it('identifies projects section correctly', () => {
    expect(getSection('/dashboard/pm')).toBe('projects');
    expect(getSection('/dashboard/pm/create')).toBe('projects');
  });

  it('identifies knowledge-base section correctly', () => {
    expect(getSection('/dashboard/kb')).toBe('knowledge-base');
    expect(getSection('/dashboard/kb/pages')).toBe('knowledge-base');
    expect(getSection('/dashboard/kb/pages/my-page')).toBe('knowledge-base');
  });

  it('identifies settings section correctly', () => {
    expect(getSection('/settings')).toBe('settings');
    expect(getSection('/settings/profile')).toBe('settings');
    expect(getSection('/settings/api-keys')).toBe('settings');
  });

  it('identifies onboarding section correctly', () => {
    expect(getSection('/onboarding')).toBe('onboarding');
    expect(getSection('/onboarding/step-1')).toBe('onboarding');
  });

  it('returns other for unrecognized paths', () => {
    expect(getSection('/unknown')).toBe('other');
    expect(getSection('/some/random/path')).toBe('other');
  });
});

describe('useCopilotPageContext', () => {
  // Create a mock SearchParams object with forEach
  const createMockSearchParams = (
    params: Record<string, string> = {}
  ) => {
    const map = new Map(Object.entries(params));
    return {
      forEach: (
        callback: (value: string, key: string) => void
      ) => {
        map.forEach((value, key) => callback(value, key));
      },
      get: (key: string) => map.get(key) ?? null,
      has: (key: string) => map.has(key),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock values
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseParams.mockReturnValue({});
    mockUseSearchParams.mockReturnValue(createMockSearchParams());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('provides page context to CopilotKit', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    renderHook(() => useCopilotPageContext());

    expect(mockUseCopilotReadable).toHaveBeenCalledTimes(1);
    const call = mockUseCopilotReadable.mock.calls[0][0];

    expect(call.value).toEqual({
      pathname: '/dashboard',
      section: 'dashboard',
      params: {},
      searchParams: {},
    });
    expect(call.description).toContain('dashboard');
  });

  it('extracts params correctly', () => {
    mockUsePathname.mockReturnValue('/dashboard/pm/projects/my-project');
    mockUseParams.mockReturnValue({ slug: 'my-project' });

    renderHook(() => useCopilotPageContext());

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value.params).toEqual({ slug: 'my-project' });
    expect(call.value.section).toBe('project-detail');
  });

  it('handles array params (catch-all routes)', () => {
    mockUsePathname.mockReturnValue('/dashboard/kb/pages/deep/nested/page');
    mockUseParams.mockReturnValue({ path: ['deep', 'nested', 'page'] });

    renderHook(() => useCopilotPageContext());

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value.params).toEqual({ path: 'deep/nested/page' });
  });

  it('extracts searchParams correctly', () => {
    mockUsePathname.mockReturnValue('/dashboard/pm/tasks');
    mockUseSearchParams.mockReturnValue(
      createMockSearchParams({ view: 'kanban', filter: 'active' })
    );

    renderHook(() => useCopilotPageContext());

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value.searchParams).toEqual({
      view: 'kanban',
      filter: 'active',
    });
  });

  it('includes section in description', () => {
    mockUsePathname.mockReturnValue('/settings/profile');

    renderHook(() => useCopilotPageContext());

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.description).toContain('settings');
    expect(call.description).toContain('/settings/profile');
  });

  it('handles empty params', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseParams.mockReturnValue(null);

    renderHook(() => useCopilotPageContext());

    const call = mockUseCopilotReadable.mock.calls[0][0];
    expect(call.value.params).toEqual({});
  });
});
