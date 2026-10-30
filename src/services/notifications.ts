import { LocalNotifications } from '@capacitor/local-notifications';
import { BucketItem } from '../types';
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

/**
 * Check which items are due for reminder
 */
export function getDueReminderItems(items: BucketItem[]): BucketItem[] {
  const now = new Date().getTime();
  return items.filter((item) => {
    if (item.status !== 'active' || !item.reminder?.date) return false;

    // If snoozed until a future time, ignore until that time arrives
    if (item.reminder.snoozedUntil) {
      const snoozeTime = new Date(item.reminder.snoozedUntil).getTime();
      return snoozeTime <= now;
    }

    const reminderTime = new Date(item.reminder.date).getTime();
    return reminderTime <= now;
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
