import { describe, it, expect } from 'vitest';
import {
  getRoutingModeLabel,
  getRoutingModeDescription,
  type RoutingMode,
} from '../useCCRRouting';

describe('useCCRRouting utilities', () => {
  describe('getRoutingModeLabel', () => {
    it('returns correct label for auto mode', () => {
      expect(getRoutingModeLabel('auto')).toBe('Automatic');
    });

    it('returns correct label for cost-optimized mode', () => {
      expect(getRoutingModeLabel('cost-optimized')).toBe('Cost Optimized');
    });

    it('returns correct label for performance mode', () => {
      expect(getRoutingModeLabel('performance')).toBe('Performance');
    });

    it('returns correct label for manual mode', () => {
      expect(getRoutingModeLabel('manual')).toBe('Manual');
    });
  });

  describe('getRoutingModeDescription', () => {
    it('returns correct description for auto mode', () => {
      const description = getRoutingModeDescription('auto');
      expect(description).toContain('Automatically');
      expect(description).toContain('best provider');
    });

    it('returns correct description for cost-optimized mode', () => {
      const description = getRoutingModeDescription('cost-optimized');
      expect(description).toContain('lower-cost');
    });

    it('returns correct description for performance mode', () => {
      const description = getRoutingModeDescription('performance');
      expect(description).toContain('faster');
      expect(description).toContain('capable');
    });

    it('returns correct description for manual mode', () => {
      const description = getRoutingModeDescription('manual');
      expect(description).toContain('Manually');
    });
  });

  describe('type exports', () => {
    it('RoutingMode type includes all expected values', () => {
      const modes: RoutingMode[] = ['auto', 'cost-optimized', 'performance', 'manual'];
      expect(modes).toHaveLength(4);
    });
  });
});
