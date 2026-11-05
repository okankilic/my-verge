import React from 'react';
import { BucketItem } from '../types';
import { stepProgress } from '../utils/steps';

type ConfirmTone = 'danger' | 'positive';

// Inline two-step confirm shown in the page (no confirm dialogs in this app).
// Every action that changes a plan confirms here first; there are no Undo toasts.
export const InlineConfirm: React.FC<{
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  cancelLabel?: string;
  tone?: ConfirmTone;
  className?: string;
}> = ({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  className = 'mt-3 pt-3 border-t border-ink/10',
}) => (
  <div
    role="group"
    // Taps inside a card's confirm must not open the card's drawer
    onClick={(e) => e.stopPropagation()}
    className={`${className} animate-in fade-in duration-150`}
  >
    <p className="text-xs text-ink/75 leading-relaxed break-words">{message}</p>
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 min-h-[44px] px-4 text-xs font-medium text-ink bg-paper border border-ink/15 rounded-xl active:bg-paper-deep transition-colors"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className={`flex-1 min-h-[44px] px-4 text-xs font-semibold text-white rounded-xl transition-colors ${
          tone === 'positive' ? 'bg-[#4A6B56] active:bg-[#3d5947]' : 'bg-red-600 active:bg-red-700'
        }`}
      >
        {confirmLabel}
      </button>
    </div>
  </div>
);

export type PlanConfirmKind = 'start' | 'done' | 'delete';

// One wording for the plan actions, wherever they're confirmed (cards, Vault, drawer)
export function planConfirmCopy(
  kind: PlanConfirmKind,
  item: BucketItem
): { message: string; confirmLabel: string; tone: ConfirmTone } {
  switch (kind) {
    case 'start': {
      const prep = stepProgress(item.prepSteps);
      const left = prep.total - prep.done;
      const prepNote = left > 0 ? ` ${left} prep ${left === 1 ? 'item' : 'items'} to go.` : '';
      return { message: `Start "${item.title}"?${prepNote}`, confirmLabel: 'Start', tone: 'positive' };
    }
    case 'done':
      return { message: `Mark "${item.title}" as done?`, confirmLabel: 'Done', tone: 'positive' };
    case 'delete':
      return { message: `Delete "${item.title}" for good?`, confirmLabel: 'Delete', tone: 'danger' };
  }
}

// Renders the confirm for a plan action, or nothing while none is pending
export const PlanConfirm: React.FC<{
  kind: PlanConfirmKind | null;
  item: BucketItem;
  onCancel: () => void;
  onConfirm: (kind: PlanConfirmKind) => void;
  className?: string;
}> = ({ kind, item, onCancel, onConfirm, className }) => {
  if (!kind) return null;
  const copy = planConfirmCopy(kind, item);
  return (
    <InlineConfirm
      {...copy}
      className={className}
      onCancel={onCancel}
      onConfirm={() => onConfirm(kind)}
    />
  );
};
