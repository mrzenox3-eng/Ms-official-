import React from 'react';
import { Home, Package, UserPlus, Wallet, Headphones } from 'lucide-react';

export type UserTab = 'home' | 'packages' | 'invite' | 'wallet' | 'support';

interface UserBottomNavProps {
  currentTab: UserTab;
  onTabChange: (tab: UserTab) => void;
  unreadSupportCount?: number;
}

export const UserBottomNav: React.FC<UserBottomNavProps> = ({
  currentTab,
  onTabChange,
  unreadSupportCount = 0,
}) => {
  const tabs = [
    { id: 'home' as UserTab, label: 'Home', icon: Home },
    { id: 'packages' as UserTab, label: 'Packages', icon: Package },
    { id: 'invite' as UserTab, label: 'Invite', icon: UserPlus },
    { id: 'wallet' as UserTab, label: 'Wallet', icon: Wallet },
    { id: 'support' as UserTab, label: 'Support', icon: Headphones, badge: unreadSupportCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl pb-safe">
      <div className="max-w-xl mx-auto grid grid-cols-5 h-16 items-center px-1 sm:px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center py-1 transition-all group cursor-pointer relative"
              aria-label={tab.label}
            >
              <div
                className={`relative p-1 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10 scale-105'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.8} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-xs shadow-emerald-400/80" />
                )}
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-slate-950">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-semibold tracking-tight mt-0.5 transition-colors truncate max-w-full px-0.5 ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 group-hover:text-slate-200'
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
