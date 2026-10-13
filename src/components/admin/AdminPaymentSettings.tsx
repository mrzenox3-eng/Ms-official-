import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { PaymentSettings } from '../../types';
import { CheckCircle2, AlertCircle, Save, QrCode, Upload } from 'lucide-react';

export const AdminPaymentSettings: React.FC = () => {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getAdminPaymentSettings()
      .then((s) => setSettings(s))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      await api.updateAdminPaymentSettings(settings);
      setFeedback('Payment configuration updated successfully.');
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = (method: 'jazzCash' | 'easypaisa', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings({
        ...settings,
        [method]: {
          ...settings[method],
          qrCode: reader.result as string,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading payment gateway credentials...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Gateway Accounts</span>
        <h2 className="text-xl font-bold text-white tracking-tight">Payment Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure JazzCash and Easypaisa accounts, numbers, QR images, and user payment instructions without modifying source code.
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
          {/* JazzCash Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <h3 className="text-sm font-bold text-white">JazzCash Official Account</h3>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Account Title / Name
              </label>
              <input
                type="text"
                required
                value={settings.jazzCash.accountName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    jazzCash: { ...settings.jazzCash, accountName: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Account / Phone Number
              </label>
              <input
                type="text"
                required
                value={settings.jazzCash.accountNumber}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    jazzCash: { ...settings.jazzCash, accountNumber: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Payment Instructions for Members
              </label>
              <textarea
                rows={3}
                value={settings.jazzCash.instructions}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    jazzCash: { ...settings.jazzCash, instructions: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                QR Code Image
              </label>
              <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <img
                  src={settings.jazzCash.qrCode}
                  alt="JazzCash QR"
                  className="w-16 h-16 rounded-xl object-contain bg-black border border-slate-700"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleQrUpload('jazzCash', e)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-red-400" />
                    <span>Upload New QR</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Easypaisa Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-white">Easypaisa Official Account</h3>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Account Title / Name
              </label>
              <input
                type="text"
                required
                value={settings.easypaisa.accountName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    easypaisa: { ...settings.easypaisa, accountName: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Account / Phone Number
              </label>
              <input
                type="text"
                required
                value={settings.easypaisa.accountNumber}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    easypaisa: { ...settings.easypaisa, accountNumber: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Payment Instructions for Members
              </label>
              <textarea
                rows={3}
                value={settings.easypaisa.instructions}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    easypaisa: { ...settings.easypaisa, instructions: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                QR Code Image
              </label>
              <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <img
                  src={settings.easypaisa.qrCode}
                  alt="Easypaisa QR"
                  className="w-16 h-16 rounded-xl object-contain bg-black border border-slate-700"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleQrUpload('easypaisa', e)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload New QR</span>
                  </button>
                </div>
              </div>
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
            <span>{saving ? 'Saving Changes...' : 'Save Payment Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
