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
  Play,
  Square,
  Hourglass,
  Trophy,
  Star,
  Share2,
} from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { externalLinkProps } from '../services/platform';
import { shareItem } from '../services/shareOut';
import { isReminderDue as isDue, reminderNextAt } from '../services/notifications';
import { Sheet } from './Sheet';
import { KeepInVaultSwitch, HideInMemoriesSwitch } from './KeepInVaultSwitch';
import { ItemMediaStrip } from './ItemMediaStrip';

interface ItemDetailDrawerProps {
  item: BucketItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: BucketItem) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (item: BucketItem) => void;
  onToggleStarted: (item: BucketItem) => void;
  onToggleKeptInVault: (item: BucketItem) => void;
  onToggleHiddenInMemories: (item: BucketItem) => void;
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
  onToggleStarted,
  onToggleKeptInVault,
  onToggleHiddenInMemories,
  onSnooze,
  categoryDef,
}) => {
  if (!isOpen || !item) return null;

  const isCompleted = item.status === 'completed';
  const isStarted = !isCompleted && Boolean(item.startedAt);

  const formattedStartedAt = isStarted
    ? new Date(item.startedAt!).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const formattedCompletedAt =
    isCompleted && item.completedAt
      ? new Date(item.completedAt).toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

  const formattedTargetDate = item.targetDate
    ? new Date(item.targetDate).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Reminder info
  const isReminderDue = !isCompleted && Boolean(item.reminder?.date) && isDue(item.reminder!);
  const nextReminderAt = item.reminder?.date ? reminderNextAt(item.reminder) : null;

  return (
    <Sheet isOpen onClose={onClose}>
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-ink/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-ink/60 font-medium">
            <span className="flex items-center gap-1.5 font-semibold text-ink">
              <span
                className="shrink-0 transition-colors"
                style={{ color: categoryDef?.accentColor || 'var(--color-ink)' }}
              >
                {renderCategoryIcon(categoryDef?.icon || item.categoryId, 'w-3.5 h-3.5')}
              </span>
              <span>{categoryDef?.verb || item.categoryId}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{item.priority.replace('_', ' ')}</span>
          </div>

          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-ink/50 hover:text-ink hover:bg-ink/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Detail Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Photograph if available */}
          {item.photos && item.photos.length > 0 && (
            <div className="rounded-2xl overflow-hidden aspect-[16/10] border border-ink/12 bg-paper-deep shadow-xs">
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
            <h2 className="font-serif-journal text-2xl sm:text-3xl font-medium tracking-tight text-ink leading-snug">
              {item.title}
            </h2>

            {/* Author / Creator info */}
            {item.mediaMeta?.authorOrCreator && (
              <p className="text-sm text-ink/75 italic mt-1 font-medium">
                by {item.mediaMeta.authorOrCreator}
                {item.mediaMeta.formatOrEdition && (
                  <span className="font-normal not-italic text-ink/50">
                    {' '}
                    ({item.mediaMeta.formatOrEdition})
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Description & Reflections */}
          {item.description && (
            <div className="prose text-sm text-ink/80 leading-relaxed font-sans border-l-2 border-ink/20 pl-3.5 py-0.5">
              {item.description}
            </div>
          )}

          {/* Photos and files added along the way (the first photo is the cover above) */}
          {((item.photos?.length ?? 0) > 1 || (item.attachments?.length ?? 0) > 0) && (
            <div className="-mt-1.5">
              <ItemMediaStrip
                photos={item.photos.slice(1)}
                photoNotes={item.photoNotes}
                attachments={item.attachments}
              />
            </div>
          )}

          {/* In Progress */}
          {formattedStartedAt && (
            <div className="flex items-center gap-2 text-xs text-ink/70">
              <Hourglass className="w-4 h-4 text-[#4A6B56]" />
              <span>In progress since {formattedStartedAt}</span>
            </div>
          )}

          {/* Target Date */}
          {formattedTargetDate && (
            <div className="flex items-center gap-2 text-xs text-ink/70">
              <Calendar className="w-4 h-4 text-[#B45309]" />
              <span>Target timeline: {formattedTargetDate}</span>
            </div>
          )}

          {/* Location Marker */}
          {item.location && item.location.name && (
            <div className="p-3.5 bg-card rounded-xl border border-ink/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-[#B45309] shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-semibold text-ink block truncate">
                    {item.location.name}
                  </span>
                  {item.location.cityOrCountry && (
                    <span className="text-[11px] text-ink/60 block truncate">
                      {item.location.cityOrCountry}
                    </span>
                  )}
                </div>
              </div>
              <a
                {...externalLinkProps(
                  `https://maps.google.com/?q=${encodeURIComponent(
                    `${item.location.name} ${item.location.cityOrCountry || ''}`
                  )}`
                )}
                className="text-xs text-link hover:underline font-medium shrink-0 flex items-center gap-1"
              >
                <span>Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Budget Tracker Progress */}
          {item.budget && item.budget.estimatedCost > 0 && (
            <div className="p-4 bg-card rounded-xl border border-ink/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-1.5 text-[#059669]">
                  <DollarSign className="w-4 h-4" />
                  <span>Aspiration Budget</span>
                </div>
                <span className="font-mono text-sm font-semibold text-ink">
                  ${item.budget.savedAmount} / ${item.budget.estimatedCost}
                </span>
              </div>
              <div className="w-full h-2 bg-paper border border-ink/10 rounded-full overflow-hidden">
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
              <div className="flex justify-between text-[11px] text-ink/50 font-mono">
                <span>
                  {Math.round((item.budget.savedAmount / item.budget.estimatedCost) * 100)}% Funded
                </span>
                <span>${item.budget.estimatedCost - item.budget.savedAmount} remaining</span>
              </div>
            </div>
          )}

          {/* External Reference Link */}
          {item.linkUrl && (
            <div className="p-3 bg-card rounded-xl border border-ink/10 flex items-center justify-between">
              <span className="text-xs text-ink/60 truncate mr-2">{item.linkUrl}</span>
              <a
                {...externalLinkProps(item.linkUrl)}
                className="text-xs text-link font-semibold hover:underline flex items-center gap-1 shrink-0"
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
                  ? 'bg-warm border-[#C05621]/30 text-[#C05621]'
                  : 'bg-card border-ink/10 text-ink'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Bell className="w-4 h-4 text-[#B45309]" />
                  <span>
                    {isReminderDue
                      ? 'Alert Due Right Now!'
                      : nextReminderAt === null
                        ? 'Reminder passed'
                        : `Scheduled: ${new Date(nextReminderAt).toLocaleString(undefined, {
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
                <div className="pt-2 border-t border-ink/8 flex items-center gap-2">
                  <span className="text-[11px] text-ink/60 font-medium">Snooze:</span>
                  <button
                    onClick={() => onSnooze(item, 1)}
                    title="Snooze 1 day"
                    className="min-h-[36px] px-2.5 py-1 text-xs font-medium bg-paper border border-ink/15 rounded-lg hover:bg-paper-deep transition-colors"
                  >
                    +1d
                  </button>
                  <button
                    onClick={() => onSnooze(item, 7)}
                    title="Snooze 1 week"
                    className="min-h-[36px] px-2.5 py-1 text-xs font-medium bg-paper border border-ink/15 rounded-lg hover:bg-paper-deep transition-colors"
                  >
                    +1w
                  </button>
                </div>
              )}
            </div>
          )}

          {/* The memory written when it was finished */}
          {isCompleted && (formattedCompletedAt || (item.completionRating ?? 0) > 0 || item.completionReflection) && (
            <div className="p-4 bg-card rounded-xl border border-ink/10 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs text-ink/70">
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#4A6B56]" />
                  <span>{formattedCompletedAt ? `Done on ${formattedCompletedAt}` : 'Done'}</span>
                </span>
                {(item.completionRating ?? 0) > 0 && (
                  <span
                    className="flex items-center gap-0.5"
                    aria-label={`Rated ${item.completionRating} of 5`}
                  >
                    {Array.from({ length: item.completionRating! }, (_, n) => (
                      <Star key={n} className="w-3 h-3 text-[#B45309] fill-[#B45309]" />
                    ))}
                  </span>
                )}
              </div>
              {item.completionReflection && (
                <p className="font-serif-journal text-sm text-ink/80 italic leading-relaxed">
                  “{item.completionReflection}”
                </p>
              )}
            </div>
          )}

          {isCompleted && (
            <div className="space-y-2">
              <KeepInVaultSwitch checked={Boolean(item.keptInVault)} onToggle={() => onToggleKeptInVault(item)} />
              <HideInMemoriesSwitch
                checked={Boolean(item.hiddenInMemories)}
                onToggle={() => onToggleHiddenInMemories(item)}
              />
            </div>
          )}
        </div>

        {/* Fixed Sticky Action Footer */}
        <div className="p-4 bg-paper border-t border-ink/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-ink/15 bg-card text-ink/80 hover:text-ink hover:bg-paper hover:border-ink/30 transition-colors"
              title="Edit wish"
              aria-label="Edit wish"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => shareItem(item, categoryDef)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-ink/15 bg-card text-ink/80 hover:text-ink hover:bg-paper hover:border-ink/30 transition-colors"
              title="Share wish"
              aria-label="Share wish"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center text-ink/40 hover:text-red-600 rounded-lg hover:bg-red-500/10 transition-colors"
              title="Delete wish"
              aria-label="Delete wish"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {!isCompleted && (
              <button
                onClick={() => onToggleStarted(item)}
                title={isStarted ? 'Stop — move back to Journal' : 'Start — mark as in progress'}
                aria-label={isStarted ? 'Stop' : 'Start'}
                className="min-h-[40px] px-3 flex items-center justify-center gap-1.5 rounded-lg border border-ink/15 bg-card text-xs font-semibold text-ink/80 hover:text-ink hover:bg-paper hover:border-ink/30 transition-colors"
              >
                {isStarted ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isStarted ? 'Stop' : 'Start'}</span>
              </button>
            )}
            <button
              onClick={() => {
                // App closes the sheet when completing; un-completing closes it here
                if (isCompleted) onClose();
                onToggleComplete(item);
              }}
              title={isCompleted ? 'Mark unaccomplished' : 'Mark accomplished'}
              aria-label={isCompleted ? 'Mark unaccomplished' : 'Mark accomplished'}
              className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg shadow-2xs transition-all ${
                isCompleted
                  ? 'bg-card border border-ink/20 text-ink hover:bg-paper'
                  : 'bg-[#4A6B56] hover:bg-[#3d5947] text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
    </Sheet>
  );
};
