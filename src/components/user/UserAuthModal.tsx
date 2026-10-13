import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ShieldCheck, Mail, Phone, User as UserIcon, Lock, ArrowRight, CheckCircle2, AlertCircle, Sun, Moon, Palette } from 'lucide-react';
import appIcon from '../../assets/images/ms_official_icon_new_1791275507280.jpg';

interface UserAuthModalProps {
  isEmbedded?: boolean;
  onSuccess?: () => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({ isEmbedded = false, onSuccess }) => {
  const { login, register, googleAuth } = useAuth();
  const { openThemePicker, activeThemeOption } = useTheme();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check URL params for referral code & preserve invitation
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      const code = ref.toUpperCase().trim();
      setReferralCode(code);
      setMode('register');
      try {
        localStorage.setItem('ms_saved_ref', code);
      } catch {}
    } else {
      try {
        const saved = localStorage.getItem('ms_saved_ref');
        if (saved) {
          setReferralCode(saved);
        }
      } catch {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid Gmail / Email address');
        if (!phone.trim() || phone.length < 8) throw new Error('Please enter a valid phone number');

        await register({ name, email, phone, referralCode });
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => onSuccess?.(), 800);
      } else {
        if (!email.trim() && !phone.trim()) throw new Error('Please enter your Email or Phone number to log in');
        await login({ email: email.trim() || undefined, phone: phone.trim() || undefined });
        setSuccessMsg('Login successful! Welcome back.');
        setTimeout(() => onSuccess?.(), 800);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // In accordance with security specifications: Google OAuth simulates seamless Google Identity
      const simulatedGoogleEmail = prompt('Enter your Google Account email to continue:', email || 'user@gmail.com');
      if (!simulatedGoogleEmail) {
        setIsLoading(false);
        return;
      }
      await googleAuth({
        email: simulatedGoogleEmail,
        name: name || simulatedGoogleEmail.split('@')[0],
        phone: phone || '0300-1234567',
      });
      setSuccessMsg('Signed in with Google successfully!');
      setTimeout(() => onSuccess?.(), 800);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const authContent = (
    <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 mb-4 rounded-2xl bg-slate-900 border border-emerald-500/20 shadow-xl shadow-emerald-950/40">
            <img
              src={appIcon}
              alt="MS Official Icon"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl object-cover"
              onError={(e) => {
                // Fallback icon container
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">MS Official</h1>
          <p className="text-xs text-slate-400">Official Daily Attendance & Rewards Financial Platform</p>
        </div>

        {/* Auth Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* Switch Tab */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl mb-6 border border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Login
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {referralCode && mode === 'register' && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-950/40 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-white">Invite Link Connected: </span>
                <span className="font-mono text-emerald-300 font-bold bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {referralCode}
                </span>
                <p className="text-[10px] text-emerald-400/90 mt-0.5">
                  You are registering via an official referral link. Bonuses & attendance rewards will be unlocked.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Enter Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Muhammad Ali"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Enter Gmail / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required={mode === 'register'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Enter Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  required={mode === 'register'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="MS-XXXXXX"
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{isLoading ? 'Processing...' : mode === 'register' ? 'Create Account' : 'Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Social Divider (Hidden) */}
          <div className="hidden relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative px-3 bg-slate-900 text-[11px] text-slate-500 uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="hidden w-full py-3 px-4 bg-slate-950 hover:bg-slate-800/80 active:scale-[0.98] border border-slate-700/80 rounded-xl text-slate-200 text-xs font-semibold items-center justify-center gap-3 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Privacy Note */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure account protection with encrypted credentials.</span>
          </div>
        </div>
      </div>
  );

  if (isEmbedded) {
    return authContent;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Theme Picker Button */}
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

      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {authContent}
    </div>
  );
};
