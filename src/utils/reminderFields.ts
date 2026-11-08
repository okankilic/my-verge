import { RecurrenceType } from '../types';
import { reminderTime } from '../services/notifications';

export interface ReminderParts {
  time: string; // HH:mm
  weekday: number; // 0 is Sunday, as Date.getDay
  day: number; // Day of the month
  month: number; // 0 is January, as Date.getMonth
}

export type RepeatingRecurrence = Exclude<RecurrenceType, 'none'>;

const pad = (n: number) => String(n).padStart(2, '0');

const toLocalValue = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// The longest a month can run (February counts as 29), for the Yearly day list
export const maxDaysInMonth = (month: number) => new Date(2024, month + 1, 0).getDate();

// An empty or unreadable value starts at 09:00 today, the app's default time for a date with no time
export function readReminderParts(value: string, now = new Date()): ReminderParts {
  const d = value ? reminderTime(value) : new Date(NaN);
  if (Number.isNaN(d.getTime())) {
    return { time: '09:00', weekday: now.getDay(), day: now.getDate(), month: now.getMonth() };
  }
  return {
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    weekday: d.getDay(),
    day: d.getDate(),
    month: d.getMonth(),
  };
}

// The first moment after now that matches the parts: the stored first occurrence of a repeating reminder
export function nextReminderDate(
  recurrence: RepeatingRecurrence,
  parts: ReminderParts,
  now = new Date()
): string {
  const [hours, minutes] = parts.time.split(':').map(Number);
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const at = (y: number, m: number, d: number) => new Date(y, m, d, hours, minutes);
  const range = (n: number) => Array.from({ length: n }, (_, i) => i);

  let candidates: Date[];
  if (recurrence === 'daily') {
    candidates = range(2).map((i) => at(year, month, date + i));
  } else if (recurrence === 'weekly') {
    candidates = range(8)
      .map((i) => at(year, month, date + i))
      .filter((d) => d.getDay() === parts.weekday);
  } else if (recurrence === 'monthly') {
    // A month without this day rolls into the next one, so the filter skips it
    candidates = range(13)
      .map((i) => at(year, month + i, parts.day))
      .filter((d) => d.getDate() === parts.day);
  } else {
    candidates = range(2).map((i) => {
      const lastDay = new Date(year + i, parts.month + 1, 0).getDate();
      return at(year + i, parts.month, Math.min(parts.day, lastDay));
    });
  }
  return toLocalValue(candidates.find((d) => d.getTime() > now.getTime()) ?? candidates[candidates.length - 1]);
}
