/**
 * Date Utilities Tests
 *
 * Tests for date/timestamp handling including:
 * - Timestamp normalization from various input types
 * - Edge cases (invalid dates, timezones)
 * - Relative time formatting
 *
 * Epic: 07 - UI Shell
 * Story: Technical Debt - Add unit tests for date utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeTimestamp,
  formatChatTime,
  formatDateTime,
  formatRelativeTime,
} from './date-utils';

describe('normalizeTimestamp', () => {
  describe('Date object input', () => {
    it('returns the same Date object', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = normalizeTimestamp(date);

      expect(result).toBe(date); // Same reference
      expect(result.getTime()).toBe(date.getTime());
    });

    it('handles Date at epoch', () => {
      const date = new Date(0);
      const result = normalizeTimestamp(date);

      expect(result.getTime()).toBe(0);
    });
  });

  describe('ISO string input', () => {
    it('converts ISO string to Date', () => {
      const isoString = '2024-01-15T10:30:00Z';
      const result = normalizeTimestamp(isoString);

      expect(result).toBeInstanceOf(Date);
      // toISOString() always includes milliseconds, so compare timestamps instead
      expect(result.getTime()).toBe(new Date(isoString).getTime());
    });

    it('handles ISO string with timezone offset', () => {
      const isoString = '2024-01-15T10:30:00+05:30';
      const result = normalizeTimestamp(isoString);

      expect(result).toBeInstanceOf(Date);
      // Should convert to UTC correctly
      expect(result.getTime()).toBe(new Date(isoString).getTime());
    });

    it('handles date-only string', () => {
      const dateString = '2024-01-15';
      const result = normalizeTimestamp(dateString);

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });
  });

  describe('Numeric timestamp input', () => {
    it('converts milliseconds timestamp to Date', () => {
      const timestamp = 1705315800000; // 2024-01-15T10:30:00Z
      const result = normalizeTimestamp(timestamp);

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(timestamp);
    });

    it('handles timestamp at epoch (0)', () => {
      const result = normalizeTimestamp(0);

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(0);
    });

    it('handles negative timestamp (before epoch)', () => {
      const timestamp = -86400000; // One day before epoch
      const result = normalizeTimestamp(timestamp);

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(timestamp);
    });
  });

  describe('Edge cases', () => {
    it('handles invalid date string', () => {
      const result = normalizeTimestamp('invalid-date');

      expect(result).toBeInstanceOf(Date);
      expect(isNaN(result.getTime())).toBe(true);
    });

    it('handles empty string', () => {
      const result = normalizeTimestamp('');

      expect(result).toBeInstanceOf(Date);
      expect(isNaN(result.getTime())).toBe(true);
    });
  });
});

describe('formatChatTime', () => {
  it('formats time in 12-hour format', () => {
    // Using a specific timezone-independent approach
    const date = new Date('2024-01-15T14:30:00Z');
    const result = formatChatTime(date);

    // Result depends on timezone, but should be in format like "X:XX AM/PM"
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  });

  it('accepts ISO string input', () => {
    const result = formatChatTime('2024-01-15T10:30:00Z');

    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  });

  it('accepts numeric timestamp input', () => {
    const result = formatChatTime(1705315800000);

    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  });

  it('formats midnight correctly', () => {
    const date = new Date('2024-01-15T00:00:00');
    const result = formatChatTime(date);

    expect(result).toMatch(/12:00\s?AM/i);
  });

  it('formats noon correctly', () => {
    const date = new Date('2024-01-15T12:00:00');
    const result = formatChatTime(date);

    expect(result).toMatch(/12:00\s?PM/i);
  });

  it('includes leading zero in minutes', () => {
    const date = new Date('2024-01-15T10:05:00');
    const result = formatChatTime(date);

    expect(result).toMatch(/:05\s?(AM|PM)/i);
  });
});

describe('formatDateTime', () => {
  it('formats date and time together', () => {
    const date = new Date('2024-01-15T14:30:00');
    const result = formatDateTime(date);

    // Should contain month, day, year, and time
    expect(result).toMatch(/Jan/i);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  });

  it('formats different months correctly', () => {
    const dates = [
      { input: new Date('2024-03-15T10:00:00'), month: 'Mar' },
      { input: new Date('2024-07-15T10:00:00'), month: 'Jul' },
      { input: new Date('2024-12-15T10:00:00'), month: 'Dec' },
    ];

    dates.forEach(({ input, month }) => {
      const result = formatDateTime(input);
      expect(result).toContain(month);
    });
  });

  it('accepts all input types', () => {
    const dateObj = new Date('2024-01-15T10:30:00');
    const isoString = '2024-01-15T10:30:00';
    const timestamp = dateObj.getTime();

    const results = [
      formatDateTime(dateObj),
      formatDateTime(isoString),
      formatDateTime(timestamp),
    ];

    // All should produce valid formatted strings
    results.forEach((result) => {
      expect(result).toMatch(/Jan.*15.*2024/i);
    });
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock Date.now to have consistent tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Just now', () => {
    it('returns "just now" for timestamps within last minute', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('returns "just now" for 30 seconds ago', () => {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      expect(formatRelativeTime(thirtySecondsAgo)).toBe('just now');
    });

    it('returns "just now" for 59 seconds ago', () => {
      const fiftyNineSecondsAgo = new Date(Date.now() - 59 * 1000);
      expect(formatRelativeTime(fiftyNineSecondsAgo)).toBe('just now');
    });
  });

  describe('Minutes ago', () => {
    it('returns "1 minute ago" for singular', () => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
    });

    it('returns "X minutes ago" for plural', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('returns "59 minutes ago" for boundary', () => {
      const fiftyNineMinutesAgo = new Date(Date.now() - 59 * 60 * 1000);
      expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59 minutes ago');
    });
  });

  describe('Hours ago', () => {
    it('returns "1 hour ago" for singular', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
    });

    it('returns "X hours ago" for plural', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');
    });

    it('returns "23 hours ago" for boundary', () => {
      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000);
      expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23 hours ago');
    });
  });

  describe('Days ago', () => {
    it('returns "yesterday" for 1 day ago', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneDayAgo)).toBe('yesterday');
    });

    it('returns "X days ago" for 2-6 days', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });

    it('returns "6 days ago" for boundary', () => {
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(sixDaysAgo)).toBe('6 days ago');
    });
  });

  describe('Older timestamps', () => {
    it('returns formatted date for 7+ days ago', () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(sevenDaysAgo);

      // Should fall back to formatDateTime
      expect(result).toMatch(/Jan.*\d+.*2024/i);
    });

    it('returns formatted date for very old timestamps', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(oneYearAgo);

      expect(result).toMatch(/Jan.*\d+.*2023/i);
    });
  });

  describe('Input types', () => {
    it('accepts Date object', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('5 minutes ago');
    });

    it('accepts ISO string', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo.toISOString())).toBe(
        '5 minutes ago'
      );
    });

    it('accepts numeric timestamp', () => {
      const fiveMinutesAgoMs = Date.now() - 5 * 60 * 1000;
      expect(formatRelativeTime(fiveMinutesAgoMs)).toBe('5 minutes ago');
    });
  });
});

describe('Edge Cases', () => {
  it('handles future timestamps gracefully', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

    const futureDate = new Date('2024-01-16T12:00:00Z');
    const result = formatRelativeTime(futureDate);

    // Future dates might produce negative or unexpected results
    // The function should at least not throw
    expect(typeof result).toBe('string');

    vi.useRealTimers();
  });

  it('handles very old dates', () => {
    const veryOldDate = new Date('1970-01-01T00:00:00Z');
    const result = formatDateTime(veryOldDate);

    expect(result).toMatch(/Jan.*1.*1970/i);
  });

  it('handles far future dates', () => {
    // Use a date that won't be affected by timezone conversion
    const farFutureDate = new Date('2099-06-15T12:00:00Z');
    const result = formatDateTime(farFutureDate);

    expect(result).toMatch(/Jun.*15.*2099/i);
  });
});
