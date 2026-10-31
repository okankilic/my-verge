import React, { useState } from 'react';
import { Trophy, Star } from 'lucide-react';
import { BucketItem } from '../types';
import { Sheet } from './Sheet';
import { KeepInVaultSwitch, HideInMemoriesSwitch } from './KeepInVaultSwitch';
import { ExpenseList } from './ExpenseList';
import { wishCurrency } from '../utils/expenses';

interface MilestoneSheetProps {
  item: BucketItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveReflection: (itemId: string, reflection: string, rating: number) => void;
  onToggleKeep: (item: BucketItem) => void;
  onToggleHide: (item: BucketItem) => void;
  onAddExpense: (item: BucketItem, amount: number, note?: string) => void;
  onRemoveExpense: (item: BucketItem, expenseId: string) => void;
}

export const MilestoneSheet: React.FC<MilestoneSheetProps> = ({
  item,
  isOpen,
  onClose,
  onSaveReflection,
  onToggleKeep,
  onToggleHide,
  onAddExpense,
  onRemoveExpense,
}) => {
  // App.tsx keys this sheet by item id, so state is seeded fresh for each item
  const [reflection, setReflection] = useState(item?.completionReflection || '');
  // 0 means unrated: closing without tapping a star stores no rating
  const [rating, setRating] = useState(item?.completionRating ?? 0);

  if (!isOpen || !item) return null;

  // Every way out (Close, backdrop, Escape) saves the rating and note first
  const handleClose = () => {
    const trimmed = reflection.trim();
    if (trimmed !== (item.completionReflection || '') || rating !== (item.completionRating ?? 0)) {
      onSaveReflection(item.id, trimmed, rating);
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleClose();
  };

  return (
    <Sheet isOpen onClose={handleClose} width="md" labelledBy="milestone-title">
      <div className="overflow-y-auto p-6 sm:p-7">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#4A6B56]/15 text-[#4A6B56] rounded-2xl mx-auto flex items-center justify-center mb-3">
            <Trophy className="w-6 h-6 stroke-[2]" />
          </div>
          <h2 id="milestone-title" className="font-serif-journal text-2xl font-semibold text-ink">
            You made it real
          </h2>
          <p className="text-xs text-ink/70 mt-1 max-w-xs mx-auto">
            Look what you did:
          </p>
          <p className="font-serif-journal text-base font-medium text-ink mt-1.5 px-4">
            “{item.title}”
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Milestone Star Rating */}
          <div className="text-center">
            <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-2">
              How did it feel?
            </label>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  aria-label={`${star} star${star === 1 ? '' : 's'}`}
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
              A note for future you
            </label>
            <textarea
              rows={3}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What made it special? Jot down anything you'd love to remember."
              className="w-full px-3.5 py-2.5 text-sm bg-card border border-ink/15 rounded-xl text-ink placeholder-ink/40 focus:outline-none focus:border-ink"
            />
          </div>

          {/* What it cost, for wishes finished without a stop on Now; applies at once, not on close */}
          <ExpenseList
            expenses={item.expenses || []}
            title={item.title}
            currency={wishCurrency(item)}
            onAdd={(amount, note) => onAddExpense(item, amount, note)}
            onRemove={(expenseId) => onRemoveExpense(item, expenseId)}
          />

          {/* Applies at once, not on close */}
          <div className="space-y-2">
            <KeepInVaultSwitch checked={Boolean(item.keptInVault)} onToggle={() => onToggleKeep(item)} />
            <HideInMemoriesSwitch checked={Boolean(item.hiddenInMemories)} onToggle={() => onToggleHide(item)} />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 text-xs font-semibold text-white bg-[#4A6B56] hover:bg-[#3d5a47] rounded-xl shadow-md transition-all"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </Sheet>
  );
};
