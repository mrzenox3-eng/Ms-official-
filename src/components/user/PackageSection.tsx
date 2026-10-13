import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { PackageOffer } from '../../types';
import { PaymentModal } from './PaymentModal';
import { Check, Zap, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PackageSectionProps {
  onOpenPage2?: () => void;
}

export const PackageSection: React.FC<PackageSectionProps> = ({ onOpenPage2 }) => {
  const { refreshUser } = useAuth();
  const [packages, setPackages] = useState<{ weekly: PackageOffer; monthly: PackageOffer } | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<PackageOffer | null>(null);

  const fetchPackages = async () => {
    try {
      const data = await api.getAvailablePackages();
      setPackages(data);
    } catch (e) {
      console.error('Failed to load packages:', e);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Access Plans</span>
        <h2 className="text-lg font-bold text-white tracking-tight">Choose Your Package</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Upgrade your account to unlock daily attendance rewards and increased referral bonuses.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ONE WEEK PACKAGE CARD */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ONE WEEK PACKAGE</span>
              <div className="p-1.5 rounded-xl bg-slate-800 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            <div className="mb-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                Rs. {packages?.weekly.price.toLocaleString() || '500'}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">/ 7 days</span>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-800/80 mb-6">
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>One-week check-in/check-out access</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>{packages?.weekly.dailyInvites || 5} invite links per day</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>{packages?.weekly.bonus || 10}% invite bonus</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => packages && setSelectedOffer(packages.weekly)}
            className="w-full min-h-[46px] py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wide transition-all border border-slate-700 shadow-md cursor-pointer"
          >
            BUY ONE WEEK
          </button>
        </div>

        {/* ONE MONTH PACKAGE CARD */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden transition-all">
          {/* Popular Tag */}
          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-bl-xl">
            Best Value
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">ONE MONTH PACKAGE</span>
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Crown className="w-4 h-4" />
              </div>
            </div>

            <div className="mb-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                Rs. {packages?.monthly.price.toLocaleString() || '1,000'}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">/ 30 days</span>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-800/80 mb-6">
              <div className="flex items-start gap-2 text-xs text-slate-200">
                <div className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>One-month check-in/check-out access</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-200">
                <div className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>{packages?.monthly.dailyInvites || 10} invite links per day</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-200">
                <div className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>{packages?.monthly.bonus || 20}% invite bonus</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => packages && setSelectedOffer(packages.monthly)}
            className="w-full min-h-[46px] py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-emerald-950/60 cursor-pointer"
          >
            BUY ONE MONTH
          </button>
        </div>
      </div>

      {/* Payment Instruction Modal */}
      {selectedOffer && (
        <PaymentModal
          packageOffer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onSuccess={(openPage2) => {
            fetchPackages();
            refreshUser();
            if (openPage2 && onOpenPage2) {
              onOpenPage2();
            }
          }}
        />
      )}
    </section>
  );
};
