import React, { useEffect, useRef } from 'react';
import { Hourglass, MapPin, Play } from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { renderCategoryIcon, categoryColor } from '../utils/categoryIcons';
import { expenseTotal, formatMoney, wishCurrency } from '../utils/expenses';
import { ItemActions } from './ItemActions';
import { ItemMediaStrip } from './ItemMediaStrip';
import { StepList } from './StepList';
import { EmptyState } from './EmptyState';

interface InProgressViewProps {
  items: BucketItem[];
  categories: CategoryDefinition[];
  onSelect: (item: BucketItem) => void;
  onToggleComplete: (item: BucketItem) => void;
  onDelete: (id: string) => void;
  onAddPhoto: (item: BucketItem, photoDataUrl: string, note?: string) => void;
  onAddAttachment: (item: BucketItem, file: File, note?: string) => void;
  onToggleStep: (item: BucketItem, stepId: string) => void;
  onAddExpense: (item: BucketItem, amount: number, note?: string) => void;
  // A wish that was just started: scrolled into view, focused and briefly highlighted
  focusId?: string | null;
  onFocusDone?: () => void;
  // Set while search or a category pick hides plans
  onClearFilters?: () => void;
}

const FOCUS_HIGHLIGHT_MS = 1600;

const DAY_MS = 24 * 60 * 60 * 1000;

export const InProgressView: React.FC<InProgressViewProps> = ({
  items,
  categories,
  onSelect,
  onToggleComplete,
  onDelete,
  onAddPhoto,
  onAddAttachment,
  onToggleStep,
  onAddExpense,
  focusId,
  onFocusDone,
  onClearFilters,
}) => {
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const hasFocusTarget = !!focusId && items.some((i) => i.id === focusId);

  useEffect(() => {
    if (!focusId) return;
    const el = cardRefs.current.get(focusId);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.focus({ preventScroll: true });
    }
    const timer = window.setTimeout(() => onFocusDone?.(), FOCUS_HIGHLIGHT_MS);
    return () => window.clearTimeout(timer);
    // Runs once the card is on screen; onFocusDone changes every render
  }, [focusId, hasFocusTarget]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Hourglass className="w-6 h-6 stroke-[1.5]" />}
        title="Ready when you are"
        hint={
          <>
            Tap <Play aria-hidden className="inline w-3 h-3 -mt-0.5 mx-0.5" />
            <span className="sr-only">Start</span> on a plan in your Journal to start it.
          </>
        }
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {items.map((item) => {
        const cat = categories.find((c) => c.id === item.categoryId);
        const started = item.startedAt ? new Date(item.startedAt) : null;
        const days = started ? Math.max(0, Math.floor((Date.now() - started.getTime()) / DAY_MS)) : 0;
        const sinceStr = started
          ? started.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
          : null;
        const spent = expenseTotal(item.expenses);

        return (
          <article
            key={item.id}
            ref={(el) => {
              if (el) cardRefs.current.set(item.id, el);
              else cardRefs.current.delete(item.id);
            }}
            tabIndex={-1}
            data-item-id={item.id}
            onClick={() => onSelect(item)}
            className={`bg-card border rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 space-y-1 cursor-pointer shadow-[var(--item-shadow)] hover:border-ink/25 transition-all duration-300 focus:outline-none ${
              item.id === focusId ? 'border-accent/50 ring-2 ring-accent/60' : 'border-ink/12'
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

            <h3 className="font-serif-journal text-[15px] sm:text-base font-medium tracking-tight text-ink leading-snug">
              {item.title}
            </h3>

            {/* Since + Spent + Location */}
            {(sinceStr || spent > 0 || item.location?.name) && (
              <div className="flex items-center gap-2 text-[11px] text-ink/55 min-w-0">
                {sinceStr && (
                  <span className="font-mono-journal shrink-0">
                    Since {sinceStr} · {days} {days === 1 ? 'day' : 'days'}
                  </span>
                )}
                {spent > 0 && (
                  <span className="font-mono-journal shrink-0 text-positive">
                    {formatMoney(spent, wishCurrency(item))} spent
                  </span>
                )}
                {item.location?.name && (
                  <span className="flex items-center gap-1 min-w-0">
                    <MapPin className="w-3 h-3 text-accent shrink-0" />
                    <span className="truncate">
                      {item.location.name}
                      {item.location.cityOrCountry ? `, ${item.location.cityOrCountry}` : ''}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Steps are ticked right here, where the work happens */}
            {(item.steps?.length ?? 0) > 0 && (
              <StepList steps={item.steps!} onToggle={(stepId) => onToggleStep(item, stepId)} compact />
            )}

            <ItemMediaStrip
              photos={item.photos || []}
              photoNotes={item.photoNotes}
              attachments={item.attachments}
            />

            <ItemActions
              item={item}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onAddPhoto={onAddPhoto}
              onAddAttachment={onAddAttachment}
              onAddExpense={onAddExpense}
            />
          </article>
        );
      })}
    </div>
  );
};
