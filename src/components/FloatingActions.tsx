import React from 'react';
import { Plus, Search, X } from 'lucide-react';

interface FloatingActionsProps {
  onOpenCreate: () => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
}

// Search and New float at the bottom-right on every width: above the dock on phones, in the corner from md:.
// z-30 keeps them under the dock (z-40), sheets (z-50) and toasts (z-[70]).
export const FloatingActions: React.FC<FloatingActionsProps> = ({
  onOpenCreate,
  isSearchOpen,
  onToggleSearch,
}) => (
  <div
    className="fixed z-30 flex flex-col items-center gap-3 right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(5rem+env(safe-area-inset-bottom))] md:right-[calc(1.5rem+env(safe-area-inset-right))] md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
  >
    <button
      type="button"
      onClick={onToggleSearch}
      title={isSearchOpen ? 'Close search' : 'Search'}
      aria-label={isSearchOpen ? 'Close search' : 'Search'}
      aria-pressed={isSearchOpen}
      className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-md transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
        isSearchOpen ? 'bg-paper border-ink/40 text-ink' : 'bg-card border-ink/15 text-ink'
      }`}
    >
      {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
    </button>

    <button
      type="button"
      onClick={onOpenCreate}
      title="New Wish"
      aria-label="New Wish"
      className="w-14 h-14 rounded-full flex items-center justify-center bg-ink text-paper shadow-lg shadow-black/20 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
    >
      <Plus className="w-6 h-6 stroke-[2.5]" />
    </button>
  </div>
);
