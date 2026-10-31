import React from 'react';
import { Plus } from 'lucide-react';
import { CategoryDefinition } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';

interface CategoryRibbonProps {
  categories: CategoryDefinition[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  countsByCategory: Record<string, number>;
  onOpenCreateCategory: () => void;
}

const countBadgeClass = (isSelected: boolean) =>
  `min-w-[18px] h-[18px] px-1.5 rounded-full inline-flex items-center justify-center text-[10px] leading-none font-mono font-semibold tabular-nums ${
    isSelected ? 'bg-paper/20 text-paper' : 'bg-ink/8 text-ink/70'
  }`;

// Widths of the edge fades that hint the row scrolls past the screen edge.
const FADE_LEFT_PX = 24;
const FADE_RIGHT_PX = 40;

/**
 * Fades whichever edge of a horizontal scroll row has more content beyond it,
 * since the scrollbar is hidden and chips can end flush with the screen edge.
 */
const useEdgeFade = () => {
  const [el, setEl] = React.useState<HTMLDivElement | null>(null);
  const [edges, setEdges] = React.useState({ left: false, right: false });

  const update = React.useCallback(() => {
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const left = scrollLeft > 2;
    const right = scrollLeft + clientWidth < scrollWidth - 2;
    setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, [el]);

  // Content (categories, counts) changes on re-render; the observer covers resizes.
  React.useLayoutEffect(update);
  React.useEffect(() => {
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, update]);

  const gradient = `linear-gradient(to right, ${edges.left ? 'transparent' : '#000'} 0, #000 ${FADE_LEFT_PX}px, #000 calc(100% - ${FADE_RIGHT_PX}px), ${edges.right ? 'transparent' : '#000'} 100%)`;
  const style: React.CSSProperties | undefined =
    edges.left || edges.right ? { maskImage: gradient, WebkitMaskImage: gradient } : undefined;

  return { el, ref: setEl, onScroll: update, style };
};

export const CategoryRibbon: React.FC<CategoryRibbonProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  countsByCategory,
  onOpenCreateCategory,
}) => {
  const { el: rowEl, ref: rowRef, onScroll: onRowScroll, style: rowStyle } = useEdgeFade();

  // Keep the selected chip out from under the edge fades.
  React.useEffect(() => {
    const chip = rowEl?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!rowEl || !chip) return;
    const row = rowEl.getBoundingClientRect();
    const box = chip.getBoundingClientRect();
    if (box.left < row.left + FADE_LEFT_PX) {
      rowEl.scrollBy({ left: box.left - row.left - FADE_LEFT_PX, behavior: 'smooth' });
    } else if (box.right > row.right - FADE_RIGHT_PX) {
      rowEl.scrollBy({ left: box.right - row.right + FADE_RIGHT_PX, behavior: 'smooth' });
    }
  }, [rowEl, selectedCategoryId]);

  return (
    <div
      ref={rowRef}
      onScroll={onRowScroll}
      style={rowStyle}
      className="flex items-center gap-1.5 overflow-x-auto flex-nowrap scroll-smooth touch-pan-x py-1 scrollbar-none no-scrollbar animate-in fade-in duration-150"
    >
      {/* 'All' Tab */}
      <button
        type="button"
        onClick={() => onSelectCategory('all')}
        aria-pressed={selectedCategoryId === 'all'}
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
            onClick={() => onSelectCategory(cat.id)}
            aria-pressed={isSelected}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              isSelected
                ? 'border border-ink bg-ink text-paper shadow-2xs font-semibold'
                : 'border border-ink/15 bg-card text-ink/80 shadow-2xs hover:bg-paper hover:border-ink/30 hover:text-ink active:scale-95'
            }`}
          >
            <span style={{ color: cat.accentColor }}>{renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}</span>
            <span>{cat.verb}</span>
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
  );
};
