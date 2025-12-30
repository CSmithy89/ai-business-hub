/**
 * Generative UI Layout Types
 *
 * Type definitions for dynamic layout composition by AI agents.
 * Agents can compose UI layouts using these types via CopilotKit's
 * renderAndWait tool call mechanism.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md - Section 3.3
 * Epic: DM-06 | Story: DM-06.3
 */

// =============================================================================
// LAYOUT TYPE ENUM
// =============================================================================

/**
 * Available layout types for generative UI composition.
 *
 * - single: Full-width single widget display
 * - split: Side-by-side comparison layout (horizontal or vertical)
 * - wizard: Multi-step flow with progress indicator
 * - grid: Dashboard-style grid of widgets
 */
export type LayoutType = 'single' | 'split' | 'wizard' | 'grid';

// =============================================================================
// LAYOUT SLOT INTERFACE
// =============================================================================

/**
 * Individual slot in a layout that contains a widget.
 */
export interface LayoutSlot {
  /** Unique identifier for this slot */
  id: string;
  /** Widget type to render (must be in widget registry) */
  widget: string;
  /** Data payload passed to the widget component */
  data: Record<string, unknown>;
  /** Optional title displayed above the widget */
  title?: string;
}

// =============================================================================
// LAYOUT CONFIG INTERFACES
// =============================================================================

/**
 * Configuration for single-widget layout.
 * Renders one widget at full width.
 */
export interface SingleLayoutConfig {
  type: 'single';
}

/**
 * Configuration for split layout.
 * Renders two widgets side-by-side or stacked.
 */
export interface SplitLayoutConfig {
  type: 'split';
  /** Split direction: horizontal (left/right) or vertical (top/bottom) */
  direction: 'horizontal' | 'vertical';
  /** Size ratio as [left, right] or [top, bottom] */
  ratio: [number, number];
  /** Whether the split can be resized by user (future feature) */
  resizable?: boolean;
}

/**
 * Configuration for wizard layout.
 * Renders a multi-step flow with navigation.
 */
export interface WizardLayoutConfig {
  type: 'wizard';
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Allow skipping steps */
  allowSkip?: boolean;
  /** Show progress indicator */
  showProgress?: boolean;
}

/**
 * Configuration for grid layout.
 * Renders multiple widgets in a responsive grid.
 */
export interface GridLayoutConfig {
  type: 'grid';
  /** Number of columns (responsive on mobile) */
  columns: number;
  /** Gap between items in spacing units */
  gap?: number;
  /** Minimum item width in pixels (for responsive sizing) */
  minItemWidth?: number;
}

/**
 * Union type of all layout configurations.
 * Discriminated union on the 'type' field.
 */
export type LayoutConfig =
  | SingleLayoutConfig
  | SplitLayoutConfig
  | WizardLayoutConfig
  | GridLayoutConfig;

// =============================================================================
// GENERATIVE LAYOUT INTERFACE
// =============================================================================

/**
 * Complete generative layout definition.
 * Combines layout type, configuration, slots, and metadata.
 */
export interface GenerativeLayout {
  /** Unique identifier for this layout instance */
  id: string;
  /** Layout type (determines which component renders) */
  type: LayoutType;
  /** Type-specific configuration */
  config: LayoutConfig;
  /** Slots containing widgets to render */
  slots: LayoutSlot[];
  /** Optional metadata about the layout */
  metadata?: {
    /** Layout title (displayed in header if present) */
    title?: string;
    /** Layout description */
    description?: string;
    /** Timestamp when layout was created */
    createdAt: number;
    /** Agent that created this layout */
    agentId?: string;
  };
}

// =============================================================================
// LAYOUT TRANSITION INTERFACE
// =============================================================================

/**
 * Configuration for layout transitions.
 * Used by Framer Motion for animated layout changes.
 */
export interface LayoutTransition {
  /** Layout type transitioning from */
  from: LayoutType;
  /** Layout type transitioning to */
  to: LayoutType;
  /** Transition duration in seconds */
  duration?: number;
  /** Easing function name */
  easing?: string;
}

// =============================================================================
// WIDGET REGISTRY TYPES
// =============================================================================

/**
 * Props passed to widget components by the SlotRenderer.
 */
export interface WidgetProps<T = Record<string, unknown>> {
  /** Data payload from the slot */
  data: T;
  /** Optional slot title */
  title?: string;
  /** Slot ID for styling/targeting */
  slotId?: string;
}

/**
 * Widget component type for the registry.
 */
export type WidgetComponent<T = Record<string, unknown>> = React.ComponentType<
  WidgetProps<T>
>;

/**
 * Widget registry mapping widget names to components.
 */
export type WidgetRegistry = Record<string, WidgetComponent>;

// =============================================================================
// HOOK TYPES
// =============================================================================

/**
 * Options for the useGenerativeLayout hook.
 */
export interface UseGenerativeLayoutOptions {
  /** Callback when layout changes */
  onLayoutChange?: (layout: GenerativeLayout | null) => void;
}

/**
 * Return type for the useGenerativeLayout hook.
 */
export interface UseGenerativeLayoutReturn {
  /** Currently displayed layout (null if none) */
  currentLayout: GenerativeLayout | null;
  /** History of previous layouts (for back navigation) */
  layoutHistory: GenerativeLayout[];
  /** Clear the current layout */
  clearLayout: () => void;
  /** Navigate to previous layout in history */
  goBack: () => void;
  /** Whether there is navigation history */
  hasHistory: boolean;
}

// =============================================================================
// TOOL CALL TYPES
// =============================================================================

/**
 * Args passed to the render_generative_layout tool.
 * These are received from the agent via CopilotKit.
 */
export interface RenderGenerativeLayoutArgs {
  /** Layout type to render */
  layout_type: LayoutType;
  /** Layout configuration */
  config: Record<string, unknown>;
  /** Slots with widgets to render */
  slots: Array<{
    id: string;
    widget: string;
    data: Record<string, unknown>;
    title?: string;
  }>;
  /** Optional layout metadata */
  metadata?: {
    title?: string;
    description?: string;
  };
}
