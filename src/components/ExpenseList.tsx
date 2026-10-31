import React, { useState } from 'react';
import { Receipt, X } from 'lucide-react';
import { WishExpense } from '../types';
import { expenseTotal, formatMoney } from '../utils/expenses';
import { ExpenseSheet } from './ExpenseSheet';

interface ExpenseListProps {
  expenses: WishExpense[];
  title: string; // the wish's title, for the add sheet
  currency: string; // ISO code
  onAdd?: (amount: number, note?: string) => void;
  onRemove: (expenseId: string) => void;
}

// The money spent on a wish, with its total
export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, title, currency, onAdd, onRemove }) => {
  const [isAdding, setIsAdding] = useState(false);
  const total = expenseTotal(expenses);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-ink/60">
          <Receipt className="w-3.5 h-3.5" />
          <span>Expenses</span>
        </span>
        {expenses.length > 0 && (
          <span className="font-mono-journal text-[11px] text-ink/55">{formatMoney(total, currency)} spent</span>
        )}
      </div>

      {expenses.length > 0 && (
        <ul className="bg-card border border-ink/10 rounded-xl divide-y divide-ink/8">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-center gap-2 pl-3 pr-1 min-h-[44px]">
              <div className="flex-1 min-w-0">
                <span className="block text-sm text-ink/85 leading-snug truncate">{expense.note || 'Expense'}</span>
                <span className="block font-mono-journal text-[10px] text-ink/45">
                  {new Date(expense.spentAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <span className="shrink-0 font-mono-journal text-sm text-ink tabular-nums">
                {formatMoney(expense.amount, currency)}
              </span>
              <button
                type="button"
                onClick={() => onRemove(expense.id)}
                aria-label={`Remove expense ${formatMoney(expense.amount, currency)}${expense.note ? ` "${expense.note}"` : ''}`}
                title="Remove expense"
                className="min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-lg text-ink/35 hover:text-ink/70"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {onAdd && (
        <>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            aria-label="Add expense"
            className="w-full min-h-[44px] px-4 text-xs font-semibold rounded-xl border border-dashed border-ink/20 bg-card text-ink/70 hover:text-ink transition-colors"
          >
            Add
          </button>
          <ExpenseSheet
            isOpen={isAdding}
            title={title}
            currency={currency}
            onSave={onAdd}
            onClose={() => setIsAdding(false)}
          />
        </>
      )}
    </div>
  );
};
