import { BucketItem, CategoryDefinition } from '../types';
import { expenseTotal, wishCurrency } from './expenses';

export interface CategorySummary {
  categoryId: string;
  completed: number;
  inProgress: number;
  awaiting: number;
  // One total per currency, so different currencies are never added together
  spent: Map<string, number>;
  budgeted: Map<string, number>;
}

export type PlanStatus = 'completed' | 'inProgress' | 'awaiting';

// The one status test the Summary counts and the per-category lists share
export const planStatus = (item: BucketItem): PlanStatus =>
  item.status === 'completed' ? 'completed' : item.startedAt ? 'inProgress' : 'awaiting';

const add = (totals: Map<string, number>, code: string, amount: number) => {
  if (amount > 0) totals.set(code, (totals.get(code) ?? 0) + amount);
};

// Counts and money per category, in the categories' order; categories with no plans are left out
export function summarizeByCategory(
  items: BucketItem[],
  categories: CategoryDefinition[]
): CategorySummary[] {
  const byId = new Map<string, CategorySummary>();
  for (const item of items) {
    if (item.status === 'archived') continue;
    let summary = byId.get(item.categoryId);
    if (!summary) {
      summary = {
        categoryId: item.categoryId,
        completed: 0,
        inProgress: 0,
        awaiting: 0,
        spent: new Map(),
        budgeted: new Map(),
      };
      byId.set(item.categoryId, summary);
    }
    summary[planStatus(item)] += 1;
    const code = wishCurrency(item);
    add(summary.spent, code, expenseTotal(item.expenses));
    add(summary.budgeted, code, item.budget?.estimatedCost ?? 0);
  }

  const order = new Map(categories.map((c, i) => [c.id, i]));
  return [...byId.values()].sort(
    (a, b) => (order.get(a.categoryId) ?? order.size) - (order.get(b.categoryId) ?? order.size)
  );
}
