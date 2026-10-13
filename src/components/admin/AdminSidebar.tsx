import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  Image,
  Wallet,
  Headphones,
  ArrowDownToLine,
  CreditCard,
  Sliders,
  FileText,
  Link2,
  LogOut,
  ShieldAlert,
  ChevronRight,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../context/ThemeContext';
import appIcon from '../../assets/images/ms_official_icon_new_1791275507280.jpg';

export type AdminTab =
  | 'dashboard'
  | 'users'
  | 'packages'
  | 'screenshots'
  | 'balances'
  | 'support'
  | 'withdrawals'
  | 'payment_settings'
  | 'package_settings'
  | 'audit_logs'
  | 'deployment_links';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingCounts?: {
    payments?: number;
    withdrawals?: number;
    support?: number;
    screenshots?: number;
  };
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  pendingCounts = {},
}) => {
  const { logout, admin } = useAdminAuth();
  const { openThemePicker, activeThemeOption } = useTheme();

  const navSections = [
    {
      group: 'Overview & Users',
      items: [
        { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users' as AdminTab, label: 'User Directory', icon: Users },
      ],
    },
    {
      group: 'Subscriptions & Proofs',
      items: [
        {
          id: 'packages' as AdminTab,
          label: 'Package Management',
          icon: Package,
          badge: pendingCounts.payments,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'screenshots' as AdminTab,
          label: 'Invite Proofs Chat',
          icon: Image,
          badge: pendingCounts.screenshots,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        },
      ],
    },
    {
      group: 'Finance & Payouts',
      items: [
        { id: 'balances' as AdminTab, label: 'Ledger Balances', icon: Wallet },
        {
          id: 'withdrawals' as AdminTab,
          label: 'Withdrawal Orders',
          icon: ArrowDownToLine,
          badge: pendingCounts.withdrawals,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        },
      ],
    },
    {
      group: 'Communication',
      items: [
        {
          id: 'support' as AdminTab,
          label: 'Live Helpdesk',
          icon: Headphones,
          badge: pendingCounts.support,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
      ],
    },
    {
      group: 'System & Security',
      items: [
        { id: 'payment_settings' as AdminTab, label: 'Payment Settings', icon: CreditCard },
        { id: 'package_settings' as AdminTab, label: 'Package Rules', icon: Sliders },
        { id: 'audit_logs' as AdminTab, label: 'Audit Trail', icon: FileText },
        { id: 'deployment_links' as AdminTab, label: 'Links with Domain', icon: Link2 },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 w-72 h-screen bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 shrink-0 select-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-red-500/40 shadow-lg shadow-red-950/50 shrink-0 bg-slate-900">
                <img src={appIcon} alt="MS" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight font-sans">MS Official</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[10px] text-red-400 font-mono font-bold uppercase tracking-wider">
                    Backend Core
                  </span>
                </div>
              </div>
            </div>

            <span className="hidden xl:inline-block text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              v2.4
            </span>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  {section.group}
                </span>

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-red-500/10 text-white font-semibold border border-red-500/30 shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {Boolean(item.badge && item.badge > 0) && (
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold border ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Admin Footer Profile & Logout */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60">
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-center justify-between mb-2">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-white truncate">{admin?.name || 'Administrator'}</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">{admin?.email}</div>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-red-950 text-red-300 border border-red-800/60">
              ROOT
            </span>
          </div>

          {/* Quick Theme Switcher */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/90 mb-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                style={{ backgroundColor: activeThemeOption.accentColor }}
              />
              <span className="text-[11px] text-slate-300 font-medium truncate">
                {activeThemeOption.name.split(' ')[0]}
              </span>
            </div>
            <button
              onClick={openThemePicker}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white flex items-center gap-1 cursor-pointer text-[10px] font-bold transition-all shadow-sm shrink-0"
              title="Open Theme Palette Suite"
            >
              <Palette className="w-3 h-3 text-emerald-400" />
              <span>Theme</span>
            </button>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/50 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Admin Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
