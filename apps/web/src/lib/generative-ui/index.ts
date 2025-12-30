/**
 * Generative UI Module
 *
 * Exports for generative UI layout composition by AI agents.
 * This module provides type definitions and hooks for dynamic
 * layout rendering via CopilotKit's tool call mechanism.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md - Section 3.3
 * Epic: DM-06 | Story: DM-06.3
 */

// Type definitions
export type {
  LayoutType,
  LayoutSlot,
  SingleLayoutConfig,
  SplitLayoutConfig,
  WizardLayoutConfig,
  GridLayoutConfig,
  LayoutConfig,
  GenerativeLayout,
  LayoutTransition,
  WidgetProps,
  WidgetComponent,
  WidgetRegistry,
  UseGenerativeLayoutOptions,
  UseGenerativeLayoutReturn,
  RenderGenerativeLayoutArgs,
} from './layout-types';

// Hook and provider
export {
  useGenerativeLayout,
  GenerativeLayoutProvider,
} from './use-generative-layout';
