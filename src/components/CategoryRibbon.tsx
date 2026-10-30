import React from 'react';
import { ArrowUp, Plus } from 'lucide-react';
import { CategoryDefinition } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';

interface CategoryRibbonProps {
  categories: CategoryDefinition[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  selectedSubCategory: string;
  onSelectSubCategory: (sub: string) => void;
  countsByCategory: Record<string, number>;
  countsBySubCategory: Record<string, number>;
  onOpenCreateCategory: () => void;
}

const countBadgeClass = (isSelected: boolean) =>
  `min-w-[18px] h-[18px] px-1.5 rounded-full inline-flex items-center justify-center text-[10px] leading-none font-mono font-semibold tabular-nums ${
    isSelected ? 'bg-paper/20 text-paper' : 'bg-ink/8 text-ink/70'
  }`;

export const CategoryRibbon: React.FC<CategoryRibbonProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  selectedSubCategory,
  onSelectSubCategory,
  countsByCategory,
  countsBySubCategory,
  onOpenCreateCategory,
}) => {

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const subCategories = React.useMemo(() => {
    if (!selectedCategory) return [];
    const set = new Set<string>(selectedCategory.defaultSubCategories || []);
    Object.keys(countsBySubCategory).forEach((sub) => {
      if (sub && sub !== 'all') {
        set.add(sub);
      }
    });
    return Array.from(set);
  }, [selectedCategory, countsBySubCategory]);

  const hasSubCategories = Boolean(
    selectedCategory && subCategories.length > 0 && selectedCategoryId !== 'all'
  );

  return (
    <div className="space-y-2">
      {hasSubCategories ? (
        /* Sub-categories row with Up icon (Categories row hidden) */
        <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap scroll-smooth touch-pan-x py-1 scrollbar-none no-scrollbar animate-in fade-in duration-150">
          {/* Up icon button to return to all categories */}
          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              onSelectSubCategory('all');
            }}
            title="Back to all categories"
            aria-label="Back to all categories"
            className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-ink/15 bg-card text-ink hover:bg-paper hover:border-ink/30 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 shadow-2xs text-xs font-semibold group cursor-pointer"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5] text-ink group-hover:-translate-y-0.5 transition-transform" />
            <span className="font-serif-journal font-medium text-xs">
              {selectedCategory?.name}
            </span>
          </button>

          {/* Hairline Divider */}
          <div className="w-[1px] h-4 bg-ink/15 shrink-0 mx-0.5" />

          {/* 'All' Sub-category Tab */}
          <button
            type="button"
            onClick={() => onSelectSubCategory('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedSubCategory === 'all'
                ? 'border border-ink bg-ink text-paper shadow-2xs font-semibold'
                : 'border border-ink/15 bg-card text-ink/80 shadow-2xs hover:bg-paper hover:border-ink/30 hover:text-ink active:scale-95'
            }`}
          >
            <span>All</span>
            <span className={countBadgeClass(selectedSubCategory === 'all')}>
              {countsByCategory[selectedCategoryId] || 0}
            </span>
          </button>

          {/* Sub-categories */}
          {subCategories.map((sub) => {
            const isSelected = selectedSubCategory === sub;
            const count = countsBySubCategory[sub] || 0;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => onSelectSubCategory(sub)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'border border-ink bg-ink text-paper shadow-2xs font-semibold'
                    : 'border border-ink/15 bg-card text-ink/80 shadow-2xs hover:bg-paper hover:border-ink/30 hover:text-ink active:scale-95'
                }`}
              >
                <span>{sub}</span>
                {count > 0 && (
                  <span className={countBadgeClass(isSelected)}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Primary Categories row (Visible when 'all' or category has no sub-categories) */
        <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap scroll-smooth touch-pan-x py-1 scrollbar-none no-scrollbar animate-in fade-in duration-150">
          {/* 'All' Tab */}
          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              onSelectSubCategory('all');
            }}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'border border-ink bg-ink text-paper shadow-2xs font-semibold'
                : 'border border-ink/15 bg-card text-ink/80 shadow-2xs hover:bg-paper hover:border-ink/30 hover:text-ink active:scale-95'
            }`}
          >
            <span>All</span>
            <span className={countBadgeClass(selectedCategoryId === 'all')}>
              {countsByCategory['all'] || 0}
            </span>
          </button>

          {/* Individual Categories */}
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const count = countsByCategory[cat.id] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id);
                  onSelectSubCategory('all');
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'border border-ink bg-ink text-paper shadow-2xs font-semibold'
                    : 'border border-ink/15 bg-card text-ink/80 shadow-2xs hover:bg-paper hover:border-ink/30 hover:text-ink active:scale-95'
                }`}
              >
                <span style={{ color: cat.accentColor }}>{renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}</span>
                <span>{cat.name}</span>
                <span className={countBadgeClass(isSelected)}>{count}</span>
              </button>
            );
          })}

          {/* Icon only button at the end to create a custom category */}
          <button
            type="button"
            onClick={onOpenCreateCategory}
            title="Create custom category"
            aria-label="Create custom category"
            className="min-h-[38px] min-w-[38px] p-2 rounded-lg border border-dashed border-ink/25 bg-card/70 hover:bg-card hover:border-ink/60 text-ink/60 hover:text-ink active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-2xs group cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.2] group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>
      )}
    </div>
  );
};
