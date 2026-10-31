import { LocalNotifications, LocalNotificationSchema, Schedule } from '@capacitor/local-notifications';
import { BucketItem } from '../types';
import { isNative, stableIntId } from './platform';
import { reminderTime } from './notifications';

// Native only: reminders are handed to the OS so they fire while the app is closed.
// On the web, App.tsx's 30-second poll + browser Notification covers it instead.

function scheduleFor(item: BucketItem, now: number): Schedule | null {
  const reminder = item.reminder;
  if (!reminder?.date) return null;

  // A future snooze always wins, as a one-off
  if (reminder.snoozedUntil) {
    const snooze = new Date(reminder.snoozedUntil);
    if (snooze.getTime() > now) return { at: snooze, allowWhileIdle: true };
  }

  const at = reminderTime(reminder.date);
  const hour = at.getHours();
  const minute = at.getMinutes();
  switch (reminder.recurrence) {
    case 'daily':
      return { on: { hour, minute }, allowWhileIdle: true };
    case 'weekly':
      return { on: { weekday: at.getDay() + 1, hour, minute }, allowWhileIdle: true };
    case 'monthly':
      return { on: { day: at.getDate(), hour, minute }, allowWhileIdle: true };
    case 'yearly':
      return { on: { month: at.getMonth() + 1, day: at.getDate(), hour, minute }, allowWhileIdle: true };
    default:
      return at.getTime() > now ? { at, allowWhileIdle: true } : null;
  }
}

// Replace every pending OS notification with one per active item that has a reminder
export async function syncNativeReminders(items: BucketItem[]): Promise<void> {
  if (!isNative) return;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') return;

    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }

    const now = Date.now();
    const notifications: LocalNotificationSchema[] = [];
    items.forEach((item) => {
      if (item.status !== 'active') return;
      const schedule = scheduleFor(item, now);
      if (!schedule) return;
      notifications.push({
        id: stableIntId(item.id),
        title: item.title,
        body: "It's time for this wish!",
        schedule,
        extra: { itemId: item.id },
      });
    });

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch (err) {
    console.error('Failed to schedule reminders:', err);
  }
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
