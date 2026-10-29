import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  CheckCircle2,
  Volume2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';
import {
  playChimeSound,
  requestNotificationPermission,
  calculateSnoozeDate,
} from '../services/notifications';

interface ReminderRadarViewProps {
  items: BucketItem[];
  categories: CategoryDefinition[];
  onSnooze: (item: BucketItem, days: number) => void;
  onCustomSnooze: (item: BucketItem, dateIso: string) => void;
  onToggleComplete: (item: BucketItem) => void;
  onEdit: (item: BucketItem) => void;
}

export const ReminderRadarView: React.FC<ReminderRadarViewProps> = ({
  items,
  categories,
  onSnooze,
  onCustomSnooze,
  onToggleComplete,
  onEdit,
}) => {
  const [notificationState, setNotificationState] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotificationState(res);
  };

  const activeItemsWithReminders = items.filter(
    (item) => item.status === 'active' && item.reminder?.date
  );

  const now = new Date().getTime();

  // Sort and classify
  const dueItems: BucketItem[] = [];
  const upcomingItems: BucketItem[] = [];

  activeItemsWithReminders.forEach((item) => {
    const effectiveTime = item.reminder?.snoozedUntil
      ? new Date(item.reminder.snoozedUntil).getTime()
      : new Date(item.reminder!.date).getTime();

    if (effectiveTime <= now) {
      dueItems.push(item);
    } else {
      upcomingItems.push(item);
    }
  });

  // Sort upcoming chronologically
  upcomingItems.sort((a, b) => {
    const timeA = new Date(a.reminder?.snoozedUntil || a.reminder!.date).getTime();
    const timeB = new Date(b.reminder?.snoozedUntil || b.reminder!.date).getTime();
    return timeA - timeB;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card & System Controls */}
      <div className="bg-white border border-[#1E1915]/10 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-journal text-xl font-medium text-[#1E1915]">
                Reminder Radar
              </span>
              <span className="text-xs px-2 py-0.5 bg-[#FAF7F2] border border-[#1E1915]/15 rounded-full font-mono text-[#1E1915]/70">
                {activeItemsWithReminders.length} Active Alerts
              </span>
            </div>
            <p className="text-xs text-[#1E1915]/65 mt-1 leading-relaxed">
              Gentle prompts and timed nudges to keep your intentions alive without pressure.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Play Sound Chime Test */}
            <button
              onClick={() => playChimeSound()}
              title="Test audio chime"
              className="min-h-[44px] px-3 py-2 rounded-xl border border-[#1E1915]/15 text-xs text-[#1E1915]/80 hover:bg-[#FAF7F2] flex items-center gap-1.5 transition-colors"
            >
              <Volume2 className="w-4 h-4 text-[#B45309]" />
              <span className="hidden sm:inline">Chime Preview</span>
            </button>

            {/* Notification Permission Trigger */}
            {notificationState !== 'granted' && (
              <button
                onClick={handleEnableNotifications}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1E1915] text-white text-xs font-medium hover:bg-[#332b24] transition-colors flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Alerts</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Due Alerts Section */}
      {dueItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#C05621]">
            <AlertTriangle className="w-4 h-4" />
            <span>Due for Attention ({dueItems.length})</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {dueItems.map((item) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              return (
                <div
                  key={item.id}
                  className="bg-[#FFFDF9] border border-[#C05621]/30 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium flex items-center gap-1.5">
                      <span
                        className="flex items-center gap-1 font-semibold"
                        style={{ color: cat?.accentColor || '#C05621' }}
                      >
                        {renderCategoryIcon(cat?.icon || item.categoryId, 'w-3 h-3')}
                        <span>{cat?.name || item.categoryId}</span>
                      </span>
                      {item.subCategory && (
                        <>
                          <span>·</span>
                          <span className="text-[#1E1915]/60">{item.subCategory}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="font-semibold text-[#C05621]">Due Now</span>
                    </div>
                    <h4 className="font-serif-journal text-base font-medium text-[#1E1915]">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-[#1E1915]/70 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Snooze 1 day */}
                    <button
                      onClick={() => onSnooze(item, 1)}
                      className="min-h-[44px] px-3 py-1.5 bg-white border border-[#1E1915]/15 text-xs text-[#1E1915] font-medium rounded-xl hover:bg-[#FAF7F2] transition-colors"
                    >
                      +1 Day
                    </button>
                    {/* Snooze 1 week */}
                    <button
                      onClick={() => onSnooze(item, 7)}
                      className="min-h-[44px] px-3 py-1.5 bg-white border border-[#1E1915]/15 text-xs text-[#1E1915] font-medium rounded-xl hover:bg-[#FAF7F2] transition-colors"
                    >
                      +1 Week
                    </button>
                    {/* Mark Done */}
                    <button
                      onClick={() => onToggleComplete(item)}
                      className="min-h-[44px] px-3.5 py-1.5 bg-[#4A6B56] text-white text-xs font-semibold rounded-xl hover:bg-[#3e5948] transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accomplish</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming Reminders Timeline */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#1E1915]/60">
          <Clock className="w-4 h-4" />
          <span>Scheduled Radar ({upcomingItems.length})</span>
        </div>

        {upcomingItems.length === 0 ? (
          <div className="p-8 text-center bg-white border border-[#1E1915]/10 rounded-2xl">
            <p className="font-serif-journal text-base text-[#1E1915]/70">
              No upcoming scheduled reminders
            </p>
            <p className="text-xs text-[#1E1915]/50 mt-1 max-w-sm mx-auto">
              Add a reminder date to any item in your journal to receive gentle alerts and timed reflections.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingItems.map((item) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              const dateVal = item.reminder?.snoozedUntil || item.reminder!.date;
              const formattedDate = new Date(dateVal).toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="bg-white border border-[#1E1915]/10 rounded-xl p-3.5 sm:p-4 hover:border-[#1E1915]/25 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-[11px] text-[#1E1915]/60 flex items-center gap-1.5 mb-0.5">
                      <span className="font-mono text-[#B45309] font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </span>
                      <span>·</span>
                      <span
                        className="flex items-center gap-1 font-semibold text-[#1E1915]/80"
                        style={{ color: cat?.accentColor }}
                      >
                        {renderCategoryIcon(cat?.icon || item.categoryId, 'w-3 h-3')}
                        <span>{cat?.name || item.categoryId}</span>
                      </span>
                      {item.subCategory && (
                        <>
                          <span>·</span>
                          <span>{item.subCategory}</span>
                        </>
                      )}
                      {item.reminder?.recurrence !== 'none' && (
                        <span className="text-[10px] text-[#1E1915]/40">
                          ({item.reminder?.recurrence})
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif-journal text-base font-medium text-[#1E1915]">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        onCustomSnooze(item, calculateSnoozeDate('weekend'))
                      }
                      className="min-h-[36px] px-2.5 py-1 text-xs border border-[#1E1915]/15 rounded-lg text-[#1E1915]/75 hover:bg-[#FAF7F2] transition-colors"
                    >
                      Next Weekend
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="min-h-[36px] px-3 py-1 text-xs bg-[#FAF7F2] border border-[#1E1915]/15 rounded-lg text-[#1E1915] font-medium hover:bg-[#EBE5DA] transition-colors"
                    >
                      Edit Alert
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
