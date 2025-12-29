import { describe, it, expect } from 'vitest';
import {
  getStatusColor,
  getStatusTextColor,
  getStatusLabel,
  formatLatency,
  formatLastChecked,
  type ProviderHealthStatus,
} from '../useCCRStatus';

describe('useCCRStatus utilities', () => {
  describe('getStatusColor', () => {
    it('returns green for healthy status', () => {
      expect(getStatusColor('healthy')).toBe('bg-green-500');
    });

    it('returns yellow for degraded status', () => {
      expect(getStatusColor('degraded')).toBe('bg-yellow-500');
    });

    it('returns red for down status', () => {
      expect(getStatusColor('down')).toBe('bg-red-500');
    });

    it('returns gray for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('bg-gray-400');
    });
  });

  describe('getStatusTextColor', () => {
    it('returns green text for healthy status', () => {
      expect(getStatusTextColor('healthy')).toBe('text-green-600');
    });

    it('returns yellow text for degraded status', () => {
      expect(getStatusTextColor('degraded')).toBe('text-yellow-600');
    });

    it('returns red text for down status', () => {
      expect(getStatusTextColor('down')).toBe('text-red-600');
    });

    it('returns gray text for unknown status', () => {
      expect(getStatusTextColor('unknown')).toBe('text-gray-500');
    });
  });

  describe('getStatusLabel', () => {
    it('returns correct label for healthy', () => {
      expect(getStatusLabel('healthy')).toBe('Healthy');
    });

    it('returns correct label for degraded', () => {
      expect(getStatusLabel('degraded')).toBe('Degraded');
    });

    it('returns correct label for down', () => {
      expect(getStatusLabel('down')).toBe('Down');
    });

    it('returns correct label for unknown', () => {
      expect(getStatusLabel('unknown')).toBe('Unknown');
    });
  });

  describe('formatLatency', () => {
    it('formats latency with ms suffix', () => {
      expect(formatLatency(150)).toBe('150ms');
    });

    it('formats zero latency', () => {
      expect(formatLatency(0)).toBe('0ms');
    });

    it('returns dash for undefined latency', () => {
      expect(formatLatency(undefined)).toBe('-');
    });
  });

  describe('formatLastChecked', () => {
    it('returns "Just now" for recent timestamps', () => {
      const now = new Date().toISOString();
      expect(formatLastChecked(now)).toBe('Just now');
    });

    it('returns minutes ago for timestamps within an hour', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatLastChecked(fiveMinutesAgo)).toBe('5m ago');
    });

    it('returns hours ago for timestamps within a day', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatLastChecked(twoHoursAgo)).toBe('2h ago');
    });

    it('returns date for timestamps older than a day', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatLastChecked(twoDaysAgo);
      // Should be a date string, not "Xh ago"
      expect(result).not.toContain('ago');
    });
  });

  describe('type exports', () => {
    it('ProviderHealthStatus type includes all expected values', () => {
      const statuses: ProviderHealthStatus[] = ['healthy', 'degraded', 'down', 'unknown'];
      expect(statuses).toHaveLength(4);
    });
  });
});
