import React from 'react';

interface EmptyStateProps {
  title: string;
  hint: React.ReactNode;
  icon?: React.ReactNode;
  // Set only while search or a category pick hides plans: adds the filter hint and a Clear button
  onClearFilters?: () => void;
  // An extra button next to Clear, such as the Journal's New
  action?: React.ReactNode;
}

// The one empty state every tab uses, so they read and look alike
export const EmptyState: React.FC<EmptyStateProps> = ({ title, hint, icon, onClearFilters, action }) => (
  <div className="p-10 text-center bg-card border border-ink/10 rounded-2xl">
    {icon && (
      <div className="w-12 h-12 bg-paper text-ink/40 rounded-lg mx-auto flex items-center justify-center mb-3">
        {icon}
      </div>
    )}
    <p className="font-serif-journal text-base text-ink/70">{title}</p>
    <p className="text-xs text-ink/50 mt-1 max-w-sm mx-auto">
      {hint}
      {onClearFilters && ' Or clear the filters to see the rest.'}
    </p>
    {(onClearFilters || action) && (
      <div className="flex items-center justify-center gap-2 pt-4">
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            aria-label="Clear search and category"
            className="min-h-[44px] px-4 bg-card border border-ink/15 text-ink text-xs font-semibold rounded-lg hover:bg-paper transition-all"
          >
            Clear
          </button>
        )}
        {action}
      </div>
    )}
  </div>
);
