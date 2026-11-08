import React, { useEffect, useState } from 'react';
import { Bell, BellOff, AlertTriangle, Sunrise } from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { EmptyState } from './EmptyState';
import { renderCategoryIcon, categoryColor } from '../utils/categoryIcons';
import {
  getNotificationPermission,
  requestNotificationPermission,
  isReminderDue,
  reminderDueAt,
  reminderNextAt,
} from '../services/notifications';
import { ItemActions } from './ItemActions';
import { targetDateTime } from '../utils/targetDate';
import { HORIZON_RANGES, TimeRange, rangeLabel } from '../utils/timeRange';
import { TimeRangeFilter } from './TimeRangeFilter';

interface ReminderHorizonViewProps {
  items: BucketItem[];
  categories: CategoryDefinition[];
  onToggleComplete: (item: BucketItem) => void;
  onStart: (item: BucketItem) => void;
  onDelete: (id: string) => void;
  onSelect: (item: BucketItem) => void;
  onNotificationsEnabled: () => void;
  // The time filter; App.tsx already narrows items to it
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  isRangeOpen: boolean;
  onOpenRange: () => void;
  onCloseRange: () => void;
  // Set while search or a category pick hides plans
  onClearFilters?: () => void;
}

export const ReminderHorizonView: React.FC<ReminderHorizonViewProps> = ({
  items,
  categories,
  onToggleComplete,
  onStart,
  onDelete,
  onSelect,
  onNotificationsEnabled,
  range,
  onRangeChange,
  isRangeOpen,
  onOpenRange,
  onCloseRange,
  onClearFilters,
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

  const now = Date.now();

  // Sort and classify: due (with the time it came due) vs upcoming (with its next alert time).
  // A wish with only an Until date (or a reminder that can't be read) is placed on its target day.
  const dueItems: BucketItem[] = [];
  const upcomingItems: BucketItem[] = [];
  const alertTimes = new Map<string, number>();
  const targetOnly = new Set<string>();

  items.forEach((item) => {
    if (item.status !== 'active') return;
    const reminder = item.reminder?.date ? item.reminder : undefined;
    if (reminder) {
      if (isReminderDue(reminder, now)) {
        dueItems.push(item);
        alertTimes.set(item.id, reminderDueAt(reminder, now)!);
        return;
      }
      const next = reminderNextAt(reminder, now);
      if (next !== null) {
        upcomingItems.push(item);
        alertTimes.set(item.id, next);
        return;
      }
    }
    const target = targetDateTime(item);
    if (target !== null) {
      upcomingItems.push(item);
      alertTimes.set(item.id, target);
      targetOnly.add(item.id);
    }
  });

  const formatTargetDay = (item: BucketItem) => {
    const target = targetDateTime(item);
    return target === null
      ? null
      : new Date(target).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

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
            backgroundColor: tone === 'due' ? '#C05621' : categoryColor(cat?.accentColor),
          }}
        />
        <div className="text-[11px] leading-5 mb-1.5 truncate">{schedule}</div>
        <article
          onClick={() => onSelect(item)}
          className={`border rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 space-y-1 cursor-pointer shadow-[var(--item-shadow)] transition-all duration-150 ${
            tone === 'due'
              ? 'bg-warm border-alert/30 hover:border-alert/50'
              : 'bg-card border-ink/12 hover:border-ink/25'
          }`}
        >
          {/* Icon | Category (same as ItemRow) */}
          <div className="flex items-center gap-1.5">
            <span
              className="shrink-0"
              style={{ color: categoryColor(cat?.accentColor) }}
            >
              {renderCategoryIcon(cat?.icon || item.categoryId, 'w-3.5 h-3.5')}
            </span>
            <div className="flex-1 flex items-baseline gap-1.5 min-w-0">
              <span className="shrink-0 text-[11px] uppercase tracking-wider text-ink/60 font-semibold leading-tight">
                {cat?.verb || item.categoryId}
              </span>
            </div>
          </div>
          <h4 className="font-serif-journal text-[15px] sm:text-base font-medium tracking-tight text-ink leading-snug line-clamp-2">
            {item.title}
          </h4>
          {extras && <div className="pt-1">{extras}</div>}
          <ItemActions
            item={item}
            onStart={onStart}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
          />
        </article>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <TimeRangeFilter
        id="horizon"
        range={range}
        options={HORIZON_RANGES}
        onChange={onRangeChange}
        isOpen={isRangeOpen}
        onOpen={onOpenRange}
        onClose={onCloseRange}
        ariaLabel="Filter the Horizon by time"
        sheetTitle="Show plans for"
      />

      {/* Enable-alerts prompt (only while the browser hasn't been asked yet) */}
      {notificationState === 'default' && (
        <div className="bg-warm border border-alert/30 rounded-lg px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs text-ink/75 min-w-0">
            <Bell className="w-3.5 h-3.5 shrink-0 text-alert" />
            <span>Turn on alerts to get a nudge when a reminder is due.</span>
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
          <span>Alerts are off. Turn them on in your system settings.</span>
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
                <div className="relative flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-alert">
                  <span
                    aria-hidden
                    className="absolute -left-[23.5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#C05621] ring-4 ring-page"
                  />
                  <AlertTriangle className="w-4 h-4" />
                  <span>Due</span>
                  <span className="font-mono text-[11px] font-normal text-alert/70">{dueItems.length}</span>
                </div>

                {dueItems.map((item) =>
                  renderEntry(
                    item,
                    'due',
                    <>
                      <span className="font-mono font-medium text-accent">{formatReminderDate(item)}</span>
                      <span className="font-semibold text-alert"> · Due now</span>
                      {formatTargetDay(item) && (
                        <span className="text-ink/40"> · until {formatTargetDay(item)}</span>
                      )}
                    </>
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
                    targetOnly.has(item.id) ? (
                      <span className="font-mono font-medium text-accent">Until</span>
                    ) : (
                      <>
                        <span className="font-mono font-medium text-accent">
                          {reminderDate(item).toLocaleTimeString(undefined, {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                        {item.reminder?.recurrence && item.reminder.recurrence !== 'none' && (
                          <span className="text-ink/40"> · {item.reminder.recurrence}</span>
                        )}
                        {formatTargetDay(item) && (
                          <span className="text-ink/40"> · until {formatTargetDay(item)}</span>
                        )}
                      </>
                    )
                  )
                )}
              </section>
            ))}
          </div>
        </div>
      )}

      {/* Empty state: nothing due and nothing scheduled */}
      {dueItems.length === 0 && upcomingItems.length === 0 && (
        <EmptyState
          icon={<Sunrise className="w-6 h-6 stroke-[1.5]" />}
          title={range === 'all' ? 'All clear for now' : `${rangeLabel(range)} is all clear`}
          hint={
            range === 'all'
              ? 'Add a reminder or an Until date to a plan and it shows up here.'
              : 'Try another time range to see more.'
          }
          onClearFilters={onClearFilters}
        />
      )}
    </div>
  );
};
