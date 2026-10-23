import { describe, expect, it } from 'vitest';
import { formatDate, formatMonthYear, formatTime, monthsAtRank, nextOccurrence, startOfWeek, timeAgo, toUrl } from './date';

describe('formatTime', () => {
  it('formats a morning time', () => {
    expect(formatTime('09:05')).toBe('9:05 AM');
  });

  it('formats a time after noon', () => {
    expect(formatTime('18:00')).toBe('6:00 PM');
  });

  it('formats midnight as 12 AM', () => {
    expect(formatTime('00:30')).toBe('12:30 AM');
  });

  it('formats noon as 12 PM', () => {
    expect(formatTime('12:00')).toBe('12:00 PM');
  });
});

describe('nextOccurrence', () => {
  it('returns later this week when the day has not happened yet', () => {
    // Wednesday 2024-01-03, 10:00
    const now = new Date(2024, 0, 3, 10, 0);
    // Next Friday (5) at 18:00
    const result = nextOccurrence(5, '18:00', now);
    expect(result.getDate()).toBe(5);
    expect(result.getHours()).toBe(18);
  });

  it('rolls over to next week when the day/time has already passed', () => {
    // Wednesday 2024-01-03, 10:00
    const now = new Date(2024, 0, 3, 10, 0);
    // Wednesday (3) at 09:00 already happened today
    const result = nextOccurrence(3, '09:00', now);
    expect(result.getDate()).toBe(10);
  });
});

describe('timeAgo', () => {
  const today = new Date(2024, 0, 10);

  it('labels today', () => {
    expect(timeAgo('2024-01-10', today)).toBe('Today');
  });

  it('labels yesterday', () => {
    expect(timeAgo('2024-01-09', today)).toBe('Yesterday');
  });

  it('labels earlier days with a count', () => {
    expect(timeAgo('2024-01-05', today)).toBe('5 days ago');
  });
});

describe('startOfWeek', () => {
  it('returns the Monday of the current week', () => {
    // Thursday 2024-01-04
    const now = new Date(2024, 0, 4);
    expect(startOfWeek(now)).toBe('2024-01-01');
  });

  it('treats Sunday as the end of the week, not the start', () => {
    // Sunday 2024-01-07
    const now = new Date(2024, 0, 7);
    expect(startOfWeek(now)).toBe('2024-01-01');
  });
});

describe('monthsAtRank', () => {
  it('counts whole months between two dates', () => {
    const now = new Date(2024, 5, 15);
    expect(monthsAtRank('2024-01-15', now)).toBe(5);
  });

  it('counts across year boundaries', () => {
    const now = new Date(2024, 1, 1);
    expect(monthsAtRank('2023-11-01', now)).toBe(3);
  });
});

describe('formatDate', () => {
  it('formats as "Mon D"', () => {
    expect(formatDate('2024-03-05')).toBe('Mar 5');
  });
});

describe('formatMonthYear', () => {
  it('formats as "Mon YYYY"', () => {
    expect(formatMonthYear('2024-03-05')).toBe('Mar 2024');
  });
});

describe('toUrl', () => {
  it('leaves a URL with http:// untouched', () => {
    expect(toUrl('http://example.com')).toBe('http://example.com');
  });

  it('leaves a URL with https:// untouched', () => {
    expect(toUrl('https://example.com')).toBe('https://example.com');
  });

  it('adds https:// to a bare domain', () => {
    expect(toUrl('instagram.com/yourgym')).toBe('https://instagram.com/yourgym');
  });
});
