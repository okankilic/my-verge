import React, { useEffect, useState } from 'react';
import { Bell, BellOff, AlertTriangle } from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';
import {
  getNotificationPermission,
  requestNotificationPermission,
  isReminderDue,
  reminderDueAt,
  reminderNextAt,
} from '../services/notifications';
import { ItemActions } from './ItemActions';

interface ReminderRadarViewProps {
  items: BucketItem[];
  categories: CategoryDefinition[];
  onSnooze: (item: BucketItem, days: number) => void;
  onToggleComplete: (item: BucketItem) => void;
  onToggleStarted: (item: BucketItem) => void;
  onDelete: (id: string) => void;
  onSelect: (item: BucketItem) => void;
  onNotificationsEnabled: () => void;
}

export const ReminderRadarView: React.FC<ReminderRadarViewProps> = ({
  items,
  categories,
  onSnooze,
  onToggleComplete,
  onToggleStarted,
  onDelete,
  onSelect,
  onNotificationsEnabled,
}) => {
  const [notificationState, setNotificationState] = useState<string>('unsupported');

  useEffect(() => {
    getNotificationPermission().then(setNotificationState);
  }, []);

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotificationState(res);
    if (res === 'granted') onNotificationsEnabled();
  };

  const activeItemsWithReminders = items.filter(
    (item) => item.status === 'active' && item.reminder?.date
  );

  const now = Date.now();

  // Sort and classify: due (with the time it came due) vs upcoming (with its next alert time)
  const dueItems: BucketItem[] = [];
  const upcomingItems: BucketItem[] = [];
  const alertTimes = new Map<string, number>();

  activeItemsWithReminders.forEach((item) => {
    const reminder = item.reminder!;
    if (isReminderDue(reminder, now)) {
      dueItems.push(item);
      alertTimes.set(item.id, reminderDueAt(reminder, now)!);
      return;
    }
    const next = reminderNextAt(reminder, now);
    if (next !== null) {
      upcomingItems.push(item);
      alertTimes.set(item.id, next);
    }
  });

  // Sort upcoming chronologically
  upcomingItems.sort((a, b) => alertTimes.get(a.id)! - alertTimes.get(b.id)!);

  const reminderDate = (item: BucketItem) => new Date(alertTimes.get(item.id)!);

  const formatReminderDate = (item: BucketItem) =>
    reminderDate(item).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  // Group upcoming (already chronological) by local calendar day
  const todayKey = new Date().toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toDateString();
  const currentYear = new Date().getFullYear();

  const upcomingGroups: { key: string; label: string; items: BucketItem[] }[] = [];
  upcomingItems.forEach((item) => {
    const date = reminderDate(item);
    const key = date.toDateString();
    const last = upcomingGroups[upcomingGroups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
      return;
    }
    const label =
      key === todayKey
        ? 'Today'
        : key === tomorrowKey
          ? 'Tomorrow'
          : date.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              ...(date.getFullYear() !== currentYear && { year: 'numeric' }),
            });
    upcomingGroups.push({ key, label, items: [item] });
  });

  // Timeline entry: rail marker + schedule label, then a card mirroring ItemRow:
  // Category row + Icon, Title, extras, action row
  const renderEntry = (
    item: BucketItem,
    tone: 'due' | 'scheduled',
    schedule: React.ReactNode,
    extras?: React.ReactNode
  ) => {
    const cat = categories.find((c) => c.id === item.categoryId);
    return (
      <div key={item.id} className="relative">
        {/* Timeline marker */}
        <span
          aria-hidden
          className="absolute -left-[25.5px] top-1 w-3 h-3 rounded-full ring-4 ring-page"
          style={{
            backgroundColor: tone === 'due' ? '#C05621' : cat?.accentColor || 'var(--color-ink)',
          }}
        />
        <div className="text-[11px] leading-5 mb-1.5 truncate">{schedule}</div>
        <article
          onClick={() => onSelect(item)}
          className={`border rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 space-y-1 cursor-pointer shadow-[var(--item-shadow)] transition-all duration-150 ${
            tone === 'due'
              ? 'bg-warm border-[#C05621]/30 hover:border-[#C05621]/50'
              : 'bg-card border-ink/12 hover:border-ink/25'
          }`}
        >
          {/* Category + Sub-category | Icon (same as ItemRow) */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1 flex items-baseline gap-1.5 min-w-0">
              <span className="shrink-0 text-[11px] uppercase tracking-wider text-ink/60 font-semibold leading-tight">
                {cat?.verb || item.categoryId}
              </span>
              {item.subCategory && (
                <span className="text-[11px] text-ink/40 font-medium leading-tight truncate">
                  · {item.subCategory}
                </span>
              )}
            </div>
            <span
              className="shrink-0 ml-2"
              style={{ color: cat?.accentColor || 'var(--color-ink)' }}
            >
              {renderCategoryIcon(cat?.icon || item.categoryId, 'w-3.5 h-3.5')}
            </span>
          </div>
          <h4 className="font-serif-journal text-[15px] sm:text-base font-medium tracking-tight text-ink leading-snug line-clamp-2">
            {item.title}
          </h4>
          {extras && <div className="pt-1">{extras}</div>}
          <ItemActions
            item={item}
            onToggleStarted={onToggleStarted}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
          />
        </article>
      </div>
    );
  };

  const snoozeChip = (item: BucketItem, days: number, label: string) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSnooze(item, days);
      }}
      title={`Snooze ${label}`}
      className="min-h-[44px] px-3 text-xs font-medium bg-card border border-ink/15 rounded-md text-ink/80 hover:bg-paper transition-colors"
    >
      +{label}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Enable-alerts prompt (only while the browser hasn't been asked yet) */}
      {notificationState === 'default' && (
        <div className="bg-warm border border-[#C05621]/30 rounded-lg px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs text-ink/75 min-w-0">
            <Bell className="w-3.5 h-3.5 shrink-0 text-[#C05621]" />
            <span>Turn on alerts to get reminder notifications</span>
          </span>
          <button
            onClick={handleEnableNotifications}
            className="shrink-0 min-h-[44px] px-3 text-xs font-semibold rounded-md bg-ink text-paper hover:bg-ink/85 transition-colors"
          >
            Enable
          </button>
        </div>
      )}
      {notificationState === 'denied' && (
        <p className="flex items-center gap-2 px-1 text-[11px] text-ink/55">
          <BellOff className="w-3.5 h-3.5 shrink-0" />
          <span>Alerts are turned off in your system settings.</span>
        </p>
      )}

      {/* Reminders timeline: Due first, then upcoming grouped by day */}
      {(dueItems.length > 0 || upcomingGroups.length > 0) && (
        <div className="relative pl-8">
          {/* Timeline rail */}
          <div aria-hidden className="absolute left-3 top-2 bottom-2 w-px bg-ink/15" />

          <div className="space-y-8">
            {dueItems.length > 0 && (
              <section className="space-y-4">
                <div className="relative flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#C05621]">
                  <span
                    aria-hidden
                    className="absolute -left-[23.5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#C05621] ring-4 ring-page"
                  />
                  <AlertTriangle className="w-4 h-4" />
                  <span>Due ({dueItems.length})</span>
                </div>

                {dueItems.map((item) =>
                  renderEntry(
                    item,
                    'due',
                    <>
                      <span className="font-mono font-medium text-[#B45309]">{formatReminderDate(item)}</span>
                      <span className="font-semibold text-[#C05621]"> · Due now</span>
                    </>,
                    <div className="flex items-center gap-1.5">
                      {snoozeChip(item, 1, '1d')}
                      {snoozeChip(item, 7, '1w')}
                    </div>
                  )
                )}
              </section>
            )}

            {upcomingGroups.map((group) => (
              <section key={group.key} className="space-y-4">
                <div className="relative flex items-baseline gap-2">
                  <span
                    aria-hidden
                    className="absolute -left-[23.5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-ink ring-4 ring-page"
                  />
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-ink/70">
                    {group.label}
                  </h3>
                  <span className="font-mono text-[11px] text-ink/50">{group.items.length}</span>
                </div>

                {group.items.map((item) =>
                  renderEntry(
                    item,
                    'scheduled',
                    <>
                      <span className="font-mono font-medium text-[#B45309]">
                        {reminderDate(item).toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      {item.reminder?.recurrence && item.reminder.recurrence !== 'none' && (
                        <span className="text-ink/40"> · {item.reminder.recurrence}</span>
                      )}
                    </>
                  )
                )}
              </section>
            ))}
          </div>
        </div>
      )}

      {/* Empty state: nothing due and nothing scheduled */}
      {dueItems.length === 0 && upcomingItems.length === 0 && (
        <div className="p-8 text-center bg-card border border-ink/10 rounded-xl">
          <p className="font-serif-journal text-base text-ink/70">
            No reminders scheduled
          </p>
          <p className="text-xs text-ink/50 mt-1 max-w-sm mx-auto">
            Add a reminder date to any item in your journal to receive gentle alerts and timed reflections.
          </p>
        </div>
      )}
    </div>
  );
};
