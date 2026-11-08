import React from 'react';
import { Smartphone, Monitor, Dices, Film, Settings, Zap } from 'lucide-react';
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
  onOpenSerendipity: () => void;
  isSearchOpen: boolean;
  onCloseSearch: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onTabChange,
  activeRemindersCount,
  isMobileFrame,
  showMobileFrameToggle,
  onToggleMobileFrame,
  onOpenSerendipity,
  isSearchOpen,
  onCloseSearch,
  searchQuery,
  onSearchChange,
  isSettingsOpen,
  onToggleSettings,
}) => {
  return (
    <header
      className="sticky top-0 z-40 bg-page/95 backdrop-blur-md border-b border-ink/25 px-4 sm:px-6 py-2.5 transition-colors"
      style={{ paddingTop: 'calc(0.625rem + env(safe-area-inset-top))' }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: brand mark, wordmark and tagline */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('feed')}
            className="text-left group focus-visible:outline-none flex items-center gap-2.5"
          >
            {/* Wishcrumbs mark: four crumbs growing along a trail; source in assets/brand/render.mjs */}
            <svg viewBox="0 0 100 100" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" aria-hidden="true">
              <circle cx="14" cy="84" r="8" className="fill-ink" />
              <circle cx="34" cy="70" r="10.5" className="fill-ink" />
              <circle cx="60" cy="56" r="13" className="fill-ink" />
              <circle cx="78" cy="25" r="16.5" className="fill-[#D98F6B]" />
            </svg>
            <span className="flex flex-col justify-center">
              <span className="font-serif-journal text-xl sm:text-2xl font-bold tracking-tight text-ink group-hover:text-accent transition-colors leading-tight">
                wishcrumbs
              </span>
              <span className="text-[10px] sm:text-[11px] font-sans tracking-tight text-ink/55 leading-tight mt-0.5">
                Your life, piece by piece
              </span>
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation text links (Desktop / Tablet) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink/70">
          <button
            onClick={() => onTabChange('feed')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all ${
              currentTab === 'feed'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent hover:text-ink'
            }`}
          >
            Plans
          </button>
          <button
            onClick={() => onTabChange('reminders')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all flex items-center gap-1.5 ${
              currentTab === 'reminders'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent hover:text-ink'
            }`}
          >
            <span>Horizon</span>
            {activeRemindersCount > 0 && (
              <span className="font-mono text-xs px-1.5 py-0.2 bg-[#C05621] text-white rounded-full font-bold">
                {activeRemindersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange('inprogress')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all flex items-center gap-1.5 ${
              currentTab === 'inprogress'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent hover:text-ink'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Now</span>
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
            <span>Moments</span>
          </button>
          <button
            onClick={() => onTabChange('vault')}
            className={`whitespace-nowrap pb-0.5 border-b-2 transition-all ${
              currentTab === 'vault'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent hover:text-ink'
            }`}
          >
            Vault
          </button>
        </nav>

        {/* Zone 3: extra actions. Search and New float at the bottom-right (FloatingActions) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Serendipity Inspire Roll Button (hidden for now) */}
          {SHOW_SERENDIPITY && (
            <button
              onClick={onOpenSerendipity}
              title="Pick a plan for today"
              aria-label="Pick a plan for today"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-card border border-ink/15 text-ink/80 hover:bg-paper hover:border-ink/30 transition-all"
            >
              <Dices className="w-4 h-4 text-accent" />
            </button>
          )}

          {/* Desktop Mobile Frame Preview Toggle (web only; pointless inside the native app) */}
          {showMobileFrameToggle && (
            <button
              onClick={onToggleMobileFrame}
              title={isMobileFrame ? 'Desktop view' : 'Phone view'}
              className="hidden lg:flex items-center justify-center min-h-[38px] min-w-[38px] rounded-lg border border-ink/15 text-ink/70 hover:text-ink hover:bg-ink/5 transition-colors"
            >
              {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>
          )}

          {/* Toggles the Settings sheet, on every width; it isn't on the dock */}
          <button
            type="button"
            onClick={onToggleSettings}
            title="Settings"
            aria-label="Settings"
            aria-expanded={isSettingsOpen}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
              isSettingsOpen ? 'text-ink bg-ink/10' : 'text-ink/70 hover:text-ink hover:bg-ink/5'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <SearchBar value={searchQuery} onChange={onSearchChange} onClose={onCloseSearch} />
      )}
    </header>
  );
};
