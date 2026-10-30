import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Compass, Bell, Hourglass, BookMarked, Film, Settings, Plus, Search, X } from 'lucide-react';
import { ViewTab } from '../types';

interface BottomTabBarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  activeRemindersCount: number;
  onOpenCreate: () => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
}

// Fan geometry: items sit on a semicircle around the hub's center
const FAN_RADIUS = 112;
const FAN_START_DEG = 160;
const FAN_END_DEG = 20;

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onTabChange,
  activeRemindersCount,
  onOpenCreate,
  isSearchOpen,
  onToggleSearch,
}) => {
  const [isFanOpen, setIsFanOpen] = useState(false);

  const tabs = [
    { id: 'feed' as ViewTab, label: 'Journal', icon: Compass },
    { id: 'reminders' as ViewTab, label: 'Radar', icon: Bell, badge: activeRemindersCount },
    { id: 'inprogress' as ViewTab, label: 'Now', icon: Hourglass },
    { id: 'vault' as ViewTab, label: 'Vault', icon: BookMarked },
    { id: 'milestones' as ViewTab, label: 'Memories', icon: Film },
    { id: 'settings' as ViewTab, label: 'Settings', icon: Settings },
  ];

  // The hub shows the selected tab; the fan offers the other five
  const current = tabs.find((t) => t.id === currentTab) ?? tabs[2];
  const CurrentIcon = current.icon;
  const fanTabs = tabs.filter((t) => t.id !== current.id);

  // Close the fan whenever the tab changes (from here or elsewhere)
  useEffect(() => {
    setIsFanOpen(false);
  }, [currentTab]);

  useEffect(() => {
    if (!isFanOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFanOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFanOpen]);

  const handleSelect = (tab: ViewTab) => {
    setIsFanOpen(false);
    onTabChange(tab);
  };

  const badge = (count: number, className: string) =>
    count > 0 ? (
      <span
        className={`absolute font-mono text-[10px] min-w-4 h-4 px-1 bg-[#C05621] text-white rounded-full flex items-center justify-center font-bold ${className}`}
      >
        {count}
      </span>
    ) : null;

  return (
    <>
      {/* Scrim: rendered outside the nav because its backdrop-blur would trap fixed children */}
      <AnimatePresence>
        {isFanOpen && (
          <motion.div
            key="fan-scrim"
            aria-hidden
            onClick={() => setIsFanOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Radial fan, anchored at the hub's center (dock is h-16, so center sits 32px above the safe area) */}
      <div
        className="fixed left-1/2 z-50 w-0 h-0 md:hidden"
        style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        <AnimatePresence>
          {isFanOpen &&
            fanTabs.map((tab, i) => {
              const Icon = tab.icon;
              const deg =
                FAN_START_DEG - ((FAN_START_DEG - FAN_END_DEG) / (fanTabs.length - 1)) * i;
              const rad = (deg * Math.PI) / 180;
              const x = Math.cos(rad) * FAN_RADIUS;
              const y = -Math.sin(rad) * FAN_RADIUS;
              return (
                <motion.div
                  key={tab.id}
                  className="absolute -left-6 -top-6 w-12 h-12"
                  initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
                  animate={{ x, y, scale: 1, opacity: 1 }}
                  exit={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28, delay: i * 0.03 }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(tab.id)}
                    aria-label={tab.label}
                    className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-md bg-card border border-ink/15 text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                  >
                    <Icon className="w-5 h-5" />
                    {tab.badge ? badge(tab.badge, '-top-1 -right-1') : null}
                  </button>
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-[11px] font-semibold tracking-tight text-ink whitespace-nowrap px-1.5 rounded bg-page/90">
                    {tab.label}
                  </span>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Dock */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-page/95 backdrop-blur-md border-t border-ink/25 md:hidden shadow-lg shadow-black/5"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="relative h-16 max-w-lg mx-auto flex items-center justify-center gap-8">
          {/* New Intention: tucked away while the fan is open so it can't collide with fan items */}
          <button
            type="button"
            onClick={onOpenCreate}
            aria-label="New Intention"
            disabled={isFanOpen}
            className={`w-11 h-11 rounded-full flex items-center justify-center bg-card border border-ink/15 text-ink shadow-sm transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
              isFanOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Hub: shows the selected tab, tap to fan out the others */}
          <button
            type="button"
            onClick={() => setIsFanOpen((open) => !open)}
            aria-label={`${current.label}. Tap to switch section`}
            aria-expanded={isFanOpen}
            className="relative w-14 h-14 rounded-full flex flex-col items-center justify-center bg-ink text-paper shadow-lg shadow-black/20 ring-4 ring-ink/10 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-ink/40"
          >
            <CurrentIcon className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-semibold tracking-tight leading-none mt-0.5">
              {current.label}
            </span>
            {!isFanOpen && badge(activeRemindersCount, '-top-0.5 -right-0.5')}
          </button>

          {/* Global Search toggle: opens the search row under the top nav */}
          <button
            type="button"
            onClick={onToggleSearch}
            aria-label={isSearchOpen ? 'Close search' : 'Search'}
            aria-pressed={isSearchOpen}
            disabled={isFanOpen}
            className={`w-11 h-11 rounded-full flex items-center justify-center border shadow-sm transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
              isSearchOpen ? 'bg-paper border-ink/40 text-ink' : 'bg-card border-ink/15 text-ink'
            } ${isFanOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
        </div>
      </nav>
    </>
  );
};
