import { BucketItem } from '../types';

// An Until target date as a timestamp. A date-only value is read as local midnight, so it lands on
// the picked day in every time zone; an unreadable value gives null.
export const targetDateTime = (item: Pick<BucketItem, 'targetDate'>): number | null => {
  const value = item.targetDate?.trim();
  if (!value) return null;
  const time = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00` : value).getTime();
  return Number.isNaN(time) ? null : time;
};
