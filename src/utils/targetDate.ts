import { BucketItem } from '../types';
import { isReminderDue, reminderNextAt } from '../services/notifications';

// An Until target date as a timestamp. A date-only value is read as local midnight, so it lands on
// the picked day in every time zone; an unreadable value gives null.
export const targetDateTime = (item: Pick<BucketItem, 'targetDate'>): number | null => {
  const value = item.targetDate?.trim();
  if (!value) return null;
  const time = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00` : value).getTime();
  return Number.isNaN(time) ? null : time;
};

// The time a plan sits at on the Horizon: now while its reminder is due, else its next alert,
// else its Until date; null when it has none of these. The Horizon time filter goes by this.
export const horizonTime = (
  item: Pick<BucketItem, 'reminder' | 'targetDate'>,
  now = Date.now()
): number | null => {
  const reminder = item.reminder?.date ? item.reminder : undefined;
  if (reminder) {
    if (isReminderDue(reminder, now)) return now;
    const next = reminderNextAt(reminder, now);
    if (next !== null) return next;
  }
  return targetDateTime(item);
};
