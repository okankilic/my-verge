import React from 'react';
import { BucketItem, CategoryDefinition } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { ItemActions } from './ItemActions';

interface ItemRowProps {
  item: BucketItem;
  categoryDef?: CategoryDefinition;
  onToggleComplete: (item: BucketItem) => void;
  onToggleStarted: (item: BucketItem) => void;
  onDelete: (id: string) => void;
  onSelect: (item: BucketItem) => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  categoryDef,
  onToggleComplete,
  onToggleStarted,
  onDelete,
  onSelect,
}) => {
  const isCompleted = item.status === 'completed';
  const categoryName = categoryDef?.verb || item.categoryId;

  return (
    <article
      onClick={() => onSelect(item)}
      className={`group relative bg-card border rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 space-y-1 transition-all duration-150 cursor-pointer shadow-[var(--item-shadow)] hover:border-ink/25 ${
        isCompleted
          ? 'border-ink/8 bg-paper/60 opacity-75'
          : 'border-ink/12'
      }`}
    >
      {/* Category + Sub-category | Icon */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 flex items-baseline gap-1.5 min-w-0">
          <span className="shrink-0 text-[11px] uppercase tracking-wider text-ink/60 font-semibold leading-tight">
            {categoryName}
          </span>
          {item.subCategory && (
            <span className="text-[11px] text-ink/40 font-medium leading-tight truncate">
              · {item.subCategory}
            </span>
          )}
        </div>
        <span
          className="shrink-0 ml-2 transition-colors"
          style={{ color: categoryDef?.accentColor || 'var(--color-ink)' }}
        >
          {renderCategoryIcon(categoryDef?.icon || item.categoryId, 'w-3.5 h-3.5')}
        </span>
      </div>

      {/* Primary Intention Title */}
      <h3
        className={`font-serif-journal text-[15px] sm:text-base font-medium tracking-tight text-ink leading-snug transition-colors ${
          isCompleted ? 'line-through text-ink/40' : ''
        }`}
      >
        {item.title}
      </h3>

      <ItemActions
        item={item}
        onToggleStarted={onToggleStarted}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
      />
    </article>
  );
};
