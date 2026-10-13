import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Calendar, Share2, Award, AlertCircle } from 'lucide-react';

export const LivePackageCard: React.FC = () => {
  const { activePackage, dailyUsage } = useAuth();

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '--/--/----';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  if (!activePackage) {
    return (
      <div className="bg-slate-900/80 border border-dashed border-slate-800 rounded-3xl p-5 text-center">
        <div className="w-10 h-10 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400 mb-2">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">No Active Package</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto mb-3">
          Choose a weekly or monthly package below to unlock check-in rewards, higher daily invite limits, and referral bonuses.
        </p>
      </div>
    );
  }

  const isMonthly = activePackage.packageId === 'monthly';
  const dailyInviteLimit = isMonthly ? 10 : 5;
  const bonus = isMonthly ? '20%' : '10%';

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Current Plan</span>
            <h3 className="text-base font-bold text-white tracking-tight">{activePackage.packageName}</h3>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80">
        <div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-semibold mb-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>Start Date</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-200 font-mono">
            {formatDate(activePackage.startDate)}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-semibold mb-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>Expiry Date</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
            {formatDate(activePackage.expiryDate)}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-semibold mb-1">
            <Share2 className="w-3 h-3 text-slate-500" />
            <span>Daily Invites</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-200 font-mono">
            {dailyUsage ? `${dailyUsage.invitesUsed} / ${dailyInviteLimit}` : dailyInviteLimit}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-semibold mb-1">
            <Award className="w-3 h-3 text-slate-500" />
            <span>Bonus</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-amber-400 font-mono">{bonus}</div>
        </div>
      </div>
    </div>
  );
};
