/**
 * Widget Registry
 *
 * Maps widget type strings to their React component implementations.
 * This is the central registry for all dashboard widgets.
 *
 * The registry pattern allows:
 * - Type-safe widget lookup
 * - Easy extension with new widget types
 * - Future code splitting via React.lazy
 *
 * @see docs/modules/bm-dm/stories/dm-01-2-slot-system-foundation.md
 */

import type { ComponentType } from 'react';
import type { WidgetType, PlaceholderWidgetProps } from './types';

/**
 * Placeholder Widget Component
 *
 * Renders a debug view showing widget type and data.
 * Will be replaced with actual widget implementations in DM-01.3.
 */
function PlaceholderWidget({ type, data }: PlaceholderWidgetProps) {
  return (
    <div className="p-4 border rounded-lg bg-muted">
      <p className="text-sm font-medium text-muted-foreground">
        Placeholder: {type}
      </p>
      <pre className="mt-2 text-xs overflow-auto max-h-48 bg-background/50 p-2 rounded">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

/**
 * Widget Registry
 *
 * Maps widget types to their React component implementations.
 *
 * To add a new widget type:
 * 1. Add the type to WidgetType in types.ts
 * 2. Create the widget component
 * 3. Add the mapping here
 *
 * @example
 * import { NewWidget } from './widgets/NewWidget';
 * WIDGET_REGISTRY.NewWidgetType = NewWidget;
 */
export const WIDGET_REGISTRY: Record<WidgetType, ComponentType<PlaceholderWidgetProps>> = {
  ProjectStatus: PlaceholderWidget,
  TaskList: PlaceholderWidget,
  Metrics: PlaceholderWidget,
  Alert: PlaceholderWidget,
};

/**
 * Type guard to check if a widget type is valid.
 *
 * @param type - The widget type string to check
 * @returns True if the type exists in the registry
 *
 * @example
 * if (isValidWidgetType(args.type)) {
 *   const Widget = WIDGET_REGISTRY[args.type];
 * }
 */
export function isValidWidgetType(type: string): type is WidgetType {
  return type in WIDGET_REGISTRY;
}

/**
 * Get a widget component from the registry.
 *
 * @param type - The widget type to look up
 * @returns The component if found, undefined otherwise
 *
 * @example
 * const Widget = getWidgetComponent('ProjectStatus');
 * if (Widget) {
 *   return <Widget type="ProjectStatus" data={data} />;
 * }
 */
export function getWidgetComponent(type: string): ComponentType<PlaceholderWidgetProps> | undefined {
  if (isValidWidgetType(type)) {
    return WIDGET_REGISTRY[type];
  }
  return undefined;
}

/**
 * Get all registered widget types.
 *
 * @returns Array of all valid widget type strings
 */
export function getRegisteredWidgetTypes(): WidgetType[] {
  return Object.keys(WIDGET_REGISTRY) as WidgetType[];
}
