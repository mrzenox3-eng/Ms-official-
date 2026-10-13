import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { PackageSettings } from '../../types';
import { CheckCircle2, Save, Sliders, Shield } from 'lucide-react';

export const AdminPackageSettings: React.FC = () => {
  const [settings, setSettings] = useState<PackageSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getAdminPackageSettings()
      .then((s) => setSettings(s))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      await api.updateAdminPackageSettings(settings);
      setFeedback('Package pricing, limits, and bonus parameters updated & logged.');
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update package settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading package configurations...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Plan Rules & Pricing</span>
        <h2 className="text-xl font-bold text-white tracking-tight">Package Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Tune prices, daily invite quotas, daily screenshot upload limits, and referral bonus percentages for Weekly and Monthly packages.
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WEEKLY PLAN CONFIGURATION */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">One Week Package</h3>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">7 Days</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Price in PKR (Rs.)
              </label>
              <input
                type="number"
                required
                min="0"
                value={settings.weekly.price}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weekly: { ...settings.weekly, price: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Daily Invites Limit
              </label>
              <input
                type="number"
                required
                min="1"
                value={settings.weekly.inviteLimit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weekly: { ...settings.weekly, inviteLimit: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Daily Screenshots Limit
              </label>
              <input
                type="number"
                required
                min="1"
                value={settings.weekly.screenshotLimit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weekly: { ...settings.weekly, screenshotLimit: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Referral Bonus Percentage (%)
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={settings.weekly.bonusPercentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weekly: { ...settings.weekly, bonusPercentage: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* MONTHLY PLAN CONFIGURATION */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">One Month Package</h3>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">30 Days</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Price in PKR (Rs.)
              </label>
              <input
                type="number"
                required
                min="0"
                value={settings.monthly.price}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monthly: { ...settings.monthly, price: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Daily Invites Limit
              </label>
              <input
                type="number"
                required
                min="1"
                value={settings.monthly.inviteLimit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monthly: { ...settings.monthly, inviteLimit: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Daily Screenshots Limit
              </label>
              <input
                type="number"
                required
                min="1"
                value={settings.monthly.screenshotLimit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monthly: { ...settings.monthly, screenshotLimit: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Referral Bonus Percentage (%)
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={settings.monthly.bonusPercentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monthly: { ...settings.monthly, bonusPercentage: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="py-3 px-6 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-red-950/50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating Package Rules...' : 'Save Package Rules'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
