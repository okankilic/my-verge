import React from 'react';
import {
  X,
  Edit3,
  Trash2,
  CheckCircle2,
  Calendar,
  Bell,
  MapPin,
  ExternalLink,
  DollarSign,
  BookOpen,
  Film,
  Sparkles,
  ShoppingBag,
  Feather,
  Compass,
  Clock,
} from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';

interface ItemDetailDrawerProps {
  item: BucketItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: BucketItem) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (item: BucketItem) => void;
  onSnooze: (item: BucketItem, days: number) => void;
  categoryDef?: CategoryDefinition;
}

export const ItemDetailDrawer: React.FC<ItemDetailDrawerProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
  onSnooze,
  categoryDef,
}) => {
  if (!isOpen || !item) return null;

  const isCompleted = item.status === 'completed';

  const formattedTargetDate = item.targetDate
    ? new Date(item.targetDate).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Reminder info
  const now = new Date().getTime();
  const reminderTime = item.reminder?.date ? new Date(item.reminder.date).getTime() : null;
  const snoozedUntilTime = item.reminder?.snoozedUntil
    ? new Date(item.reminder.snoozedUntil).getTime()
    : null;
  const isReminderDue =
    !isCompleted &&
    ((snoozedUntilTime && snoozedUntilTime <= now) ||
      (!snoozedUntilTime && reminderTime && reminderTime <= now));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dim backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Sheet Container */}
      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] sm:max-h-full sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full sm:max-w-lg bg-[#FAF7F2] border-t sm:border-l border-[#1E1915]/15 rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
        {/* Mobile Grab Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-[#1E1915]/20 rounded-full mx-auto my-3" />

        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-[#1E1915]/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#1E1915]/60 font-medium">
            <span className="flex items-center gap-1.5 font-semibold text-[#1E1915]">
              <span
                className="shrink-0 transition-colors"
                style={{ color: categoryDef?.accentColor || '#1E1915' }}
              >
                {renderCategoryIcon(categoryDef?.icon || item.categoryId, 'w-3.5 h-3.5')}
              </span>
              <span>{categoryDef?.name || item.categoryId}</span>
            </span>
            {item.subCategory && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#B45309] font-medium">{item.subCategory}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="capitalize">{item.priority.replace('_', ' ')}</span>
          </div>

          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#1E1915]/50 hover:text-[#1E1915] hover:bg-[#1E1915]/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Detail Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Photograph if available */}
          {item.photos && item.photos.length > 0 && (
            <div className="rounded-2xl overflow-hidden aspect-[16/10] border border-[#1E1915]/12 bg-[#F3EFE6] shadow-xs">
              <img
                src={item.photos[0]}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <h2 className="font-serif-journal text-2xl sm:text-3xl font-medium tracking-tight text-[#1E1915] leading-snug">
              {item.title}
            </h2>

            {/* Author / Creator info */}
            {item.mediaMeta?.authorOrCreator && (
              <p className="text-sm text-[#1E1915]/75 italic mt-1 font-medium">
                by {item.mediaMeta.authorOrCreator}
                {item.mediaMeta.formatOrEdition && (
                  <span className="font-normal not-italic text-[#1E1915]/50">
                    {' '}
                    ({item.mediaMeta.formatOrEdition})
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Description & Reflections */}
          {item.description && (
            <div className="prose text-sm text-[#1E1915]/80 leading-relaxed font-sans border-l-2 border-[#1E1915]/20 pl-3.5 py-0.5">
              {item.description}
            </div>
          )}

          {/* Target Date */}
          {formattedTargetDate && (
            <div className="flex items-center gap-2 text-xs text-[#1E1915]/70">
              <Calendar className="w-4 h-4 text-[#B45309]" />
              <span>Target timeline: {formattedTargetDate}</span>
            </div>
          )}

          {/* Location Marker */}
          {item.location && item.location.name && (
            <div className="p-3.5 bg-white rounded-xl border border-[#1E1915]/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-[#B45309] shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-semibold text-[#1E1915] block truncate">
                    {item.location.name}
                  </span>
                  {item.location.cityOrCountry && (
                    <span className="text-[11px] text-[#1E1915]/60 block truncate">
                      {item.location.cityOrCountry}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${item.location.name} ${item.location.cityOrCountry || ''}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#2C3E50] hover:underline font-medium shrink-0 flex items-center gap-1"
              >
                <span>Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Budget Tracker Progress */}
          {item.budget && item.budget.estimatedCost > 0 && (
            <div className="p-4 bg-white rounded-xl border border-[#1E1915]/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-1.5 text-[#059669]">
                  <DollarSign className="w-4 h-4" />
                  <span>Aspiration Budget</span>
                </div>
                <span className="font-mono text-sm font-semibold text-[#1E1915]">
                  ${item.budget.savedAmount} / ${item.budget.estimatedCost}
                </span>
              </div>
              <div className="w-full h-2 bg-[#FAF7F2] border border-[#1E1915]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#059669] transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((item.budget.savedAmount / item.budget.estimatedCost) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#1E1915]/50 font-mono">
                <span>
                  {Math.round((item.budget.savedAmount / item.budget.estimatedCost) * 100)}% Funded
                </span>
                <span>${item.budget.estimatedCost - item.budget.savedAmount} remaining</span>
              </div>
            </div>
          )}

          {/* External Reference Link */}
          {item.linkUrl && (
            <div className="p-3 bg-white rounded-xl border border-[#1E1915]/10 flex items-center justify-between">
              <span className="text-xs text-[#1E1915]/60 truncate mr-2">{item.linkUrl}</span>
              <a
                href={item.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#2C3E50] font-semibold hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Visit Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Scheduled Reminder Alert with Snooze Controls */}
          {item.reminder && item.reminder.date && (
            <div
              className={`p-4 rounded-xl border space-y-2.5 ${
                isReminderDue
                  ? 'bg-[#FFF7ED] border-[#C05621]/30 text-[#C05621]'
                  : 'bg-white border-[#1E1915]/10 text-[#1E1915]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Bell className="w-4 h-4 text-[#B45309]" />
                  <span>
                    {isReminderDue
                      ? 'Alert Due Right Now!'
                      : `Scheduled: ${new Date(item.reminder.date).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}`}
                  </span>
                </div>
                {item.reminder.recurrence !== 'none' && (
                  <span className="text-[11px] opacity-70">({item.reminder.recurrence})</span>
                )}
              </div>

              {!isCompleted && (
                <div className="pt-2 border-t border-[#1E1915]/8 flex items-center gap-2">
                  <span className="text-[11px] text-[#1E1915]/60 font-medium">Snooze:</span>
                  <button
                    onClick={() => onSnooze(item, 1)}
                    className="min-h-[36px] px-2.5 py-1 text-xs font-medium bg-[#FAF7F2] border border-[#1E1915]/15 rounded-lg hover:bg-[#EFEAE1] transition-colors"
                  >
                    +1 Day
                  </button>
                  <button
                    onClick={() => onSnooze(item, 7)}
                    className="min-h-[36px] px-2.5 py-1 text-xs font-medium bg-[#FAF7F2] border border-[#1E1915]/15 rounded-lg hover:bg-[#EFEAE1] transition-colors"
                  >
                    +1 Week
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Sticky Action Footer */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#1E1915]/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-[#1E1915]/15 bg-white text-[#1E1915]/80 hover:text-[#1E1915] hover:bg-[#FAF7F2] hover:border-[#1E1915]/30 transition-colors"
              title="Edit intention"
              aria-label="Edit intention"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(item.id);
              }}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#1E1915]/40 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete intention"
              aria-label="Delete intention"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onToggleComplete(item);
            }}
            title={isCompleted ? 'Mark unaccomplished' : 'Mark accomplished'}
            aria-label={isCompleted ? 'Mark unaccomplished' : 'Mark accomplished'}
            className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg shadow-2xs transition-all ${
              isCompleted
                ? 'bg-white border border-[#1E1915]/20 text-[#1E1915] hover:bg-[#FAF7F2]'
                : 'bg-[#4A6B56] hover:bg-[#3d5947] text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
