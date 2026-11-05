import React from 'react';
import { BookMarked, ChevronRight } from 'lucide-react';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { PlanStatus, planStatus, summarizeByCategory } from '../utils/vaultSummary';
import { expenseTotal, formatMoney, wishCurrency } from '../utils/expenses';
import { VAULT_RANGES, TimeRange, rangeLabel } from '../utils/timeRange';
import { BucketItem, CategoryDefinition } from '../types';
import { TimeRangeFilter } from './TimeRangeFilter';
import { EmptyState } from './EmptyState';

interface VaultViewProps {
  items: BucketItem[];
  categories: CategoryDefinition[];
  // The Vault's ribbon pick; a single category also lists its plans by status
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onSelect: (item: BucketItem) => void;
  range: TimeRange;
  yearRanges: TimeRange[];
  onRangeChange: (range: TimeRange) => void;
  isRangeOpen: boolean;
  onOpenRange: () => void;
  onCloseRange: () => void;
  // Set while search or a category pick hides plans
  onClearFilters?: () => void;
}

// Categories whose plans show in the Vault (Settings' "Show in Vault")
export const keptCategoryIds = (categories: CategoryDefinition[]) =>
  new Set(categories.filter((c) => c.keepInVault).map((c) => c.id));

// Active and finished wishes in a category switched on in Settings; archived ones never show.
// App.tsx uses this for the category ribbon counts, so they match what the Vault sums up.
export const isInVault = (i: BucketItem, keptIds: Set<string>) =>
  keptIds.has(i.categoryId) && (i.status === 'active' || i.status === 'completed');

// The date the time filter goes by: when a done wish was finished, else when it was added
export const vaultDate = (i: BucketItem) =>
  (i.status === 'completed' && i.completedAt) || i.createdAt;

const STATUS_GROUPS: { status: PlanStatus; label: string }[] = [
  { status: 'completed', label: 'Done' },
  { status: 'inProgress', label: 'In progress' },
  { status: 'awaiting', label: 'Awaiting' },
];

// Finished and started plans newest first; awaiting ones keep the Journal order
const sortForStatus = (items: BucketItem[], status: PlanStatus) => {
  if (status === 'awaiting') return items;
  const key = (i: BucketItem) => (status === 'completed' ? i.completedAt : i.startedAt) ?? '';
  return [...items].sort((a, b) => key(b).localeCompare(key(a)));
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// The mono line under a listed plan: when it was finished or started, or its budget, plus what was spent
const planMeta = (item: BucketItem, status: PlanStatus) => {
  const code = wishCurrency(item);
  const parts: string[] = [];
  if (status === 'completed' && item.completedAt) parts.push(shortDate(item.completedAt));
  if (status === 'inProgress' && item.startedAt) parts.push(`Since ${shortDate(item.startedAt)}`);
  if (status === 'awaiting' && (item.budget?.estimatedCost ?? 0) > 0)
    parts.push(`Budget ${formatMoney(item.budget!.estimatedCost, code)}`);
  const spent = expenseTotal(item.expenses);
  if (spent > 0) parts.push(`Spent ${formatMoney(spent, code)}`);
  return parts.join(' · ');
};

export const VaultView: React.FC<VaultViewProps> = ({
  items,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onSelect,
  range,
  yearRanges,
  onRangeChange,
  isRangeOpen,
  onOpenRange,
  onCloseRange,
  onClearFilters,
}) => {
  // Only plans from the categories switched on in Settings
  const keptIds = keptCategoryIds(categories);
  const vaultPlans = items.filter((i) => isInVault(i, keptIds));
  const isEmpty = vaultPlans.length === 0;

  // Per-category counts and money
  const summaries = summarizeByCategory(vaultPlans, categories);

  // With one category picked, its plans grouped the way the Summary counts them
  const groups: { status: PlanStatus; label: string; items: BucketItem[] }[] =
    selectedCategoryId === 'all'
      ? []
      : STATUS_GROUPS.map(({ status, label }) => ({
          status,
          label,
          items: sortForStatus(
            vaultPlans.filter((i) => i.categoryId === selectedCategoryId && planStatus(i) === status),
            status
          ),
        })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      <TimeRangeFilter
        id="vault"
        range={range}
        options={[...VAULT_RANGES, ...yearRanges]}
        onChange={onRangeChange}
        isOpen={isRangeOpen}
        onOpen={onOpenRange}
        onClose={onCloseRange}
        ariaLabel="Filter the Vault by time"
        sheetTitle="Show plans from"
      />

      {isEmpty &&
        (range === 'all' ? (
          <EmptyState
            icon={<BookMarked className="w-6 h-6 stroke-[1.5]" />}
            title="Your Vault is ready to fill"
            hint="Plans from the categories you pick in Settings show up here."
            onClearFilters={onClearFilters}
          />
        ) : (
          <EmptyState
            icon={<BookMarked className="w-6 h-6 stroke-[1.5]" />}
            title={`${rangeLabel(range)} is ready to fill`}
            hint="Try another time range to see more."
            onClearFilters={onClearFilters}
          />
        ))}

      {/* Summary per category */}
      {summaries.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-serif-journal text-lg font-medium text-ink">Summary</h3>
          <ul className="bg-card border border-ink/10 rounded-2xl divide-y divide-ink/8">
            {summaries.map((s) => {
              const cat = categories.find((c) => c.id === s.categoryId);
              const counts = [
                s.completed > 0 && `${s.completed} done`,
                s.inProgress > 0 && `${s.inProgress} in progress`,
                s.awaiting > 0 && `${s.awaiting} awaiting`,
              ].filter(Boolean);
              const codes = [...new Set([...s.spent.keys(), ...s.budgeted.keys()])];
              return (
                <li key={s.categoryId}>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(s.categoryId)}
                    aria-label={`Show ${cat?.verb || s.categoryId} plans`}
                    aria-pressed={selectedCategoryId === s.categoryId}
                    className="w-full min-h-[44px] px-4 py-3 flex items-start gap-2.5 text-left"
                  >
                  <span className="mt-0.5 shrink-0" style={{ color: cat?.accentColor || 'var(--color-ink)' }}>
                    {renderCategoryIcon(cat?.icon || s.categoryId, 'w-4 h-4')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{cat?.verb || s.categoryId}</div>
                    <div className="mt-0.5 text-[11px] font-mono text-ink/60">{counts.join(' · ')}</div>
                    {codes.map((code) => (
                      <div key={code} className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] font-mono">
                        {s.spent.has(code) && (
                          <span className="text-[#059669]">Spent {formatMoney(s.spent.get(code), code)}</span>
                        )}
                        {s.budgeted.has(code) && (
                          <span className="text-ink/60">Budget {formatMoney(s.budgeted.get(code), code)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <ChevronRight aria-hidden className="w-4 h-4 mt-0.5 shrink-0 text-ink/40" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* The picked category's plans, by status */}
      {groups.map((group) => (
        <section key={group.status} className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-ink/60">
            <span>{group.label}</span>
            <span className="font-mono text-[11px] text-ink/50">{group.items.length}</span>
          </div>
          <ul className="bg-card border border-ink/10 rounded-2xl divide-y divide-ink/8">
            {group.items.map((item) => {
              const meta = planMeta(item, group.status);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="w-full min-h-[44px] px-4 py-2.5 flex items-center gap-2.5 text-left"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-sm text-ink">{item.title}</span>
                      {meta && (
                        <span className="block mt-0.5 truncate text-[11px] font-mono text-ink/55">{meta}</span>
                      )}
                    </span>
                    <ChevronRight aria-hidden className="w-4 h-4 shrink-0 text-ink/40" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};
