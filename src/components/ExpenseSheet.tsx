import React, { useState } from 'react';
import { EXPENSE_NOTE_MAX_LENGTH } from '../types';
import { currencySymbol, parseAmount } from '../utils/expenses';
import { Sheet } from './Sheet';

interface ExpenseSheetProps {
  isOpen: boolean;
  title: string; // the wish's title, shown so it's clear where the money goes
  currency: string; // ISO code
  onSave: (amount: number, note?: string) => void;
  onClose: () => void;
}

// Logs money spent on a wish: an amount and an optional short note
export const ExpenseSheet: React.FC<ExpenseSheetProps> = ({ isOpen, title, currency, onSave, onClose }) => {
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const amount = parseAmount(amountText);

  if (!isOpen) return null;

  const close = () => {
    setAmountText('');
    setNote('');
    onClose();
  };

  return (
    // Stacked: it can open over the item detail sheet. Dismissing it adds nothing.
    <Sheet isOpen onClose={close} width="md" stacked labelledBy="expense-sheet-title">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (amount === null) return;
          onSave(amount, note.trim() || undefined);
          close();
        }}
        className="flex-1 overflow-y-auto"
      >
        <div className="px-4 py-3 border-b border-ink/10">
          <span id="expense-sheet-title" className="font-serif-journal text-base text-ink block">
            Add an expense
          </span>
          <span className="text-[11px] text-ink/55 block truncate">{title}</span>
        </div>

        <div className="p-4 space-y-3">
          <label className="flex items-center gap-2 min-h-[52px] px-3 bg-card border border-ink/15 rounded-xl focus-within:border-ink">
            <span aria-hidden className="font-mono-journal text-lg text-ink/50">
              {currencySymbol(currency)}
            </span>
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              placeholder="0"
              aria-label="Amount"
              className="flex-1 min-w-0 bg-transparent font-mono-journal text-lg text-ink placeholder-ink/30 focus:outline-none"
            />
          </label>
          <input
            type="text"
            value={note}
            maxLength={EXPENSE_NOTE_MAX_LENGTH}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was it for? (optional)"
            aria-label="Note"
            className="w-full min-h-[44px] px-3 py-2 text-sm bg-card border border-ink/15 rounded-xl text-ink placeholder-ink/40 focus:outline-none focus:border-ink"
          />
        </div>

        <div className="px-4 pb-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="min-h-[44px] px-4 text-xs font-medium text-ink/70 hover:text-ink rounded-lg hover:bg-ink/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={amount === null}
            className="min-h-[44px] px-4 text-xs font-semibold bg-ink text-paper rounded-lg hover:bg-ink/85 disabled:opacity-40 transition-colors"
          >
            Save
          </button>
        </div>
      </form>
    </Sheet>
  );
};
