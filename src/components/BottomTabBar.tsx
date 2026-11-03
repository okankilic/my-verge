import React from 'react';
import { Compass, Bell, Hourglass, BookMarked, Film, Settings } from 'lucide-react';
import { ViewTab } from '../types';

interface BottomTabBarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  activeRemindersCount: number;
}

// Phone-only dock listing every tab, with Now in the middle.
// Search and New float above it in FloatingActions.
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onTabChange,
  activeRemindersCount,
}) => {
  const tabs = [
    { id: 'feed' as ViewTab, label: 'Journal', icon: Compass },
    { id: 'reminders' as ViewTab, label: 'Horizon', icon: Bell, badge: activeRemindersCount },
    { id: 'inprogress' as ViewTab, label: 'Now', icon: Hourglass },
    { id: 'milestones' as ViewTab, label: 'Memories', icon: Film },
    { id: 'vault' as ViewTab, label: 'Vault', icon: BookMarked },
    { id: 'settings' as ViewTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-page/95 backdrop-blur-md border-t border-ink/25 md:hidden shadow-lg shadow-black/5"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="h-16 max-w-lg mx-auto grid grid-cols-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === currentTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/40 ${
                isActive ? 'text-ink' : 'text-ink/55'
              }`}
            >
              {/* Active indicator */}
              <span
                aria-hidden
                className={`absolute top-0 h-0.5 w-8 rounded-full bg-accent transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <span className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
                {tab.badge ? (
                  <span className="absolute -top-1.5 -right-2.5 font-mono text-[10px] min-w-4 h-4 px-1 bg-[#C05621] text-white rounded-full flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                ) : null}
              </span>
              <span
                className={`text-[10px] tracking-tight leading-none ${
                  isActive ? 'font-bold' : 'font-semibold'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
