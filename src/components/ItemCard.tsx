import React from 'react';
import {
  Check,
  Calendar,
  Bell,
  MapPin,
  ExternalLink,
  Edit3,
  Trash2,
  Clock,
} from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';

interface ItemCardProps {
  item: BucketItem;
  categoryDef?: CategoryDefinition;
  onToggleComplete: (item: BucketItem) => void;
  onEdit: (item: BucketItem) => void;
  onDelete: (id: string) => void;
  onSnooze: (item: BucketItem, days: number) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  categoryDef,
  onToggleComplete,
  onEdit,
  onDelete,
  onSnooze,
}) => {
  const isCompleted = item.status === 'completed';

  // Format dates
  const formattedTargetDate = item.targetDate
    ? new Date(item.targetDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Reminder status
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
    <article
      className={`group relative bg-white border rounded-2xl p-4 sm:p-5 transition-all duration-200 ${
        isReminderDue
          ? 'border-[#C05621] shadow-[0_3px_14px_rgba(192,86,33,0.12)]'
          : isCompleted
          ? 'border-[#1E1915]/10 bg-[#FAF7F2]/60 opacity-80'
          : 'border-[#1E1915]/12 shadow-[0_2px_10px_rgba(30,25,21,0.04)] hover:border-[#1E1915]/30 hover:shadow-[0_4px_16px_rgba(30,25,21,0.07)]'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Tactile Checkbox Toggle */}
        <button
          onClick={() => onToggleComplete(item)}
          title={isCompleted ? 'Mark uncompleted' : 'Mark accomplished'}
          className={`min-w-[44px] min-h-[44px] -ml-2 -mt-2 flex items-center justify-center focus-visible:outline-none`}
        >
          <div
            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
              isCompleted
                ? 'bg-[#4A6B56] border-[#4A6B56] text-white'
                : 'border-[#1E1915]/30 bg-white hover:border-[#1E1915]'
            }`}
          >
            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </div>
        </button>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-[#1E1915]/60 mb-1.5 font-medium">
            <span className="flex items-center gap-1.5 text-[#1E1915]/80 font-semibold">
              <span
                className="shrink-0 transition-colors"
                style={{ color: categoryDef?.accentColor || '#1E1915' }}
              >
                {renderCategoryIcon(categoryDef?.icon || item.categoryId, 'w-3.5 h-3.5')}
              </span>
              <span>{categoryDef?.name || item.customCategoryName || item.categoryId}</span>
            </span>

            {item.subCategory && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#1E1915]/70">{item.subCategory}</span>
              </>
            )}

            {formattedTargetDate && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#1E1915]/50" />
                  <span>{formattedTargetDate}</span>
                </span>
              </>
            )}

            {item.priority === 'urgent' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#C05621] font-semibold">Urgent</span>
              </>
            )}
          </div>

          {/* Primary Item Title */}
          <h3
            className={`font-serif-journal text-lg sm:text-xl font-medium tracking-tight text-[#1E1915] leading-snug transition-colors ${
              isCompleted ? 'line-through text-[#1E1915]/50' : ''
            }`}
          >
            {item.title}
          </h3>

          {/* Media Attribution (Read / Watch / Craft) */}
          {item.mediaMeta?.authorOrCreator && (
            <p className="text-xs text-[#1E1915]/70 font-medium italic mt-0.5">
              by {item.mediaMeta.authorOrCreator}
              {item.mediaMeta.formatOrEdition && (
                <span className="font-normal not-italic text-[#1E1915]/50">
                  {' '}
                  ({item.mediaMeta.formatOrEdition})
                </span>
              )}
            </p>
          )}

          {/* Item Description / Notes */}
          {item.description && (
            <p className="text-sm text-[#1E1915]/75 mt-2 leading-relaxed line-clamp-3">
              {item.description}
            </p>
          )}

          {/* Optional Photo Attachment */}
          {item.photos && item.photos.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[#1E1915]/10 aspect-[16/9] max-h-48 bg-[#F5F2EB]">
              <img
                src={item.photos[0]}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
          )}

          {/* Budget Progress (for Buy / Go / Projects) */}
          {item.budget && item.budget.estimatedCost > 0 && (
            <div className="mt-3 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#1E1915]/8">
              <div className="flex justify-between items-center text-xs text-[#1E1915]/70 mb-1.5 font-medium">
                <span className="flex items-center gap-1">
                  <span>Target Budget</span>
                </span>
                <span className="font-mono tabular-nums text-[#1E1915] font-semibold">
                  {item.budget.currency}
                  {item.budget.savedAmount} / {item.budget.currency}
                  {item.budget.estimatedCost}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#1E1915]/10 rounded-full overflow-hidden">
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
            </div>
          )}

          {/* Location Marker */}
          {item.location && item.location.name && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#1E1915]/60">
              <MapPin className="w-3.5 h-3.5 text-[#B45309]" />
              <span className="truncate">
                {item.location.name}
                {item.location.cityOrCountry ? `, ${item.location.cityOrCountry}` : ''}
              </span>
            </div>
          )}

          {/* External Reference Link */}
          {item.linkUrl && (
            <div className="mt-2">
              <a
                href={item.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#2C3E50] hover:underline font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="truncate max-w-xs">{item.linkUrl}</span>
              </a>
            </div>
          )}

          {/* Active Reminder Alert Banner */}
          {item.reminder && item.reminder.date && (
            <div
              className={`mt-3 p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                isReminderDue
                  ? 'bg-[#FFF7ED] border-[#C05621]/30 text-[#C05621]'
                  : 'bg-[#FAF7F2] border-[#1E1915]/10 text-[#1E1915]/70'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <Bell className={`w-3.5 h-3.5 ${isReminderDue ? 'text-[#C05621]' : 'text-[#1E1915]/60'}`} />
                <span>
                  {isReminderDue
                    ? 'Reminder due now!'
                    : `Reminder: ${new Date(item.reminder.date).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}`}
                </span>
                {item.reminder.recurrence !== 'none' && (
                  <span className="text-[11px] opacity-75">({item.reminder.recurrence})</span>
                )}
              </div>

              {/* Quick Snooze Actions */}
              {!isCompleted && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onSnooze(item, 1)}
                    className="min-h-[36px] px-2.5 py-1 text-[11px] font-semibold bg-white border border-[#1E1915]/15 rounded-lg hover:bg-[#FAF7F2] text-[#1E1915] transition-colors shadow-2xs"
                  >
                    +1 Day
                  </button>
                  <button
                    onClick={() => onSnooze(item, 7)}
                    className="min-h-[36px] px-2.5 py-1 text-[11px] font-semibold bg-white border border-[#1E1915]/15 rounded-lg hover:bg-[#FAF7F2] text-[#1E1915] transition-colors shadow-2xs"
                  >
                    +1 Week
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Completed Reflection Quote */}
          {isCompleted && item.completionReflection && (
            <div className="mt-3 p-3 rounded-xl bg-[#F0F5F2] border border-[#4A6B56]/20">
              <p className="font-serif-journal text-xs text-[#2A4333] italic leading-relaxed">
                “{item.completionReflection}”
              </p>
              {item.completedAt && (
                <p className="text-[10px] text-[#4A6B56] mt-1 font-mono">
                  Accomplished on {new Date(item.completedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Card Controls Menu */}
        <div className="flex flex-col gap-1 shrink-0 -mr-1 -mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            title="Edit intention"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#1E1915]/60 hover:text-[#1E1915] rounded-lg hover:bg-[#FAF7F2] transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            title="Delete intention"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#1E1915]/40 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};
