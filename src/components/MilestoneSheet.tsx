import React, { useState } from 'react';
import { X, Trophy, Star, Sparkles, Heart } from 'lucide-react';
import { BucketItem } from '../types';
import { Sheet } from './Sheet';

interface MilestoneSheetProps {
  item: BucketItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveReflection: (itemId: string, reflection: string, rating: number) => void;
}

export const MilestoneSheet: React.FC<MilestoneSheetProps> = ({
  item,
  isOpen,
  onClose,
  onSaveReflection,
}) => {
  // App.tsx keys this sheet by item id, so state is seeded fresh for each item
  const [reflection, setReflection] = useState(item?.completionReflection || '');
  const [rating, setRating] = useState(item?.completionRating || 5);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReflection(item.id, reflection.trim(), rating);
    onClose();
  };

  return (
    <Sheet isOpen onClose={onClose} width="md" labelledBy="milestone-title">
      <div className="relative overflow-y-auto p-6 sm:p-7">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/50 hover:text-ink rounded-full hover:bg-ink/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#4A6B56]/15 text-[#4A6B56] rounded-2xl mx-auto flex items-center justify-center mb-3">
            <Trophy className="w-6 h-6 stroke-[2]" />
          </div>
          <h2 id="milestone-title" className="font-serif-journal text-2xl font-semibold text-ink">
            Dream Accomplished
          </h2>
          <p className="text-xs text-ink/70 mt-1 max-w-xs mx-auto">
            Someday became now for:
          </p>
          <p className="font-serif-journal text-base font-medium text-ink mt-1.5 px-4">
            “{item.title}”
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Milestone Star Rating */}
          <div className="text-center">
            <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-2">
              Memory Resonance
            </label>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink/20 hover:text-[#B45309] transition-colors"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? 'text-[#B45309] fill-[#B45309]' : 'text-ink/20'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Reflection Journal Note */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
              Retrospective Journal Note
            </label>
            <textarea
              rows={3}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What made this moment unforgettable? What changed in you after experiencing this?"
              className="w-full px-3.5 py-2.5 text-sm bg-card border border-ink/15 rounded-xl text-ink placeholder-ink/40 focus:outline-none focus:border-ink"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold text-ink/70 hover:text-ink rounded-xl hover:bg-ink/5"
            >
              Skip Reflection
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 text-xs font-semibold text-white bg-[#4A6B56] hover:bg-[#3d5a47] rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Preserve in Memories</span>
            </button>
          </div>
        </form>
      </div>
    </Sheet>
  );
};
