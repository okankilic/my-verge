import { LocalNotifications } from '@capacitor/local-notifications';
import { BucketItem, RecurrenceType, ReminderConfig } from '../types';
import { isNative } from './platform';

/**
 * Play a delicate, meditative wooden chime sound using pure Web Audio API.
 * Guarantees zero broken external asset links or audio decode errors.
 */
export function playChimeSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    
    // Primary resonant tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.6); // A5

    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Harmonic bell overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now); // D6
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.3);
    osc2.stop(now + 0.9);
  } catch (err) {
    console.warn('Audio chime playback omitted:', err);
  }
}

// Permission state in browser terms: 'default' (not asked yet), 'granted', 'denied' or 'unsupported'
export async function getNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (isNative) {
    const { display } = await LocalNotifications.checkPermissions();
    return display === 'granted' || display === 'denied' ? display : 'default';
  }
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

/**
 * Request notification permission (system prompt on iOS/Android, browser prompt on the web)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (isNative) {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted' ? 'granted' : 'denied';
  }
  if (!('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

/**
 * Trigger browser Notification if permitted. On native, reminderScheduler has already scheduled it.
 */
export function sendBrowserNotification(title: string, body: string, icon?: string): void {
  if (isNative) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  try {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
    });
  } catch (err) {
    console.warn('Failed to dispatch notification:', err);
  }
}

// Date-only reminders (YYYY-MM-DD) fire at 9:00 local time rather than UTC midnight
export function reminderTime(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 9, 0);
  }
  return new Date(value);
}

// The k-th occurrence of a recurring reminder (k = 0 is the base date)
function occurrence(base: Date, recurrence: RecurrenceType, k: number): Date {
  const d = new Date(base);
  if (recurrence === 'daily') d.setDate(d.getDate() + k);
  else if (recurrence === 'weekly') d.setDate(d.getDate() + 7 * k);
  else if (recurrence === 'monthly' || recurrence === 'yearly') {
    // Clamp to the month's last day so Jan 31 recurs on Feb 28, not Mar 3
    const months = recurrence === 'monthly' ? k : 12 * k;
    const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    d.setFullYear(target.getFullYear(), target.getMonth(), Math.min(base.getDate(), lastDay));
  }
  return d;
}

const APPROX_PERIOD_MS: Record<RecurrenceType, number> = {
  none: Infinity,
  daily: 864e5,
  weekly: 7 * 864e5,
  monthly: 28 * 864e5,
  yearly: 365 * 864e5,
};

// Index of the most recent occurrence at or before `now` (caller ensures base <= now)
function latestIndex(base: Date, recurrence: RecurrenceType, now: number): number {
  if (recurrence === 'none') return 0;
  // Jump close to `now`, then step to the exact occurrence
  let k = Math.max(0, Math.floor((now - base.getTime()) / APPROX_PERIOD_MS[recurrence]));
  while (k > 0 && occurrence(base, recurrence, k).getTime() > now) k--;
  while (occurrence(base, recurrence, k + 1).getTime() <= now) k++;
  return k;
}

// Most recent occurrence at or before `now`, or null while the first one is still ahead
function latestOccurrence(reminder: ReminderConfig, now: number): number | null {
  const base = reminderTime(reminder.date);
  if (base.getTime() > now) return null;
  return occurrence(base, reminder.recurrence, latestIndex(base, reminder.recurrence, now)).getTime();
}

// When the reminder most recently came due (a passed snooze counts as coming due again), or null
export function reminderDueAt(reminder: ReminderConfig, now = Date.now()): number | null {
  const snooze = reminder.snoozedUntil ? new Date(reminder.snoozedUntil).getTime() : null;
  if (snooze !== null && snooze > now) return null;
  const latest = latestOccurrence(reminder, now);
  if (snooze === null) return latest;
  return latest === null ? snooze : Math.max(latest, snooze);
}

// Next time the reminder will fire after `now`, or null for a one-off that has already passed
export function reminderNextAt(reminder: ReminderConfig, now = Date.now()): number | null {
  const snooze = reminder.snoozedUntil ? new Date(reminder.snoozedUntil).getTime() : null;
  if (snooze !== null && snooze > now) return snooze;
  const base = reminderTime(reminder.date);
  if (base.getTime() > now) return base.getTime();
  if (reminder.recurrence === 'none') return null;
  const k = latestIndex(base, reminder.recurrence, now) + 1;
  return occurrence(base, reminder.recurrence, k).getTime();
}

// One-off reminders stay due until snoozed or completed; a recurring one is due only on the day it came due
export function isReminderDue(reminder: ReminderConfig, now = Date.now()): boolean {
  const dueAt = reminderDueAt(reminder, now);
  if (dueAt === null) return false;
  if (reminder.recurrence === 'none') return true;
  return new Date(dueAt).toDateString() === new Date(now).toDateString();
}

/**
 * Check which items are due for reminder
 */
export function getDueReminderItems(items: BucketItem[]): BucketItem[] {
  const now = Date.now();
  return items.filter(
    (item) => item.status === 'active' && item.reminder?.date && isReminderDue(item.reminder, now)
  );
}

// Due items whose current occurrence hasn't been alerted yet (chime/notification fire once per occurrence)
export function getUnnotifiedDueItems(items: BucketItem[]): BucketItem[] {
  const now = Date.now();
  return getDueReminderItems(items).filter((item) => {
    const last = item.reminder!.lastNotifiedAt;
    return !last || new Date(last).getTime() < reminderDueAt(item.reminder!, now)!;
  });
}

/**
 * Snooze helper functions
 */
export function calculateSnoozeDate(type: '1hour' | '1day' | '3days' | 'weekend' | '1week'): string {
  const date = new Date();
  if (type === '1hour') {
    date.setHours(date.getHours() + 1);
  } else if (type === '1day') {
    date.setDate(date.getDate() + 1);
  } else if (type === '3days') {
    date.setDate(date.getDate() + 3);
  } else if (type === '1week') {
    date.setDate(date.getDate() + 7);
  } else if (type === 'weekend') {
    // Jump to upcoming Saturday 10:00 AM
    const day = date.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    date.setDate(date.getDate() + diff);
    date.setHours(10, 0, 0, 0);
  }
  return date.toISOString();
}
