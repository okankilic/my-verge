import React from 'react';
import {
  Search,
  X,
  ArrowUp,
  Plus,
} from 'lucide-react';
import { CategoryDefinition, FilterSortOption } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';

interface CategoryRibbonProps {
  categories: CategoryDefinition[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  selectedSubCategory: string;
  onSelectSubCategory: (sub: string) => void;
  countsByCategory: Record<string, number>;
  countsBySubCategory: Record<string, number>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (p: string) => void;
  sortOption: FilterSortOption;
  onSortOptionChange: (s: FilterSortOption) => void;
  isFilterOpen: boolean;
  onOpenCreateCategory: () => void;
}

export const CategoryRibbon: React.FC<CategoryRibbonProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  selectedSubCategory,
  onSelectSubCategory,
  countsByCategory,
  countsBySubCategory,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  sortOption,
  onSortOptionChange,
  isFilterOpen,
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
    <div className="space-y-2 pb-1">
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
            className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#1E1915]/15 bg-white text-[#1E1915] hover:bg-[#FAF7F2] hover:border-[#1E1915]/30 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 shadow-2xs text-xs font-semibold group cursor-pointer"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5] text-[#1E1915] group-hover:-translate-y-0.5 transition-transform" />
            <span className="font-serif-journal font-medium text-xs">
              {selectedCategory?.name}
            </span>
          </button>

          {/* Hairline Divider */}
          <div className="w-[1px] h-4 bg-[#1E1915]/15 shrink-0 mx-0.5" />

          {/* 'All' Sub-category Tab */}
          <button
            type="button"
            onClick={() => onSelectSubCategory('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedSubCategory === 'all'
                ? 'bg-[#1E1915] text-[#FAF7F2] shadow-2xs font-semibold'
                : 'text-[#1E1915]/70 hover:text-[#1E1915] hover:bg-[#1E1915]/5'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-70 font-mono">
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
                    ? 'bg-[#1E1915] text-[#FAF7F2] shadow-2xs font-semibold'
                    : 'text-[#1E1915]/70 hover:text-[#1E1915] hover:bg-[#1E1915]/5'
                }`}
              >
                <span>{sub}</span>
                {count > 0 && (
                  <span className="text-[10px] opacity-70 font-mono">{count}</span>
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
                ? 'bg-[#1E1915] text-[#FAF7F2] shadow-2xs font-semibold'
                : 'text-[#1E1915]/70 hover:text-[#1E1915] hover:bg-[#1E1915]/5'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-70 font-mono">
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
                    ? 'bg-[#1E1915] text-[#FAF7F2] shadow-2xs font-semibold'
                    : 'text-[#1E1915]/70 hover:text-[#1E1915] hover:bg-[#1E1915]/5'
                }`}
              >
                <span style={{ color: cat.accentColor }}>{renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}</span>
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-70 font-mono">{count}</span>
              </button>
            );
          })}

          {/* Icon only button at the end to create a custom category */}
          <button
            type="button"
            onClick={onOpenCreateCategory}
            title="Create custom category"
            aria-label="Create custom category"
            className="min-h-[38px] min-w-[38px] p-2 rounded-lg border border-dashed border-[#1E1915]/25 bg-white/70 hover:bg-white hover:border-[#1E1915]/60 text-[#1E1915]/60 hover:text-[#1E1915] active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-2xs group cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.2] group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>
      )}

      {/* Collapsible Search & Filter Tray */}
      {isFilterOpen && (
        <div className="p-3 bg-white border border-[#1E1915]/10 rounded-lg shadow-xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#1E1915]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search intentions, places, authors..."
              className="w-full min-h-[38px] pl-8 pr-8 py-1.5 text-xs bg-[#FAF7F2] border border-[#1E1915]/12 rounded-lg text-[#1E1915] focus:outline-none focus:border-[#1E1915]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1E1915]/40 hover:text-[#1E1915]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#1E1915]/50 font-semibold mb-1">
                Timeframe
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => onPriorityFilterChange(e.target.value)}
                className="w-full min-h-[36px] px-2 py-1 text-xs bg-[#FAF7F2] border border-[#1E1915]/12 rounded-lg text-[#1E1915] focus:outline-none"
              >
                <option value="all">All Horizons</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
                <option value="someday">Someday</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#1E1915]/50 font-semibold mb-1">
                Sort Order
              </label>
              <select
                value={sortOption}
                onChange={(e) => onSortOptionChange(e.target.value as FilterSortOption)}
                className="w-full min-h-[36px] px-2 py-1 text-xs bg-[#FAF7F2] border border-[#1E1915]/12 rounded-lg text-[#1E1915] focus:outline-none"
              >
                <option value="targetDate">Target Date</option>
                <option value="priority">Priority</option>
                <option value="newest">Recently Added</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
