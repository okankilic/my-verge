import React from 'react';
import { Hourglass, MapPin, FileText, Video } from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { openAttachment } from '../services/attachments';
import { photoKey } from '../utils/photoKey';
import { ItemActions } from './ItemActions';

interface InProgressViewProps {
  items: BucketItem[];
  categories: CategoryDefinition[];
  onSelect: (item: BucketItem) => void;
  onToggleComplete: (item: BucketItem) => void;
  onStop: (item: BucketItem) => void;
  onDelete: (id: string) => void;
  onAddPhoto: (item: BucketItem, photoDataUrl: string, note?: string) => void;
  onAddAttachment: (item: BucketItem, file: File, note?: string) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const InProgressView: React.FC<InProgressViewProps> = ({
  items,
  categories,
  onSelect,
  onToggleComplete,
  onStop,
  onDelete,
  onAddPhoto,
  onAddAttachment,
}) => {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center bg-card border border-ink/10 rounded-2xl">
        <div className="w-12 h-12 bg-paper text-ink/40 rounded-lg mx-auto flex items-center justify-center mb-3">
          <Hourglass className="w-6 h-6 stroke-[1.5]" />
        </div>
        <p className="font-serif-journal text-lg text-ink/70">Nothing in progress</p>
        <p className="text-xs text-ink/50 mt-1 max-w-sm mx-auto">
          Tap Start on any intention in your Journal when you begin living it.
        </p>
      </div>
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

        return (
          <article
            key={item.id}
            onClick={() => onSelect(item)}
            className="bg-card border border-ink/12 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 space-y-1 cursor-pointer shadow-[var(--item-shadow)] hover:border-ink/25 transition-all duration-150"
          >
            {/* Category | Icon (same as ItemRow) */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 flex items-baseline gap-1.5 min-w-0">
                <span className="shrink-0 text-[11px] uppercase tracking-wider text-ink/60 font-semibold leading-tight">
                  {cat?.verb || item.categoryId}
                </span>
              </div>
              <span
                className="shrink-0 ml-2"
                style={{ color: cat?.accentColor || 'var(--color-ink)' }}
              >
                {renderCategoryIcon(cat?.icon || item.categoryId, 'w-3.5 h-3.5')}
              </span>
            </div>

            <h3 className="font-serif-journal text-[15px] sm:text-base font-medium tracking-tight text-ink leading-snug">
              {item.title}
            </h3>

            {/* Since + Location */}
            {(sinceStr || item.location?.name) && (
              <div className="flex items-center gap-2 text-[11px] text-ink/55 min-w-0">
                {sinceStr && (
                  <span className="font-mono-journal shrink-0">
                    Since {sinceStr} · {days} {days === 1 ? 'day' : 'days'}
                  </span>
                )}
                {item.location?.name && (
                  <span className="flex items-center gap-1 min-w-0">
                    <MapPin className="w-3 h-3 text-[#B45309] shrink-0" />
                    <span className="truncate">
                      {item.location.name}
                      {item.location.cityOrCountry ? `, ${item.location.cityOrCountry}` : ''}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Photo strip, newest first */}
            {item.photos?.length > 0 && (
              <div className="pt-1.5 flex items-start gap-1.5 overflow-x-auto">
                {[...item.photos].reverse().map((src, i) => {
                  const note = item.photoNotes?.[photoKey(src)];
                  return (
                    <figure key={`${i}-${src.slice(-16)}`} className="w-16 shrink-0" title={note}>
                      <img
                        src={src}
                        alt={note || ''}
                        referrerPolicy="no-referrer"
                        className="h-16 w-16 rounded-lg object-cover border border-ink/10 bg-paper-deep"
                      />
                      {note && (
                        <figcaption className="mt-0.5 text-[10px] leading-tight text-ink/60 line-clamp-2 break-words">
                          {note}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            )}

            {/* Video / PDF attachments */}
            {item.attachments && item.attachments.length > 0 && (
              <div className="pt-1.5 flex flex-wrap gap-1.5">
                {item.attachments.map((att) => (
                  <button
                    key={att.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAttachment(att);
                    }}
                    title={att.note ? `${att.name} — ${att.note}` : `Open ${att.name}`}
                    className="max-w-[14rem] min-h-[44px] px-2.5 py-1.5 flex items-center gap-1.5 text-left text-[11px] text-ink/75 bg-paper border border-ink/10 rounded-md hover:border-ink/25 hover:text-ink transition-colors"
                  >
                    {att.mimeType === 'application/pdf' ? (
                      <FileText className="w-3 h-3 mt-px shrink-0 text-[#B45309]" />
                    ) : (
                      <Video className="w-3 h-3 mt-px shrink-0 text-[#B45309]" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate">{att.name}</span>
                      {att.note && (
                        <span className="block text-[10px] leading-tight text-ink/55 line-clamp-2 break-words">
                          {att.note}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <ItemActions
              item={item}
              onToggleStarted={onStop}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onAddPhoto={onAddPhoto}
              onAddAttachment={onAddAttachment}
            />
          </article>
        );
      })}
    </div>
  );
};
