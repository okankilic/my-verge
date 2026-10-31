import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (q: string) => void;
  onClose: () => void;
}

// Global search row rendered inside the sticky TopNav header, below the nav row
export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onClose }) => {
  return (
    <div className="border-t border-ink/15 mt-2.5 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2.5">
      <div className="relative max-w-6xl mx-auto">
        <Search className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
          autoFocus
          placeholder="Search all wishes, places, authors..."
          aria-label="Search all items"
          className="w-full min-h-[44px] pl-9 pr-11 py-2 text-sm bg-card border border-ink/15 rounded-lg text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            title="Clear search"
            aria-label="Clear search"
            className="absolute right-0 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-ink/40 hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
