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
 * @see docs/modules/bm-dm/stories/dm-01-3-base-widget-components.md
 */

import type { ComponentType } from 'react';
import type { WidgetType, WidgetData } from './types';
import {
  ProjectStatusWidget,
  TaskListWidget,
  MetricsWidget,
  AlertWidget,
} from './widgets';

/**
 * Widget props interface for registry.
 * All widgets accept data and optional isLoading props.
 * The data is typed as the base WidgetData but each widget
 * internally casts to its specific data type.
 */
export interface WidgetProps {
  /** Widget data payload */
  data: WidgetData;
  /** Whether the widget is in a loading state */
  isLoading?: boolean;
}

/**
 * Internal widget component type that allows for specific data types.
 * Each widget can have its own data type that extends WidgetData.
 */
type WidgetComponent = ComponentType<{
  data: WidgetData;
  isLoading?: boolean;
}>;

/**
 * Widget Registry
 *
 * Maps widget types to their React component implementations.
 * Uses type assertion to handle the variance between specific widget
 * data types and the base WidgetData type.
 *
 * To add a new widget type:
 * 1. Add the type to WidgetType in types.ts
 * 2. Create the widget component in widgets/
 * 3. Export it from widgets/index.ts
 * 4. Add the mapping here
 *
 * @example
 * // In types.ts, add to WidgetType:
 * export type WidgetType = 'ProjectStatus' | 'TaskList' | 'Metrics' | 'Alert' | 'NewWidget';
 *
 * // In widgets/NewWidget.tsx, create the component
 * // In widgets/index.ts, export it
 * // Here, add: NewWidget: NewWidgetComponent as WidgetComponent,
 */
export const WIDGET_REGISTRY: Record<WidgetType, WidgetComponent> = {
  ProjectStatus: ProjectStatusWidget as WidgetComponent,
  TaskList: TaskListWidget as WidgetComponent,
  Metrics: MetricsWidget as WidgetComponent,
  Alert: AlertWidget as WidgetComponent,
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
  return Object.prototype.hasOwnProperty.call(WIDGET_REGISTRY, type);
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
 *   return <Widget data={data} />;
 * }
 */
export function getWidgetComponent(
  type: string
): ComponentType<WidgetProps> | undefined {
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
