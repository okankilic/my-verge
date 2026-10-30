import React from 'react';
import { Star, RotateCcw, Quote, Compass } from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';

interface MilestonesArchiveViewProps {
  items: BucketItem[];
  categories: CategoryDefinition[];
  onToggleComplete: (item: BucketItem) => void;
  onEdit: (item: BucketItem) => void;
}

export const MilestonesArchiveView: React.FC<MilestonesArchiveViewProps> = ({
  items,
  categories,
  onToggleComplete,
  onEdit,
}) => {
  const accomplishedItems = items.filter((item) => item.status === 'completed');

  // Sort by completedAt descending
  accomplishedItems.sort((a, b) => {
    const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return timeB - timeA;
  });

  // Group into months for the timeline (order preserved: newest first, undated last)
  const monthGroups: { label: string; items: BucketItem[] }[] = [];
  accomplishedItems.forEach((item) => {
    const label = item.completedAt
      ? new Date(item.completedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      : 'Undated';
    const last = monthGroups[monthGroups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      monthGroups.push({ label, items: [item] });
    }
  });

  return (
    <div className="space-y-6">
      {accomplishedItems.length === 0 ? (
        <div className="p-12 text-center bg-card border border-ink/10 rounded-2xl">
          <p className="font-serif-journal text-lg text-ink/70">
            Your retrospective archive is waiting
          </p>
          <p className="text-xs text-ink/50 mt-1 max-w-sm mx-auto">
            Check off any intention as you experience it to write a memory reflection and preserve it here forever.
          </p>
        </div>
      ) : (
        <div className="relative pl-8">
          {/* Timeline rail */}
          <div aria-hidden className="absolute left-3 top-2 bottom-2 w-px bg-ink/15" />

          <div className="space-y-8">
            {monthGroups.map((group) => (
              <section key={group.label} className="space-y-4">
                {/* Month header */}
                <div className="relative flex items-baseline gap-2">
                  <span
                    aria-hidden
                    className="absolute -left-[23.5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-ink ring-4 ring-page"
                  />
                  <h3 className="font-serif-journal text-lg font-medium text-ink">{group.label}</h3>
                  <span className="font-mono text-[11px] text-ink/50">{group.items.length}</span>
                </div>

                {group.items.map((item) => {
                  const cat = categories.find((c) => c.id === item.categoryId);
                  const dateStr = item.completedAt
                    ? new Date(item.completedAt).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : null;

                  return (
                    <div key={item.id} className="relative">
                      {/* Timeline marker */}
                      <span
                        aria-hidden
                        className="absolute -left-[25.5px] top-1 w-3 h-3 rounded-full ring-4 ring-page"
                        style={{ backgroundColor: cat?.accentColor || '#4A6B56' }}
                      />
                      {dateStr && (
                        <div className="font-mono text-[11px] text-ink/55 mb-1.5 leading-5">{dateStr}</div>
                      )}
                      <div
                        className="bg-card border border-ink/12 rounded-2xl p-5 shadow-xs hover:border-ink/25 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div>
                          {/* Top unboxed metadata */}
                          <div className="flex items-center justify-between text-xs text-ink/60 mb-2">
                            <div className="flex items-center gap-1.5 font-medium">
                              <span
                                className="flex items-center gap-1.5 font-semibold"
                                style={{ color: cat?.accentColor || '#4A6B56' }}
                              >
                                {renderCategoryIcon(cat?.icon || item.categoryId, 'w-3.5 h-3.5')}
                                <span>{cat?.name || item.categoryId}</span>
                              </span>
                              {item.subCategory && (
                                <>
                                  <span>·</span>
                                  <span>{item.subCategory}</span>
                                </>
                              )}
                            </div>

                            {item.completionRating && (
                              <div className="flex items-center gap-0.5 text-[#B45309]">
                                {Array.from({ length: item.completionRating }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-current" />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="font-serif-journal text-lg font-medium text-ink leading-snug">
                            {item.title}
                          </h4>

                          {/* Reflection quote */}
                          {item.completionReflection ? (
                            <div className="mt-3 p-3 rounded-xl bg-paper border border-ink/8 relative">
                              <Quote className="w-3.5 h-3.5 text-[#4A6B56]/40 absolute top-2.5 left-2.5" />
                              <p className="font-serif-journal text-xs text-ink/80 italic pl-5 leading-relaxed">
                                “{item.completionReflection}”
                              </p>
                            </div>
                          ) : item.description ? (
                            <p className="text-xs text-ink/70 mt-2 leading-relaxed">
                              {item.description}
                            </p>
                          ) : null}

                          {/* Optional photo */}
                          {item.photos && item.photos.length > 0 && (
                            <div className="mt-3 overflow-hidden rounded-xl border border-ink/10 aspect-[16/9] max-h-40 bg-paper-deep">
                              <img
                                src={item.photos[0]}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-ink/8 flex items-center justify-end text-xs text-ink/60">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onEdit(item)}
                              className="min-h-[36px] text-xs text-ink/70 hover:text-ink px-2"
                            >
                              Edit Note
                            </button>
                            <button
                              onClick={() => onToggleComplete(item)}
                              title="Move back to active intentions"
                              className="min-h-[36px] px-2.5 py-1 text-xs text-ink/60 hover:text-ink flex items-center gap-1 rounded-lg hover:bg-paper"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Re-activate</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
