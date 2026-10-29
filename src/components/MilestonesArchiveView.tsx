import React from 'react';
import { Film, Star, Calendar, RotateCcw, Quote, Compass } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#1E1915]/10 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4A6B56]/15 text-[#4A6B56] flex items-center justify-center">
            <Film className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="font-serif-journal text-xl font-medium text-[#1E1915]">
              Retrospective Memories
            </h3>
            <p className="text-xs text-[#1E1915]/65 mt-0.5">
              {accomplishedItems.length} dreams brought across the verge into life stories.
            </p>
          </div>
        </div>
      </div>

      {accomplishedItems.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#1E1915]/10 rounded-2xl">
          <p className="font-serif-journal text-lg text-[#1E1915]/70">
            Your retrospective archive is waiting
          </p>
          <p className="text-xs text-[#1E1915]/50 mt-1 max-w-sm mx-auto">
            Check off any intention as you experience it to write a memory reflection and preserve it here forever.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accomplishedItems.map((item) => {
            const cat = categories.find((c) => c.id === item.categoryId);
            const dateStr = item.completedAt
              ? new Date(item.completedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null;

            return (
              <div
                key={item.id}
                className="bg-white border border-[#1E1915]/12 rounded-2xl p-5 shadow-xs hover:border-[#1E1915]/25 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top unboxed metadata */}
                  <div className="flex items-center justify-between text-xs text-[#1E1915]/60 mb-2">
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
                  <h4 className="font-serif-journal text-lg font-medium text-[#1E1915] leading-snug">
                    {item.title}
                  </h4>

                  {/* Reflection quote */}
                  {item.completionReflection ? (
                    <div className="mt-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#1E1915]/8 relative">
                      <Quote className="w-3.5 h-3.5 text-[#4A6B56]/40 absolute top-2.5 left-2.5" />
                      <p className="font-serif-journal text-xs text-[#1E1915]/80 italic pl-5 leading-relaxed">
                        “{item.completionReflection}”
                      </p>
                    </div>
                  ) : item.description ? (
                    <p className="text-xs text-[#1E1915]/70 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  ) : null}

                  {/* Optional photo */}
                  {item.photos && item.photos.length > 0 && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-[#1E1915]/10 aspect-[16/9] max-h-40 bg-[#F5F2EB]">
                      <img
                        src={item.photos[0]}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#1E1915]/8 flex items-center justify-between text-xs text-[#1E1915]/60">
                  {dateStr && (
                    <span className="font-mono text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Accomplished {dateStr}</span>
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="min-h-[36px] text-xs text-[#1E1915]/70 hover:text-[#1E1915] px-2"
                    >
                      Edit Note
                    </button>
                    <button
                      onClick={() => onToggleComplete(item)}
                      title="Move back to active intentions"
                      className="min-h-[36px] px-2.5 py-1 text-xs text-[#1E1915]/60 hover:text-[#1E1915] flex items-center gap-1 rounded-lg hover:bg-[#FAF7F2]"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Re-activate</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
