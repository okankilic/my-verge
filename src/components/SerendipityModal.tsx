import React, { useState } from 'react';
import { X, Dices, Sparkles, Compass, ArrowRight, Check } from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';

interface SerendipityModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BucketItem[];
  categories: CategoryDefinition[];
  onSelectFocus: (item: BucketItem) => void;
}

export const SerendipityModal: React.FC<SerendipityModalProps> = ({
  isOpen,
  onClose,
  items,
  categories,
  onSelectFocus,
}) => {
  if (!isOpen) return null;

  const activeItems = items.filter((i) => i.status === 'active');
  const [selectedItem, setSelectedItem] = useState<BucketItem | null>(() => {
    if (activeItems.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * activeItems.length);
    return activeItems[randomIndex];
  });
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    if (activeItems.length <= 1) return;
    setIsRolling(true);

    let rolls = 0;
    const maxRolls = 6;
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * activeItems.length);
      setSelectedItem(activeItems[idx]);
      rolls++;
      if (rolls >= maxRolls) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 100);
  };

  const catDef = selectedItem
    ? categories.find((c) => c.id === selectedItem.categoryId)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-paper border border-ink/15 rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/50 hover:text-ink rounded-full hover:bg-ink/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-[#B45309]/15 text-[#B45309] rounded-2xl mx-auto flex items-center justify-center mb-3">
            <Dices
              className={`w-6 h-6 stroke-[2] transition-transform ${
                isRolling ? 'animate-spin' : ''
              }`}
            />
          </div>
          <h2 className="font-serif-journal text-2xl font-semibold text-ink">
            Serendipity Roll
          </h2>
          <p className="text-xs text-ink/65 mt-1">
            Let fate nudge your focus for today from your active bucket lists.
          </p>
        </div>

        {selectedItem ? (
          <div className="space-y-4">
            <div className="bg-card border border-ink/10 rounded-2xl p-5 shadow-xs transition-all">
              <div className="text-xs text-ink/60 font-medium mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-ink">
                  <span
                    className="shrink-0 transition-colors"
                    style={{ color: catDef?.accentColor || 'var(--color-ink)' }}
                  >
                    {renderCategoryIcon(catDef?.icon || selectedItem.categoryId, 'w-3.5 h-3.5')}
                  </span>
                  <span>{catDef?.verb || selectedItem.categoryId}</span>
                </span>
                {selectedItem.subCategory && (
                  <span className="font-semibold text-[#B45309]">
                    {selectedItem.subCategory}
                  </span>
                )}
              </div>
              <h3 className="font-serif-journal text-lg font-medium text-ink leading-snug">
                {selectedItem.title}
              </h3>
              {selectedItem.mediaMeta?.authorOrCreator && (
                <p className="text-xs text-ink/70 italic mt-0.5">
                  by {selectedItem.mediaMeta.authorOrCreator}
                </p>
              )}
              {selectedItem.description && (
                <p className="text-xs text-ink/75 mt-2 line-clamp-3 leading-relaxed">
                  {selectedItem.description}
                </p>
              )}
              {selectedItem.photos && selectedItem.photos.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-xl aspect-[16/9] border border-ink/10">
                  <img
                    src={selectedItem.photos[0]}
                    alt={selectedItem.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRoll}
                disabled={isRolling || activeItems.length <= 1}
                className="flex-1 min-h-[44px] px-4 py-2 text-xs font-semibold text-ink bg-card border border-ink/20 hover:bg-paper rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Roll Again</span>
              </button>
              <button
                onClick={() => {
                  onSelectFocus(selectedItem);
                  onClose();
                }}
                className="flex-1 min-h-[44px] px-4 py-2 text-xs font-semibold text-paper bg-ink hover:bg-ink/85 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-ink/60">
            No active intentions yet. Create one to enable Serendipity rolls!
          </div>
        )}
      </div>
    </div>
  );
};
