import { LocalNotifications, LocalNotificationSchema, Schedule } from '@capacitor/local-notifications';
import { BucketItem } from '../types';
import { isNative, stableIntId } from './platform';
import { reminderTime, upcomingOccurrences } from './notifications';

// Native only: reminders are handed to the OS so they fire while the app is closed.
// On the web, App.tsx's 30-second poll + browser Notification covers it instead.

// iOS keeps at most 64 pending notifications and silently drops the rest
const MAX_PENDING = 64;
// One-off alerts queued ahead for a repeat the OS can't express on its own; the next sync tops them up
const ONE_OFF_AHEAD = 8;

interface Planned {
  notification: LocalNotificationSchema;
  firstAt: number; // when it fires next, to keep the soonest ones under MAX_PENDING
  primary: boolean; // the wish's next alert, kept ahead of extra queued ones
}

// A repeating OS schedule matches the in-app timing only once the first occurrence has passed (the OS
// can't wait for a start date) and on days every month (or year) has: the app clamps the 29th-31st
// to the month's last day, while the OS would skip months without them.
function repeatingSchedule(base: Date, recurrence: string, now: number): Schedule | null {
  if (base.getTime() > now) return null;
  const hour = base.getHours();
  const minute = base.getMinutes();
  const day = base.getDate();
  switch (recurrence) {
    case 'daily':
      return { on: { hour, minute }, allowWhileIdle: true };
    case 'weekly':
      return { on: { weekday: base.getDay() + 1, hour, minute }, allowWhileIdle: true };
    case 'monthly':
      return day <= 28 ? { on: { day, hour, minute }, allowWhileIdle: true } : null;
    case 'yearly':
      return base.getMonth() === 1 && day === 29
        ? null
        : { on: { month: base.getMonth() + 1, day, hour, minute }, allowWhileIdle: true };
    default:
      return null;
  }
}

function planFor(item: BucketItem, now: number): Planned[] {
  const reminder = item.reminder;
  if (!reminder?.date) return [];
  const base = reminderTime(reminder.date);
  if (Number.isNaN(base.getTime())) return []; // a damaged date must not break everyone else's alerts

  const make = (index: number, schedule: Schedule, firstAt: number): Planned => ({
    notification: {
      id: stableIntId(index === 0 ? item.id : `${item.id}#${index}`),
      title: item.title,
      body: "It's time for this plan!",
      schedule,
      extra: { itemId: item.id },
    },
    firstAt,
    primary: index === 0,
  });
  const oneOffs = (times: Date[], startIndex: number) =>
    times.map((at, i) => make(startIndex + i, { at, allowWhileIdle: true }, at.getTime()));

  // A future snooze fires once, and a repeat picks up again with its occurrences after it
  const snooze = reminder.snoozedUntil ? new Date(reminder.snoozedUntil).getTime() : NaN;
  if (snooze > now) {
    const after = reminder.recurrence === 'none' ? [] : upcomingOccurrences(reminder, snooze, ONE_OFF_AHEAD - 1);
    return oneOffs([new Date(snooze), ...after], 0);
  }

  const repeating = repeatingSchedule(base, reminder.recurrence, now);
  if (repeating) {
    const next = upcomingOccurrences(reminder, now, 1)[0];
    return next ? [make(0, repeating, next.getTime())] : [];
  }
  // One-offs, repeats that haven't started yet, and month-end days: explicit alerts
  return oneOffs(upcomingOccurrences(reminder, now, reminder.recurrence === 'none' ? 1 : ONE_OFF_AHEAD), 0);
}

// Replace every pending OS notification with the alerts for each active item that has a reminder
async function syncOnce(items: BucketItem[]): Promise<void> {
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== 'granted') return;

  const now = Date.now();
  const planned = items.filter((item) => item.status === 'active').flatMap((item) => planFor(item, now));
  // Each wish's next alert first, then extra queued ones, soonest first within each
  planned.sort((a, b) => Number(b.primary) - Number(a.primary) || a.firstAt - b.firstAt);
  const notifications = planned.slice(0, MAX_PENDING).map((p) => p.notification);

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
  if (notifications.length === 0) return;
  try {
    await LocalNotifications.schedule({ notifications });
  } catch (err) {
    // Don't let one notification the OS rejects leave every wish without its alerts
    console.error('Failed to schedule reminders together, trying one by one:', err);
    for (const notification of notifications) {
      await LocalNotifications.schedule({ notifications: [notification] }).catch((e) =>
        console.error(`Failed to schedule the reminder for "${notification.title}":`, e)
      );
    }
  }
}

// Syncs run one at a time, and calls made during a sync collapse into one more run with the latest
// items, so an older sync can never finish after a newer one and bring back stale alerts.
let latestItems: BucketItem[] | null = null;
let running: Promise<void> | null = null;

export function syncNativeReminders(items: BucketItem[]): Promise<void> {
  if (!isNative) return Promise.resolve();
  latestItems = items;
  if (!running) {
    running = (async () => {
      try {
        while (latestItems) {
          const next = latestItems;
          latestItems = null;
          await syncOnce(next).catch((err) => console.error('Failed to schedule reminders:', err));
        }
      } finally {
        running = null;
      }
    })();
  }
  return running;
}

// Call back with the item ID when the user taps a reminder notification
export function onReminderTapped(handler: (itemId: string) => void): () => void {
  if (!isNative) return () => {};
  const listener = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const itemId = action.notification.extra?.itemId;
    if (typeof itemId === 'string') handler(itemId);
  });
  return () => {
    listener.then((l) => l.remove());
  };
}
