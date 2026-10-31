// Calendar-aligned time ranges in local time; weeks start on Monday.
export type TimeRange =
  | 'all'
  | 'this-week'
  | 'last-week'
  | 'this-month'
  | 'last-month'
  | 'this-year'
  | 'last-year'
  | `year:${number}`;

export const PRESET_RANGES: TimeRange[] = [
  'all',
  'this-week',
  'last-week',
  'this-month',
  'last-month',
  'this-year',
  'last-year',
];

const LABELS: Record<string, string> = {
  all: 'All time',
  'this-week': 'This week',
  'last-week': 'Last week',
  'this-month': 'This month',
  'last-month': 'Last month',
  'this-year': 'This year',
  'last-year': 'Last year',
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

// Half-open [start, end); null means no bounds
export const rangeBounds = (range: TimeRange, now = new Date()): [Date, Date] | null => {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (range) {
    case 'all':
      return null;
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

export const isInRange = (iso: string | undefined, range: TimeRange, now = new Date()) => {
  const bounds = rangeBounds(range, now);
  if (!bounds) return true;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= bounds[0].getTime() && t < bounds[1].getTime();
};

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
