import React from 'react';
import { Home, Crosshair, Bell, Sliders } from 'lucide-react';

export type NavTab = 'home' | 'track' | 'activity' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  unreadCount,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'track' as NavTab, label: 'Track', icon: Crosshair },
    { id: 'activity' as NavTab, label: 'Activity', icon: Bell, badge: unreadCount },
    { id: 'settings' as NavTab, label: 'Settings', icon: Sliders },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090B0F]/95 backdrop-blur-lg border-t border-[#252D38] px-4 py-2 safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-all active:scale-95 ${
                isActive ? 'text-[#B7F36B]' : 'text-[#626D7D] hover:text-[#929BAA]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#B7F36B] text-[#090B0F] min-w-4 text-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium mt-1 tracking-tight ${isActive ? 'text-[#F4F6FA]' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-6 h-0.5 rounded-full bg-[#B7F36B]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
