import React, { useState, useEffect } from 'react';
import { UserHeader } from './UserHeader';
import { UserBottomNav, UserTab } from './UserBottomNav';
import { DailyAttendanceCard } from './DailyAttendanceCard';
import { LivePackageCard } from './LivePackageCard';
import { PackageSection } from './PackageSection';
import { InvitePage } from './InvitePage';
import { WalletPage } from './WalletPage';
import { DedicatedSupportPortal } from './DedicatedSupportPortal';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useScreen } from '../../context/ScreenContext';
import { api } from '../../api/client';

export const UserApp: React.FC = () => {
  const { activePackage } = useAuth();
  const { isMaximizedLayout } = useScreen();
  const [activeTab, setActiveTab] = useState<UserTab>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'home' || tabParam === 'attendance') return 'home';
    if (tabParam === 'packages') return 'packages';
    if (tabParam === 'invite') return 'invite';
    if (tabParam === 'wallet') return 'wallet';
    if (tabParam === 'support') return 'support';
    return 'home';
  });
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  // Poll for unread support count to display badge on mobile bottom nav button
  useEffect(() => {
    const checkUnread = async () => {
      try {
        const msgs = await api.getSupportMessages();
        const unread = msgs.filter((m) => m.sender === 'admin' && m.status === 'unread').length;
        setUnreadSupportCount(unread);
      } catch {
        // ignore
      }
    };
    checkUnread();
    const interval = setInterval(checkUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-28 selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden w-full">
      {/* User Header (hidden on dedicated full support tab to avoid duplicate bars) */}
      {activeTab !== 'support' && (
        <UserHeader
          onOpenCustomerService={() => setActiveTab('support')}
          unreadSupportCount={unreadSupportCount}
        />
      )}

      {/* Main Content Area — dynamically expands and full-adjusts on screen */}
      <main
        className={`flex-1 w-full mx-auto transition-all duration-300 ${
          activeTab === 'support'
            ? isMaximizedLayout
              ? 'max-w-6xl p-0 sm:p-4'
              : 'max-w-4xl p-0 sm:p-2'
            : isMaximizedLayout
            ? 'max-w-4xl px-3.5 py-4 sm:px-6 sm:py-6'
            : 'max-w-lg px-3.5 py-4 sm:px-5 sm:py-6'
        }`}
      >
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Daily Attendance Card */}
            <DailyAttendanceCard />

            {/* Live Package Status Card */}
            <LivePackageCard />

            {/* Quick Mobile Shortcut to Packages */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-lg">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Subscription Packages
                </span>
                <p className="text-[11px] text-slate-400">
                  Weekly (Rs. 500) & Monthly (Rs. 1,000) earning tiers
                </p>
              </div>
              <button
                onClick={() => setActiveTab('packages')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
              >
                <span>View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PACKAGES */}
        {activeTab === 'packages' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <PackageSection onOpenPage2={() => setActiveTab('invite')} />
          </div>
        )}

        {/* TAB 3: INVITE */}
        {activeTab === 'invite' && (
          <div className="animate-in fade-in duration-200">
            <InvitePage />
          </div>
        )}

        {/* TAB 4: WALLET */}
        {activeTab === 'wallet' && (
          <div className="animate-in fade-in duration-200">
            <WalletPage />
          </div>
        )}

        {/* TAB 5: SUPPORT */}
        {activeTab === 'support' && (
          <div className="animate-in fade-in duration-200">
            <DedicatedSupportPortal onBackToApp={() => setActiveTab('home')} />
          </div>
        )}
      </main>

      {/* 5-Button Bottom Mobile Navigation Bar (Home, Packages, Invite, Wallet, Support) */}
      <UserBottomNav
        currentTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unreadSupportCount={unreadSupportCount}
      />
    </div>
  );
};
