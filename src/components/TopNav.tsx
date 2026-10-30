import React from 'react';
import { Smartphone, Monitor, Dices, Plus, Film, Settings, Hourglass, Search, X } from 'lucide-react';
import { ViewTab } from '../types';
import { SearchBar } from './SearchBar';

// Serendipity roll is parked; flip to bring the dice button back
const SHOW_SERENDIPITY = false;

interface TopNavProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  activeRemindersCount: number;
  isMobileFrame: boolean;
  showMobileFrameToggle: boolean;
  onToggleMobileFrame: () => void;
  onOpenCreate: () => void;
  onOpenSerendipity: () => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onTabChange,
  activeRemindersCount,
  isMobileFrame,
  showMobileFrameToggle,
  onToggleMobileFrame,
  onOpenCreate,
  onOpenSerendipity,
  isSearchOpen,
  onToggleSearch,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header
      className="sticky top-0 z-40 bg-page/95 backdrop-blur-md border-b border-ink/25 px-4 sm:px-6 py-2.5 transition-colors"
      style={{ paddingTop: 'calc(0.625rem + env(safe-area-inset-top))' }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Brand Wordmark with Marcellus editorial typography & slogan */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('inprogress')}
            className="text-left group focus-visible:outline-none flex flex-col justify-center"
          >
            <span className="font-serif-journal text-xl sm:text-2xl font-semibold tracking-tight text-ink group-hover:text-[#B45309] transition-colors leading-tight">
              My Verge
            </span>
            <span className="text-[10px] sm:text-[11px] font-sans tracking-tight text-ink/55 leading-tight mt-0.5">
              Standing on the threshold of experience
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation text links (Desktop / Tablet) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink/70">
          <button
            onClick={() => onTabChange('inprogress')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all flex items-center gap-1.5 ${
              currentTab === 'inprogress'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent hover:text-ink'
            }`}
          >
            <Hourglass className="w-3.5 h-3.5" />
            <span>Now</span>
          </button>
          <button
            onClick={() => onTabChange('feed')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all ${
              currentTab === 'feed'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent hover:text-ink'
            }`}
          >
            Journal
          </button>
          <button
            onClick={() => onTabChange('reminders')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all flex items-center gap-1.5 ${
              currentTab === 'reminders'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent hover:text-ink'
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
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent hover:text-ink'
            }`}
          >
            Vault & Shelf
          </button>
          <button
            onClick={() => onTabChange('milestones')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all flex items-center gap-1.5 ${
              currentTab === 'milestones'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent hover:text-ink'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Memories</span>
          </button>
          <button
            onClick={() => onTabChange('settings')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all flex items-center gap-1.5 ${
              currentTab === 'settings'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent hover:text-ink'
            }`}
            title="Settings & Backup"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Zone 3: Action Buttons at Top (Search, Add). On phones Search and Add live in the bottom dock */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Global Search Toggle */}
          <button
            onClick={onToggleSearch}
            title={isSearchOpen ? 'Close search' : 'Search'}
            aria-label={isSearchOpen ? 'Close search' : 'Search'}
            aria-pressed={isSearchOpen}
            className={`hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-all ${
              isSearchOpen
                ? 'bg-paper border-ink/40 text-ink'
                : 'bg-card border-ink/15 text-ink/80 hover:bg-paper hover:border-ink/30'
            }`}
          >
            {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Serendipity Inspire Roll Button (hidden for now) */}
          {SHOW_SERENDIPITY && (
            <button
              onClick={onOpenSerendipity}
              title="Roll for today's bucket inspiration"
              aria-label="Roll for today's bucket inspiration"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-card border border-ink/15 text-ink/80 hover:bg-paper hover:border-ink/30 transition-all"
            >
              <Dices className="w-4 h-4 text-[#B45309]" />
            </button>
          )}

          {/* New Intention / Capture Button */}
          <button
            onClick={onOpenCreate}
            title="New Intention"
            aria-label="New Intention"
            className="hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center bg-ink text-paper rounded-lg shadow-sm hover:bg-ink/85 active:scale-95 transition-all focus-visible:outline-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Desktop Mobile Frame Preview Toggle (web only; pointless inside the native app) */}
          {showMobileFrameToggle && (
            <button
              onClick={onToggleMobileFrame}
              title={isMobileFrame ? 'Expand to desktop spread' : 'View in mobile phone frame'}
              className="hidden lg:flex items-center justify-center min-h-[38px] min-w-[38px] rounded-lg border border-ink/15 text-ink/70 hover:text-ink hover:bg-ink/5 transition-colors"
            >
              {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {isSearchOpen && (
        <SearchBar value={searchQuery} onChange={onSearchChange} onClose={onToggleSearch} />
      )}
    </header>
  );
};
