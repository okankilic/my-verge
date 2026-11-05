// Calendar-aligned time ranges in local time; weeks start on Monday.
export type TimeRange =
  | 'all'
  | 'today'
  | 'this-week'
  | 'last-week'
  | 'this-month'
  | 'last-month'
  | 'this-year'
  | 'last-year'
  | 'next-3-months'
  | 'next-6-months'
  | `year:${number}`;

// The Vault looks back
export const VAULT_RANGES: TimeRange[] = [
  'all',
  'this-week',
  'last-week',
  'this-month',
  'last-month',
  'this-year',
  'last-year',
];

// The Horizon looks ahead
export const HORIZON_RANGES: TimeRange[] = [
  'all',
  'today',
  'this-week',
  'this-month',
  'next-3-months',
  'next-6-months',
  'this-year',
];

const LABELS: Record<string, string> = {
  all: 'All time',
  today: 'Today',
  'this-week': 'This week',
  'last-week': 'Last week',
  'this-month': 'This month',
  'last-month': 'Last month',
  'this-year': 'This year',
  'last-year': 'Last year',
  'next-3-months': 'In three months',
  'next-6-months': 'In six months',
};

export const rangeLabel = (range: TimeRange) =>
  range.startsWith('year:') ? range.slice(5) : LABELS[range];

const startOfWeek = (d: Date) => {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
};

const addDays = (d: Date, days: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

// The same day some months later, clamped to the month's end (Nov 30 + 3 months is Feb 28)
const addMonths = (d: Date, months: number) => {
  const lastDay = new Date(d.getFullYear(), d.getMonth() + months + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + months, Math.min(d.getDate(), lastDay));
};

// Half-open [start, end); null means no bounds
export const rangeBounds = (range: TimeRange, now = new Date()): [Date, Date] | null => {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (range) {
    case 'all':
      return null;
    case 'today': {
      const start = addDays(now, 0);
      return [start, addDays(start, 1)];
    }
    case 'next-3-months':
    case 'next-6-months': {
      // From the start of today up to and including the same day 3 or 6 months ahead
      const start = addDays(now, 0);
      return [start, addDays(addMonths(start, range === 'next-3-months' ? 3 : 6), 1)];
    }
    case 'this-week': {
      const start = startOfWeek(now);
      return [start, addDays(start, 7)];
    }
    case 'last-week': {
      const start = addDays(startOfWeek(now), -7);
      return [start, addDays(start, 7)];
    }
    case 'this-month':
      return [new Date(y, m, 1), new Date(y, m + 1, 1)];
    case 'last-month':
      return [new Date(y, m - 1, 1), new Date(y, m, 1)];
    case 'this-year':
      return [new Date(y, 0, 1), new Date(y + 1, 0, 1)];
    case 'last-year':
      return [new Date(y - 1, 0, 1), new Date(y, 0, 1)];
    default: {
      const year = Number(range.slice(5));
      return [new Date(year, 0, 1), new Date(year + 1, 0, 1)];
    }
  }
};

// The same test for a timestamp; null (no readable time) is only in All time
export const isTimeInRange = (time: number | null, range: TimeRange, now = new Date()) => {
  const bounds = rangeBounds(range, now);
  if (!bounds) return true;
  if (time === null || Number.isNaN(time)) return false;
  return time >= bounds[0].getTime() && time < bounds[1].getTime();
};

export const isInRange = (iso: string | undefined, range: TimeRange, now = new Date()) =>
  isTimeInRange(iso ? new Date(iso).getTime() : null, range, now);

// Years before last year that have a date, newest first (this and last year are presets)
export const earlierYears = (dates: (string | undefined)[], now = new Date()): TimeRange[] => {
  const cutoff = now.getFullYear() - 1;
  const years = new Set<number>();
  dates.forEach((iso) => {
    if (!iso) return;
    const year = new Date(iso).getFullYear();
    if (!Number.isNaN(year) && year < cutoff) years.add(year);
  });
  return [...years].sort((a, b) => b - a).map((year) => `year:${year}` as TimeRange);
};
