import React, { useState, useEffect } from 'react';
import { Menu, Shield, Clock, ExternalLink, RefreshCw, ChevronRight, Bell, Sun, Moon, Palette } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MaximizeButton } from '../common/MaximizeButton';

interface AdminHeaderProps {
  currentTabTitle: string;
  onOpenMobileMenu: () => void;
  onRefreshAll?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTabTitle,
  onOpenMobileMenu,
  onRefreshAll,
}) => {
  const { admin } = useAdminAuth();
  const { openThemePicker, activeThemeOption } = useTheme();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left Breadcrumbs (Top Bar Contract Zone 1 & 2) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Editorial Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">MS Official</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-400 font-medium">Admin Console</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-white font-bold tracking-tight">{currentTabTitle}</span>
        </div>
      </div>

      {/* Right Controls (Top Bar Contract Zone 3) */}
      <div className="flex items-center gap-3">
        {/* Real-time Server Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>PKT: {currentTime}</span>
        </div>

        {/* Theme Picker Suite Button */}
        <button
          onClick={openThemePicker}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer flex items-center justify-center text-xs relative group"
          title={`Visual Theme: ${activeThemeOption.name} (Click to choose theme)`}
          aria-label="Choose Theme"
        >
          <Palette className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span
            className="w-2 h-2 rounded-full absolute top-1 right-1 border border-slate-950"
            style={{ backgroundColor: activeThemeOption.accentColor }}
          />
        </button>

        {/* Maximize Full Adjust Screen Button */}
        <MaximizeButton variant="header" />

        {/* Refresh Trigger */}
        {onRefreshAll && (
          <button
            onClick={onRefreshAll}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Refresh All Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Link to public app (Open in new window for verification) */}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 transition-colors"
          title="Open Public User Application in New Tab"
        >
          <span>User Portal</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        {/* Admin Avatar Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-xs font-mono">
            SU
          </div>
          <div className="hidden xl:block text-left leading-tight">
            <div className="text-xs font-bold text-white">{admin?.name || 'Administrator'}</div>
            <div className="text-[10px] text-slate-500 font-mono">Superadmin Role</div>
          </div>
        </div>
      </div>
    </header>
  );
};
