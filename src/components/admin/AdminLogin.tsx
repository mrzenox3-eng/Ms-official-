import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight, AlertCircle, Palette, Shield } from 'lucide-react';
import appIcon from '../../assets/images/ms_official_icon_new_1791275507280.jpg';

export const AdminLogin: React.FC = () => {
  const { login } = useAdminAuth();
  const { openThemePicker, activeThemeOption } = useTheme();

  // State initialized clean for authentic entry
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [enable2FA, setEnable2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim();

    // Validate email format
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Invalid administrator credentials.');
      return;
    }

    // Validate password
    if (!password) {
      setError('Invalid administrator credentials.');
      return;
    }

    // Validate 2FA code when 2FA is enabled
    if (enable2FA) {
      const trimmedCode = twoFactorCode.trim();
      if (!trimmedCode || !/^\d{6}$/.test(trimmedCode)) {
        setError('Invalid or expired authentication code.');
        return;
      }
    }

    setIsLoading(true);
    try {
      await login({
        email: trimmedEmail,
        password,
        twoFactorCode: enable2FA ? twoFactorCode.trim() : undefined,
        enable2FA,
      });
    } catch (err: any) {
      // Backend validates format, password hash, status, 2FA code, and rate limits
      const msg = err.message || 'Invalid administrator credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('admin123456');
    if (enable2FA) {
      setTwoFactorCode('123456');
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-red-500/30 selection:text-red-200 relative">
      {/* Theme Picker Suite Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={openThemePicker}
          className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer shadow-lg flex items-center justify-center text-xs relative group"
          title={`Visual Theme: ${activeThemeOption.name} (Click to change)`}
          aria-label="Choose Theme"
        >
          <Palette className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span
            className="w-2 h-2 rounded-full absolute top-1.5 right-1.5 border border-slate-950"
            style={{ backgroundColor: activeThemeOption.accentColor }}
          />
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 mb-3 shadow-md">
            <img
              src={appIcon}
              alt="MS Official"
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-lg object-cover"
            />
            <span className="text-xs font-bold text-white tracking-wide">MS Official</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">MS Official Backend</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Authorized Management & Administration Console</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* Card Heading */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-bold text-white tracking-tight">Secure Internal Login</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">v3.8 Production</span>
          </div>

          {/* Validation / Rate Limit Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: Admin Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter Gmail"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono transition-colors"
                />
              </div>
            </div>

            {/* Field 2: Admin Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono transition-colors"
                />
              </div>
            </div>

            {/* Field 3: Two-Factor Authentication Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Two-Factor Authentication Code
                </label>
                {enable2FA && (
                  <span className="text-[10px] text-amber-400 font-semibold tracking-tight">Required for 2FA</span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => {
                    setTwoFactorCode(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter 6-digit code"
                  disabled={!enable2FA}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none font-mono transition-colors ${
                    enable2FA
                      ? 'border-slate-800 focus:border-red-500 opacity-100'
                      : 'border-slate-800/60 opacity-40 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* Security Option Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={enable2FA}
                  onChange={(e) => {
                    setEnable2FA(e.target.checked);
                    if (!e.target.checked) setTwoFactorCode('');
                    if (error) setError(null);
                  }}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-red-600 focus:ring-0 cursor-pointer"
                />
                <span className="font-semibold group-hover:text-white transition-colors">Enable 2FA Step</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{isLoading ? 'VERIFYING CREDENTIALS...' : 'ACCESS ADMIN CONSOLE →'}</span>
            </button>
          </form>

          {/* Additional Security Information */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audit Protected</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Shield className="w-3.5 h-3.5 text-red-400" />
              <span>Secure Administrator Access</span>
            </div>
          </div>

          {/* Quick Demo Assist for Testing */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
            <span className="text-[10px] text-slate-500 block mb-1.5">Quick fill test credentials:</span>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin@msofficial.com')}
                className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[10px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                admin@msofficial.com
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin@gmail.com')}
                className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[10px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                admin@gmail.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
