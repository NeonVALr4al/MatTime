/** Parses a "YYYY-MM-DD" date-only string as a local calendar date (midnight local time),
 * avoiding the UTC-midnight interpretation `new Date(dateStr)` gives date-only strings —
 * which shifts the calendar date by a day in any timezone away from UTC. */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Formats a Date as a local "YYYY-MM-DD" string (not UTC, unlike toISOString()). */
function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formats a 24-hour "HH:MM" time string as "H:MM AM/PM". */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Next upcoming Date for a given day-of-week (0=Sunday) and "HH:MM" start time, relative to now. */
export function nextOccurrence(dayOfWeek: number, startTime: string, now: Date = new Date()): Date {
  const [h, m] = startTime.split(':').map(Number);
  const result = new Date(now);
  result.setDate(now.getDate() + ((dayOfWeek - now.getDay() + 7) % 7));
  result.setHours(h, m, 0, 0);
  if (result < now) result.setDate(result.getDate() + 7);
  return result;
}

/** Relative day label ("Today", "Yesterday", "N days ago") for a date string. */
export function timeAgo(dateStr: string, today: Date = new Date()): string {
  const date = parseLocalDate(dateStr);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((todayMidnight.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

/** ISO date (YYYY-MM-DD) of the Monday of the current week, relative to now. */
export function startOfWeek(now: Date = new Date()): string {
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  return toLocalISODate(monday);
}

/** Whole months elapsed between a date string and now. */
export function monthsAtRank(dateStr: string, now: Date = new Date()): number {
  const then = parseLocalDate(dateStr);
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

/** Formats a date string as "Jan 1" style. */
export function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Formats a date string as "Jan 2024" style. */
export function formatMonthYear(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Prefixes "https://" onto a value if it doesn't already have a protocol. */
export function toUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
