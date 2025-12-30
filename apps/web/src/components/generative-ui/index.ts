/**
 * Generative UI Components
 *
 * Exports for generative UI layout components rendered by AI agents.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md - Section 3.3
 * Epic: DM-06 | Story: DM-06.3
 */

export {
  // Main renderer
  GenerativeLayoutRenderer,
  // Layout components
  SingleLayout,
  SplitLayout,
  WizardLayout,
  GridLayout,
  // Slot renderer
  SlotRenderer,
  // Widget registry functions
  registerWidget,
  getWidget,
  getRegisteredWidgets,
} from './GenerativeLayout';
