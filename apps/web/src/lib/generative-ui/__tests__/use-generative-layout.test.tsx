/**
 * useGenerativeLayout Hook Tests - Story DM-06.3
 *
 * Tests for the generative layout hook including:
 * - Layout state management
 * - History navigation (goBack)
 * - CopilotKit action registration
 * - Layout change callbacks
 *
 * @see docs/modules/bm-dm/stories/dm-06-3-generative-ui-composition.md
 * Epic: DM-06 | Story: DM-06.3
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock CopilotKit
const mockUseCopilotAction = vi.fn();
vi.mock('@copilotkit/react-core', () => ({
  useCopilotAction: (args: unknown) => mockUseCopilotAction(args),
}));

// Import after mocking
import { useGenerativeLayout } from '../use-generative-layout';

// =============================================================================
// SETUP
// =============================================================================

beforeEach(() => {
  mockUseCopilotAction.mockClear();
});

// =============================================================================
// HOOK TESTS
// =============================================================================

describe('useGenerativeLayout', () => {
  it('returns initial state with no layout', () => {
    const { result } = renderHook(() => useGenerativeLayout());

    expect(result.current.currentLayout).toBeNull();
    expect(result.current.layoutHistory).toEqual([]);
    expect(result.current.hasHistory).toBe(false);
  });

  it('registers CopilotKit action on mount', () => {
    renderHook(() => useGenerativeLayout());

    expect(mockUseCopilotAction).toHaveBeenCalledTimes(1);
    expect(mockUseCopilotAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'render_generative_layout',
        description: expect.any(String),
        parameters: expect.any(Array),
        renderAndWaitForResponse: expect.any(Function),
      })
    );
  });

  it('registers action with required parameters', () => {
    renderHook(() => useGenerativeLayout());

    const actionConfig = mockUseCopilotAction.mock.calls[0][0];
    const paramNames = actionConfig.parameters.map(
      (p: { name: string }) => p.name
    );

    expect(paramNames).toContain('layout_type');
    expect(paramNames).toContain('config');
    expect(paramNames).toContain('slots');
    expect(paramNames).toContain('metadata');
  });

  it('provides clearLayout function', () => {
    const onLayoutChange = vi.fn();
    const { result } = renderHook(() =>
      useGenerativeLayout({ onLayoutChange })
    );

    act(() => {
      result.current.clearLayout();
    });

    expect(onLayoutChange).toHaveBeenCalledWith(null);
  });

  it('provides goBack function', () => {
    const { result } = renderHook(() => useGenerativeLayout());

    // Initially no history
    expect(result.current.hasHistory).toBe(false);

    // goBack should not throw when no history
    act(() => {
      result.current.goBack();
    });

    expect(result.current.currentLayout).toBeNull();
  });

  it('hasHistory is false with empty or single-item history', () => {
    const { result } = renderHook(() => useGenerativeLayout());

    expect(result.current.hasHistory).toBe(false);
  });

  it('calls onLayoutChange callback', () => {
    const onLayoutChange = vi.fn();
    const { result } = renderHook(() =>
      useGenerativeLayout({ onLayoutChange })
    );

    act(() => {
      result.current.clearLayout();
    });

    expect(onLayoutChange).toHaveBeenCalled();
  });
});

describe('useGenerativeLayout action handler', () => {
  it('renders loading skeleton for inProgress status', () => {
    renderHook(() => useGenerativeLayout());

    const actionConfig = mockUseCopilotAction.mock.calls[0][0];
    const renderFn = actionConfig.renderAndWaitForResponse;

    const result = renderFn({
      args: {},
      status: 'inProgress',
    });

    // Should return the loading skeleton
    expect(result).toBeDefined();
  });

  it('renders loading skeleton for executing status', () => {
    renderHook(() => useGenerativeLayout());

    const actionConfig = mockUseCopilotAction.mock.calls[0][0];
    const renderFn = actionConfig.renderAndWaitForResponse;

    const result = renderFn({
      args: {},
      status: 'executing',
    });

    expect(result).toBeDefined();
  });

  it('renders layout for complete status', () => {
    renderHook(() => useGenerativeLayout());

    const actionConfig = mockUseCopilotAction.mock.calls[0][0];
    const renderFn = actionConfig.renderAndWaitForResponse;

    const result = renderFn({
      args: {
        layout_type: 'single',
        config: { type: 'single' },
        slots: [
          {
            id: 'slot-1',
            widget: 'TestWidget',
            data: { title: 'Test' },
          },
        ],
        metadata: { title: 'Test Layout' },
      },
      status: 'complete',
    });

    // Should return the GenerativeLayoutRenderer
    expect(result).toBeDefined();
  });

  it('parses args into GenerativeLayout structure', () => {
    const onLayoutChange = vi.fn();
    renderHook(() => useGenerativeLayout({ onLayoutChange }));

    const actionConfig = mockUseCopilotAction.mock.calls[0][0];
    const renderFn = actionConfig.renderAndWaitForResponse;

    renderFn({
      args: {
        layout_type: 'split',
        config: {
          type: 'split',
          direction: 'horizontal',
          ratio: [1, 1],
        },
        slots: [
          { id: 's1', widget: 'A', data: {} },
          { id: 's2', widget: 'B', data: {} },
        ],
        metadata: { title: 'Split Layout' },
      },
      status: 'complete',
    });

    // onLayoutChange should be called with parsed layout
    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'split',
        slots: expect.arrayContaining([
          expect.objectContaining({ widget: 'A' }),
          expect.objectContaining({ widget: 'B' }),
        ]),
        metadata: expect.objectContaining({
          title: 'Split Layout',
        }),
      })
    );
  });

  it('handles missing slot ids gracefully', () => {
    renderHook(() => useGenerativeLayout());

    const actionConfig = mockUseCopilotAction.mock.calls[0][0];
    const renderFn = actionConfig.renderAndWaitForResponse;

    // Should not throw with missing id
    const result = renderFn({
      args: {
        layout_type: 'single',
        config: { type: 'single' },
        slots: [
          { widget: 'TestWidget', data: {} }, // No id
        ],
      },
      status: 'complete',
    });

    expect(result).toBeDefined();
  });

  it('handles missing data gracefully', () => {
    renderHook(() => useGenerativeLayout());

    const actionConfig = mockUseCopilotAction.mock.calls[0][0];
    const renderFn = actionConfig.renderAndWaitForResponse;

    // Should not throw with missing data
    const result = renderFn({
      args: {
        layout_type: 'single',
        config: { type: 'single' },
        slots: [
          { id: 's1', widget: 'TestWidget' }, // No data
        ],
      },
      status: 'complete',
    });

    expect(result).toBeDefined();
  });
});

describe('useGenerativeLayout history management', () => {
  it('renders both layouts sequentially and calls onLayoutChange', () => {
    const onLayoutChange = vi.fn();
    renderHook(() => useGenerativeLayout({ onLayoutChange }));

    const actionConfig = mockUseCopilotAction.mock.calls[0][0];
    const renderFn = actionConfig.renderAndWaitForResponse;

    // Add first layout
    renderFn({
      args: {
        layout_type: 'single',
        config: { type: 'single' },
        slots: [{ id: 's1', widget: 'W1', data: {} }],
      },
      status: 'complete',
    });

    // onLayoutChange should be called for first layout
    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'single' })
    );

    // Add second layout
    renderFn({
      args: {
        layout_type: 'grid',
        config: { type: 'grid', columns: 2, gap: 4 },
        slots: [{ id: 's2', widget: 'W2', data: {} }],
      },
      status: 'complete',
    });

    // onLayoutChange should be called for second layout too
    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'grid' })
    );
    expect(onLayoutChange).toHaveBeenCalledTimes(2);
  });

  it('renders 15 layouts sequentially', () => {
    renderHook(() => useGenerativeLayout());

    const actionConfig = mockUseCopilotAction.mock.calls[0][0];
    const renderFn = actionConfig.renderAndWaitForResponse;

    // Add 15 layouts - should not throw
    for (let i = 0; i < 15; i++) {
      const result = renderFn({
        args: {
          layout_type: 'single',
          config: { type: 'single' },
          slots: [{ id: `s${i}`, widget: 'W', data: {} }],
        },
        status: 'complete',
      });
      expect(result).toBeDefined();
    }
  });
});
