import React from 'react';
import { Compass, Bell, BookMarked, Film, Settings } from 'lucide-react';
import { ViewTab } from '../types';

interface BottomTabBarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  activeRemindersCount: number;
  onOpenSettings: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onTabChange,
  activeRemindersCount,
  onOpenSettings,
}) => {
  const tabs = [
    { id: 'feed' as ViewTab, label: 'Journal', icon: Compass },
    { id: 'reminders' as ViewTab, label: 'Radar', icon: Bell, badge: activeRemindersCount },
    { id: 'vault' as ViewTab, label: 'Vault', icon: BookMarked },
    { id: 'milestones' as ViewTab, label: 'Memories', icon: Film },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#1E1915]/10 pb-safe md:hidden shadow-lg shadow-black/5">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center relative transition-colors focus-visible:outline-none"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-[#1E1915] scale-110 stroke-[2.2]' : 'text-[#1E1915]/50'
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 font-mono text-[10px] w-4 h-4 bg-[#C05621] text-white rounded-full flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[11px] font-medium tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-[#1E1915] font-semibold' : 'text-[#1E1915]/50'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#1E1915]" />
              )}
            </button>
          );
        })}

        {/* Settings button next to Memories */}
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center relative transition-colors focus-visible:outline-none text-[#1E1915]/50 hover:text-[#1E1915]"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-tight mt-1">
            Settings
          </span>
        </button>
      </div>
    </nav>
  );
};

