import { describe, it, expect } from 'vitest';
import {
  WIDGET_REGISTRY,
  isValidWidgetType,
  getWidgetComponent,
  getRegisteredWidgetTypes,
} from '../widget-registry';

describe('widget-registry', () => {
  describe('WIDGET_REGISTRY', () => {
    it('contains all expected widget types', () => {
      expect(WIDGET_REGISTRY).toHaveProperty('ProjectStatus');
      expect(WIDGET_REGISTRY).toHaveProperty('TaskList');
      expect(WIDGET_REGISTRY).toHaveProperty('Metrics');
      expect(WIDGET_REGISTRY).toHaveProperty('Alert');
    });

    it('maps each type to a component function', () => {
      expect(typeof WIDGET_REGISTRY.ProjectStatus).toBe('function');
      expect(typeof WIDGET_REGISTRY.TaskList).toBe('function');
      expect(typeof WIDGET_REGISTRY.Metrics).toBe('function');
      expect(typeof WIDGET_REGISTRY.Alert).toBe('function');
    });
  });

  describe('isValidWidgetType', () => {
    it('returns true for valid widget types', () => {
      expect(isValidWidgetType('ProjectStatus')).toBe(true);
      expect(isValidWidgetType('TaskList')).toBe(true);
      expect(isValidWidgetType('Metrics')).toBe(true);
      expect(isValidWidgetType('Alert')).toBe(true);
    });

    it('returns false for invalid widget types', () => {
      expect(isValidWidgetType('Invalid')).toBe(false);
      expect(isValidWidgetType('unknown')).toBe(false);
      expect(isValidWidgetType('')).toBe(false);
      expect(isValidWidgetType('projectstatus')).toBe(false); // Case sensitive
    });

    it('returns false for empty or null-like values', () => {
      expect(isValidWidgetType('')).toBe(false);
    });
  });

  describe('getWidgetComponent', () => {
    it('returns component for valid widget type', () => {
      const component = getWidgetComponent('ProjectStatus');
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });

    it('returns the correct component for each type', () => {
      expect(getWidgetComponent('ProjectStatus')).toBe(WIDGET_REGISTRY.ProjectStatus);
      expect(getWidgetComponent('TaskList')).toBe(WIDGET_REGISTRY.TaskList);
      expect(getWidgetComponent('Metrics')).toBe(WIDGET_REGISTRY.Metrics);
      expect(getWidgetComponent('Alert')).toBe(WIDGET_REGISTRY.Alert);
    });

    it('returns undefined for invalid widget type', () => {
      const component = getWidgetComponent('Invalid');
      expect(component).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      const component = getWidgetComponent('');
      expect(component).toBeUndefined();
    });
  });

  describe('getRegisteredWidgetTypes', () => {
    it('returns all registered widget types', () => {
      const types = getRegisteredWidgetTypes();
      expect(types).toContain('ProjectStatus');
      expect(types).toContain('TaskList');
      expect(types).toContain('Metrics');
      expect(types).toContain('Alert');
    });

    it('returns exactly 4 widget types', () => {
      const types = getRegisteredWidgetTypes();
      expect(types).toHaveLength(4);
    });

    it('returns an array', () => {
      const types = getRegisteredWidgetTypes();
      expect(Array.isArray(types)).toBe(true);
    });
  });
});
