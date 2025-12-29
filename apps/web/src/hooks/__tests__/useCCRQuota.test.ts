import { describe, it, expect } from 'vitest';
import {
  getUsagePercentage,
  getQuotaStatus,
  getProgressColor,
  getStatusTextColor,
  formatNumber,
  formatResetDate,
  getRemainingQuota,
  type QuotaStatus,
} from '../useCCRQuota';

describe('useCCRQuota utilities', () => {
  describe('getUsagePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(getUsagePercentage(50, 100)).toBe(50);
    });

    it('handles 100% usage', () => {
      expect(getUsagePercentage(100, 100)).toBe(100);
    });

    it('handles over 100% usage (caps at 100)', () => {
      expect(getUsagePercentage(150, 100)).toBe(100);
    });

    it('handles zero limit', () => {
      expect(getUsagePercentage(50, 0)).toBe(0);
    });

    it('handles zero usage', () => {
      expect(getUsagePercentage(0, 100)).toBe(0);
    });
  });

  describe('getQuotaStatus', () => {
    it('returns normal for low usage', () => {
      expect(getQuotaStatus(50, 100)).toBe('normal');
    });

    it('returns warning at 80% threshold', () => {
      expect(getQuotaStatus(80, 100)).toBe('warning');
    });

    it('returns warning between 80-95%', () => {
      expect(getQuotaStatus(90, 100)).toBe('warning');
    });

    it('returns critical at 95% threshold', () => {
      expect(getQuotaStatus(95, 100)).toBe('critical');
    });

    it('returns critical above 95%', () => {
      expect(getQuotaStatus(99, 100)).toBe('critical');
    });
  });

  describe('getProgressColor', () => {
    it('returns green for normal status', () => {
      expect(getProgressColor('normal')).toBe('bg-green-500');
    });

    it('returns yellow for warning status', () => {
      expect(getProgressColor('warning')).toBe('bg-yellow-500');
    });

    it('returns red for critical status', () => {
      expect(getProgressColor('critical')).toBe('bg-red-500');
    });
  });

  describe('getStatusTextColor', () => {
    it('returns green text for normal status', () => {
      expect(getStatusTextColor('normal')).toBe('text-green-600');
    });

    it('returns yellow text for warning status', () => {
      expect(getStatusTextColor('warning')).toBe('text-yellow-600');
    });

    it('returns red text for critical status', () => {
      expect(getStatusTextColor('critical')).toBe('text-red-600');
    });
  });

  describe('formatNumber', () => {
    it('formats millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(1500000)).toBe('1.5M');
    });

    it('formats thousands with K suffix', () => {
      expect(formatNumber(1000)).toBe('1.0K');
      expect(formatNumber(1500)).toBe('1.5K');
    });

    it('returns plain number for small values', () => {
      expect(formatNumber(500)).toBe('500');
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatResetDate', () => {
    it('returns Today for past or current date', () => {
      const now = new Date().toISOString();
      expect(formatResetDate(now)).toBe('Today');
    });

    it('returns Tomorrow for next day', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(formatResetDate(tomorrow)).toBe('Tomorrow');
    });

    it('returns In X days for dates within a week', () => {
      const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatResetDate(inThreeDays)).toBe('In 3 days');
    });

    it('returns formatted date for dates beyond a week', () => {
      const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatResetDate(inTwoWeeks);
      // Should be a date like "Jan 15" - just check it doesn't contain "days"
      expect(result).not.toContain('days');
    });
  });

  describe('getRemainingQuota', () => {
    it('calculates remaining correctly', () => {
      expect(getRemainingQuota(30, 100)).toBe(70);
    });

    it('returns 0 when used exceeds limit', () => {
      expect(getRemainingQuota(150, 100)).toBe(0);
    });

    it('returns full limit when nothing used', () => {
      expect(getRemainingQuota(0, 100)).toBe(100);
    });
  });

  describe('type exports', () => {
    it('QuotaStatus type includes all expected values', () => {
      const statuses: QuotaStatus[] = ['normal', 'warning', 'critical'];
      expect(statuses).toHaveLength(3);
    });
  });
});
