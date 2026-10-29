import React from 'react';
import { Check } from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';

interface ItemRowProps {
  item: BucketItem;
  categoryDef?: CategoryDefinition;
  onToggleComplete: (item: BucketItem) => void;
  onSelect: (item: BucketItem) => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  categoryDef,
  onToggleComplete,
  onSelect,
}) => {
  const isCompleted = item.status === 'completed';
  const categoryName = categoryDef?.name || item.categoryId;

  return (
    <article
      onClick={() => onSelect(item)}
      className={`group relative flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-3.5 bg-white border rounded-lg transition-all duration-150 cursor-pointer shadow-xs hover:border-[#1E1915]/30 ${
        isCompleted
          ? 'border-[#1E1915]/8 bg-[#FAF7F2]/60 opacity-75'
          : 'border-[#1E1915]/10'
      }`}
    >
      {/* Content */}
      <div className="flex-1 min-w-0 pr-2">
        {/* Category (Top) with Category Icon */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className="shrink-0 transition-colors"
            style={{ color: categoryDef?.accentColor || '#1E1915' }}
          >
            {renderCategoryIcon(categoryDef?.icon || item.categoryId, 'w-3.5 h-3.5')}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#1E1915]/60 font-semibold leading-tight">
            {categoryName}
          </span>
        </div>

        {/* Sub-category (Underneath Category with smaller text) */}
        {item.subCategory && (
          <span className="block text-[10px] text-[#1E1915]/40 font-medium leading-tight mb-1">
            {item.subCategory}
          </span>
        )}

        {/* Primary Intention Title */}
        <h3
          className={`font-serif-journal text-[15px] sm:text-base font-medium tracking-tight text-[#1E1915] leading-snug transition-colors ${
            isCompleted ? 'line-through text-[#1E1915]/40' : ''
          }`}
        >
          {item.title}
        </h3>
      </div>

      {/* Static Accomplish Check Button */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(item);
          }}
          title={isCompleted ? 'Mark unaccomplished' : 'Mark accomplished'}
          aria-label={isCompleted ? 'Mark unaccomplished' : 'Mark accomplished'}
          className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md border transition-colors ${
            isCompleted
              ? 'bg-[#4A6B56] border-[#4A6B56] text-white hover:bg-[#3d5947]'
              : 'bg-white border-[#1E1915]/20 text-[#1E1915]/60 hover:text-[#4A6B56] hover:border-[#4A6B56] hover:bg-[#4A6B56]/5'
          }`}
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </article>
  );
};
