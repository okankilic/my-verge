import React from 'react';
import { Smartphone, Monitor, SlidersHorizontal, Dices, Plus, Film, Settings } from 'lucide-react';
import { ViewTab } from '../types';

interface TopNavProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  activeRemindersCount: number;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  hasActiveFilters: boolean;
  onOpenCreate: () => void;
  onOpenSerendipity: () => void;
  onOpenSettings: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onTabChange,
  activeRemindersCount,
  isMobileFrame,
  onToggleMobileFrame,
  isFilterOpen,
  onToggleFilter,
  hasActiveFilters,
  onOpenCreate,
  onOpenSerendipity,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#1E1915]/10 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Brand Wordmark with Marcellus editorial typography & slogan */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('feed')}
            className="text-left group focus-visible:outline-none flex flex-col justify-center"
          >
            <span className="font-serif-journal text-xl sm:text-2xl font-semibold tracking-tight text-[#1E1915] group-hover:text-[#B45309] transition-colors leading-tight">
              My Verge
            </span>
            <span className="text-[10px] sm:text-[11px] font-sans tracking-tight text-[#1E1915]/55 leading-tight mt-0.5">
              Standing on the threshold of experience
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation text links (Desktop / Tablet) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#1E1915]/70">
          <button
            onClick={() => onTabChange('feed')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all ${
              currentTab === 'feed'
                ? 'border-[#1E1915] text-[#1E1915] font-semibold'
                : 'border-transparent hover:text-[#1E1915]'
            }`}
          >
            Journal
          </button>
          <button
            onClick={() => onTabChange('reminders')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all flex items-center gap-1.5 ${
              currentTab === 'reminders'
                ? 'border-[#1E1915] text-[#1E1915] font-semibold'
                : 'border-transparent hover:text-[#1E1915]'
            }`}
          >
            <span>Radar</span>
            {activeRemindersCount > 0 && (
              <span className="font-mono text-xs px-1.5 py-0.2 bg-[#C05621] text-white rounded-full font-bold">
                {activeRemindersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange('vault')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all ${
              currentTab === 'vault'
                ? 'border-[#1E1915] text-[#1E1915] font-semibold'
                : 'border-transparent hover:text-[#1E1915]'
            }`}
          >
            Vault & Shelf
          </button>
          <button
            onClick={() => onTabChange('milestones')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all flex items-center gap-1.5 ${
              currentTab === 'milestones'
                ? 'border-[#1E1915] text-[#1E1915] font-semibold'
                : 'border-transparent hover:text-[#1E1915]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Memories</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="whitespace-nowrap pb-0.5 border-b-2 border-transparent hover:text-[#1E1915] transition-all flex items-center gap-1.5 hover:border-[#1E1915]/30 text-[#1E1915]/70"
            title="Settings & Backup"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Zone 3: Action Buttons at Top (Filter, Inspire, Add) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Search & Filter Button */}
          {currentTab === 'feed' && (
            <button
              onClick={onToggleFilter}
              title="Search & Filters"
              aria-label="Search & Filters"
              className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border transition-all ${
                isFilterOpen || hasActiveFilters
                  ? 'bg-[#1E1915] text-white border-[#1E1915]'
                  : 'bg-white border-[#1E1915]/15 text-[#1E1915]/75 hover:bg-[#FAF7F2] hover:border-[#1E1915]/30'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#C05621] -mr-1" />
              )}
            </button>
          )}

          {/* Serendipity Inspire Roll Button */}
          <button
            onClick={onOpenSerendipity}
            title="Roll for today's bucket inspiration"
            aria-label="Roll for today's bucket inspiration"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-white border border-[#1E1915]/15 text-[#1E1915]/80 hover:bg-[#FAF7F2] hover:border-[#1E1915]/30 transition-all"
          >
            <Dices className="w-4 h-4 text-[#B45309]" />
          </button>

          {/* New Intention / Capture Button */}
          <button
            onClick={onOpenCreate}
            title="New Intention"
            aria-label="New Intention"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center bg-[#1E1915] text-[#FAF7F2] rounded-lg shadow-sm hover:bg-[#332b24] active:scale-95 transition-all focus-visible:outline-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Desktop Mobile Frame Preview Toggle */}
          <button
            onClick={onToggleMobileFrame}
            title={isMobileFrame ? 'Expand to desktop spread' : 'View in mobile phone frame'}
            className="hidden lg:flex items-center justify-center min-h-[38px] min-w-[38px] rounded-lg border border-[#1E1915]/15 text-[#1E1915]/70 hover:text-[#1E1915] hover:bg-black/5 transition-colors"
          >
            {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
