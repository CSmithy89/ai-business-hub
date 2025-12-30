/**
 * GenerativeLayout Component Tests - Story DM-06.3
 *
 * Tests for generative UI layout components including:
 * - GenerativeLayoutRenderer dispatch logic
 * - SingleLayout, SplitLayout, WizardLayout, GridLayout components
 * - SlotRenderer with widget registry
 * - Widget registration and fallback handling
 *
 * @see docs/modules/bm-dm/stories/dm-06-3-generative-ui-composition.md
 * Epic: DM-06 | Story: DM-06.3
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  GenerativeLayoutRenderer,
  SingleLayout,
  SplitLayout,
  WizardLayout,
  GridLayout,
  SlotRenderer,
  registerWidget,
  getWidget,
  getRegisteredWidgets,
} from '../GenerativeLayout';
import type {
  GenerativeLayout,
  WidgetProps,
} from '@/lib/generative-ui/layout-types';

// =============================================================================
// TEST WIDGET
// =============================================================================

/**
 * Simple test widget for testing layout rendering.
 */
function TestWidget({ data, title }: WidgetProps<{ title?: string }>) {
  return (
    <div data-testid="test-widget">
      {title && <h4>{title}</h4>}
      <span>{data.title || 'Test Widget Content'}</span>
    </div>
  );
}

// =============================================================================
// SETUP
// =============================================================================

beforeAll(() => {
  // Register test widget before all tests
  registerWidget('TestWidget', TestWidget);
});

// =============================================================================
// WIDGET REGISTRY TESTS
// =============================================================================

describe('Widget Registry', () => {
  it('registers and retrieves widgets', () => {
    const DummyWidget = ({ data }: WidgetProps) => <div>{String(data.value)}</div>;
    registerWidget('DummyWidget', DummyWidget);

    const retrieved = getWidget('DummyWidget');
    expect(retrieved).toBe(DummyWidget);
  });

  it('returns undefined for unregistered widgets', () => {
    const result = getWidget('NonExistentWidget');
    expect(result).toBeUndefined();
  });

  it('lists all registered widgets', () => {
    const widgets = getRegisteredWidgets();
    expect(widgets).toContain('TestWidget');
    expect(Array.isArray(widgets)).toBe(true);
  });
});

// =============================================================================
// SLOT RENDERER TESTS
// =============================================================================

describe('SlotRenderer', () => {
  it('renders registered widget', () => {
    const slot = {
      id: 'slot-1',
      widget: 'TestWidget',
      data: { title: 'Hello World' },
    };

    render(<SlotRenderer slot={slot} />);

    expect(screen.getByTestId('test-widget')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('shows fallback for unknown widget', () => {
    const slot = {
      id: 'slot-2',
      widget: 'UnknownWidget',
      data: {},
    };

    render(<SlotRenderer slot={slot} />);

    expect(screen.getByText(/Unknown widget: UnknownWidget/)).toBeInTheDocument();
  });
});

// =============================================================================
// SINGLE LAYOUT TESTS
// =============================================================================

describe('SingleLayout', () => {
  it('renders single slot full width', () => {
    const layout: GenerativeLayout = {
      id: 'test-single-1',
      type: 'single',
      config: { type: 'single' },
      slots: [
        {
          id: 's1',
          widget: 'TestWidget',
          data: { title: 'Single Widget' },
        },
      ],
    };

    render(<SingleLayout layout={layout} />);

    expect(screen.getByTestId('single-layout')).toBeInTheDocument();
    expect(screen.getByText('Single Widget')).toBeInTheDocument();
  });

  it('shows message when no slots provided', () => {
    const layout: GenerativeLayout = {
      id: 'test-single-2',
      type: 'single',
      config: { type: 'single' },
      slots: [],
    };

    render(<SingleLayout layout={layout} />);

    expect(screen.getByText('No widget to display')).toBeInTheDocument();
  });

  it('uses metadata title for aria-label when provided', () => {
    const layout: GenerativeLayout = {
      id: 'test-single-3',
      type: 'single',
      config: { type: 'single' },
      slots: [{ id: 's1', widget: 'TestWidget', data: {} }],
      metadata: { title: 'My Single Layout', createdAt: Date.now() },
    };

    render(<SingleLayout layout={layout} />);

    const region = screen.getByTestId('single-layout');
    expect(region).toHaveAttribute('aria-label', 'My Single Layout');
  });
});

// =============================================================================
// SPLIT LAYOUT TESTS
// =============================================================================

describe('SplitLayout', () => {
  it('renders two panes horizontally', () => {
    const layout: GenerativeLayout = {
      id: 'test-split-1',
      type: 'split',
      config: {
        type: 'split',
        direction: 'horizontal',
        ratio: [1, 1],
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: { title: 'Left' } },
        { id: 's2', widget: 'TestWidget', data: { title: 'Right' } },
      ],
    };

    render(<SplitLayout layout={layout} />);

    expect(screen.getByTestId('split-layout')).toBeInTheDocument();
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
  });

  it('renders with custom ratio', () => {
    const layout: GenerativeLayout = {
      id: 'test-split-2',
      type: 'split',
      config: {
        type: 'split',
        direction: 'horizontal',
        ratio: [2, 1],
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: {} },
        { id: 's2', widget: 'TestWidget', data: {} },
      ],
    };

    render(<SplitLayout layout={layout} />);

    // Layout should render without errors
    expect(screen.getByTestId('split-layout')).toBeInTheDocument();
  });

  it('displays slot titles', () => {
    const layout: GenerativeLayout = {
      id: 'test-split-3',
      type: 'split',
      config: {
        type: 'split',
        direction: 'horizontal',
        ratio: [1, 1],
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: {}, title: 'First Pane' },
        { id: 's2', widget: 'TestWidget', data: {}, title: 'Second Pane' },
      ],
    };

    render(<SplitLayout layout={layout} />);

    // Title appears both in the pane header and via widget props
    const firstPaneTexts = screen.getAllByText('First Pane');
    const secondPaneTexts = screen.getAllByText('Second Pane');
    expect(firstPaneTexts.length).toBeGreaterThanOrEqual(1);
    expect(secondPaneTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('shows error message with insufficient slots', () => {
    const layout: GenerativeLayout = {
      id: 'test-split-4',
      type: 'split',
      config: {
        type: 'split',
        direction: 'horizontal',
        ratio: [1, 1],
      },
      slots: [{ id: 's1', widget: 'TestWidget', data: {} }],
    };

    render(<SplitLayout layout={layout} />);

    expect(
      screen.getByText('Split layout requires two widgets')
    ).toBeInTheDocument();
  });
});

// =============================================================================
// WIZARD LAYOUT TESTS
// =============================================================================

describe('WizardLayout', () => {
  it('renders wizard with progress indicator', () => {
    const layout: GenerativeLayout = {
      id: 'test-wizard-1',
      type: 'wizard',
      config: {
        type: 'wizard',
        currentStep: 0,
        totalSteps: 3,
        showProgress: true,
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: { title: 'Step 1' }, title: 'First' },
        { id: 's2', widget: 'TestWidget', data: { title: 'Step 2' } },
        { id: 's3', widget: 'TestWidget', data: { title: 'Step 3' } },
      ],
    };

    render(<WizardLayout layout={layout} />);

    expect(screen.getByTestId('wizard-layout')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    // Title appears in step header and widget props
    const firstTexts = screen.getAllByText('First');
    expect(firstTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('navigates to next step on button click', () => {
    const layout: GenerativeLayout = {
      id: 'test-wizard-2',
      type: 'wizard',
      config: {
        type: 'wizard',
        currentStep: 0,
        totalSteps: 3,
        showProgress: true,
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: { title: 'Step 1' } },
        { id: 's2', widget: 'TestWidget', data: { title: 'Step 2' } },
        { id: 's3', widget: 'TestWidget', data: { title: 'Step 3' } },
      ],
    };

    render(<WizardLayout layout={layout} />);

    // Initially on step 1
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

    // Click next
    fireEvent.click(screen.getByText('Next'));

    // Now on step 2
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('navigates to previous step on button click', () => {
    const layout: GenerativeLayout = {
      id: 'test-wizard-3',
      type: 'wizard',
      config: {
        type: 'wizard',
        currentStep: 1, // Start on step 2
        totalSteps: 3,
        showProgress: true,
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: { title: 'Step 1' } },
        { id: 's2', widget: 'TestWidget', data: { title: 'Step 2' } },
        { id: 's3', widget: 'TestWidget', data: { title: 'Step 3' } },
      ],
    };

    render(<WizardLayout layout={layout} />);

    // Click previous
    fireEvent.click(screen.getByText('Previous'));

    // Now on step 1
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('disables previous button on first step', () => {
    const layout: GenerativeLayout = {
      id: 'test-wizard-4',
      type: 'wizard',
      config: {
        type: 'wizard',
        currentStep: 0,
        totalSteps: 2,
        showProgress: true,
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: {} },
        { id: 's2', widget: 'TestWidget', data: {} },
      ],
    };

    render(<WizardLayout layout={layout} />);

    const prevButton = screen.getByText('Previous').closest('button');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last step', () => {
    const layout: GenerativeLayout = {
      id: 'test-wizard-5',
      type: 'wizard',
      config: {
        type: 'wizard',
        currentStep: 1,
        totalSteps: 2,
        showProgress: true,
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: {} },
        { id: 's2', widget: 'TestWidget', data: {} },
      ],
    };

    render(<WizardLayout layout={layout} />);

    const nextButton = screen.getByText('Complete').closest('button');
    expect(nextButton).toBeDisabled();
  });

  it('shows skip button when allowSkip is true', () => {
    const layout: GenerativeLayout = {
      id: 'test-wizard-6',
      type: 'wizard',
      config: {
        type: 'wizard',
        currentStep: 0,
        totalSteps: 3,
        showProgress: true,
        allowSkip: true,
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: {} },
        { id: 's2', widget: 'TestWidget', data: {} },
        { id: 's3', widget: 'TestWidget', data: {} },
      ],
    };

    render(<WizardLayout layout={layout} />);

    expect(screen.getByText('Skip')).toBeInTheDocument();
  });
});

// =============================================================================
// GRID LAYOUT TESTS
// =============================================================================

describe('GridLayout', () => {
  it('renders multiple widgets in grid', () => {
    const layout: GenerativeLayout = {
      id: 'test-grid-1',
      type: 'grid',
      config: {
        type: 'grid',
        columns: 2,
        gap: 4,
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: { title: 'Card 1' } },
        { id: 's2', widget: 'TestWidget', data: { title: 'Card 2' } },
        { id: 's3', widget: 'TestWidget', data: { title: 'Card 3' } },
      ],
    };

    render(<GridLayout layout={layout} />);

    expect(screen.getByTestId('grid-layout')).toBeInTheDocument();
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
    expect(screen.getByText('Card 3')).toBeInTheDocument();
  });

  it('displays slot titles in grid items', () => {
    const layout: GenerativeLayout = {
      id: 'test-grid-2',
      type: 'grid',
      config: {
        type: 'grid',
        columns: 2,
        gap: 4,
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: {}, title: 'Widget A' },
        { id: 's2', widget: 'TestWidget', data: {}, title: 'Widget B' },
      ],
    };

    render(<GridLayout layout={layout} />);

    // Title appears both in the grid header and via widget props
    const widgetATexts = screen.getAllByText('Widget A');
    const widgetBTexts = screen.getAllByText('Widget B');
    expect(widgetATexts.length).toBeGreaterThanOrEqual(1);
    expect(widgetBTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('uses metadata title for aria-label when provided', () => {
    const layout: GenerativeLayout = {
      id: 'test-grid-3',
      type: 'grid',
      config: {
        type: 'grid',
        columns: 3,
        gap: 4,
      },
      slots: [{ id: 's1', widget: 'TestWidget', data: {} }],
      metadata: { title: 'Dashboard Overview', createdAt: Date.now() },
    };

    render(<GridLayout layout={layout} />);

    const region = screen.getByTestId('grid-layout');
    expect(region).toHaveAttribute('aria-label', 'Dashboard Overview');
  });
});

// =============================================================================
// GENERATIVE LAYOUT RENDERER TESTS
// =============================================================================

describe('GenerativeLayoutRenderer', () => {
  it('renders single layout', () => {
    const layout: GenerativeLayout = {
      id: 'renderer-test-1',
      type: 'single',
      config: { type: 'single' },
      slots: [
        { id: 's1', widget: 'TestWidget', data: { title: 'Rendered' } },
      ],
    };

    render(<GenerativeLayoutRenderer layout={layout} />);

    expect(screen.getByTestId('generative-layout-renderer')).toBeInTheDocument();
    expect(screen.getByText('Rendered')).toBeInTheDocument();
  });

  it('renders split layout via dispatcher', () => {
    const layout: GenerativeLayout = {
      id: 'renderer-test-2',
      type: 'split',
      config: {
        type: 'split',
        direction: 'horizontal',
        ratio: [1, 1],
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: { title: 'A' } },
        { id: 's2', widget: 'TestWidget', data: { title: 'B' } },
      ],
    };

    render(<GenerativeLayoutRenderer layout={layout} />);

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders wizard layout via dispatcher', () => {
    const layout: GenerativeLayout = {
      id: 'renderer-test-3',
      type: 'wizard',
      config: {
        type: 'wizard',
        currentStep: 0,
        totalSteps: 2,
        showProgress: true,
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: { title: 'Wizard Step' } },
        { id: 's2', widget: 'TestWidget', data: {} },
      ],
    };

    render(<GenerativeLayoutRenderer layout={layout} />);

    expect(screen.getByText('Wizard Step')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  });

  it('renders grid layout via dispatcher', () => {
    const layout: GenerativeLayout = {
      id: 'renderer-test-4',
      type: 'grid',
      config: {
        type: 'grid',
        columns: 2,
        gap: 4,
      },
      slots: [
        { id: 's1', widget: 'TestWidget', data: { title: 'Grid Item' } },
      ],
    };

    render(<GenerativeLayoutRenderer layout={layout} />);

    expect(screen.getByText('Grid Item')).toBeInTheDocument();
  });

  it('displays metadata title and description in card header', () => {
    const layout: GenerativeLayout = {
      id: 'renderer-test-5',
      type: 'single',
      config: { type: 'single' },
      slots: [{ id: 's1', widget: 'TestWidget', data: {} }],
      metadata: {
        title: 'Layout Title',
        description: 'Layout Description',
        createdAt: Date.now(),
      },
    };

    render(<GenerativeLayoutRenderer layout={layout} />);

    // Title should appear in CardHeader
    const titles = screen.getAllByText('Layout Title');
    expect(titles.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Layout Description')).toBeInTheDocument();
  });

  it('handles unknown layout type by defaulting to single', () => {
    const layout: GenerativeLayout = {
      id: 'renderer-test-6',
      type: 'unknown' as any,
      config: { type: 'single' },
      slots: [
        { id: 's1', widget: 'TestWidget', data: { title: 'Fallback' } },
      ],
    };

    render(<GenerativeLayoutRenderer layout={layout} />);

    expect(screen.getByText('Fallback')).toBeInTheDocument();
  });
});
