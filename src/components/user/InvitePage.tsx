import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ReferralStats, PackageOffer } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { InviteScreenshotSection } from './InviteScreenshotSection';
import { PaymentModal } from './PaymentModal';
import {
  Copy,
  Check,
  Share2,
  Users,
  Award,
  Clock,
  Send,
  MessageCircle,
  AlertTriangle,
  Sparkles,
  Lock,
  Unlock,
  Zap,
  Crown,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const InvitePage: React.FC = () => {
  const { user, activePackage, refreshUser } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [packages, setPackages] = useState<{ weekly: PackageOffer; monthly: PackageOffer } | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<PackageOffer | null>(null);
  const [isQuickActivating, setIsQuickActivating] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.getReferralStats();
      setStats(data);
    } catch (e: any) {
      console.error('Failed to load referral stats:', e);
    }
  };

  const fetchPackages = async () => {
    try {
      const data = await api.getAvailablePackages();
      setPackages(data);
    } catch (e: any) {
      console.error('Failed to load packages:', e);
    }
  };

const DEV_INVITE_DOMAIN = 'ais-dev-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app';
const DEV_INVITE_URL = `https://${DEV_INVITE_DOMAIN}`;
const PRE_INVITE_DOMAIN = 'ais-pre-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app';

  const [selectedDomain, setSelectedDomain] = useState<'dev' | 'msofficial' | '786msofficial' | 'cloud'>('dev');
  const [baseDomainUrl, setBaseDomainUrl] = useState<string>(() => DEV_INVITE_URL);

  useEffect(() => {
    fetchStats();
    fetchPackages();
    api
      .getPublicDomainLinks()
      .then((d) => {
        if (d?.baseUrl) {
          setBaseDomainUrl(d.baseUrl);
        }
      })
      .catch(() => {});
  }, []);

  const isUnlocked = Boolean(activePackage && activePackage.status === 'active');
  const referralCode = stats?.referralCode || user?.referralCode || 'MS-VIP';
  
  const currentBase =
    selectedDomain === 'dev'
      ? (typeof window !== 'undefined' && window.location.origin.includes('.run.app')
          ? window.location.origin
          : DEV_INVITE_URL)
      : selectedDomain === 'msofficial'
      ? 'https://msofficial.com'
      : selectedDomain === '786msofficial'
      ? 'https://786msofficial.com'
      : (typeof window !== 'undefined' && window.location.origin.includes('ais-pre')
          ? window.location.origin
          : `https://${PRE_INVITE_DOMAIN}`);

  const referralLink = `${currentBase}/?ref=${referralCode}`;

  const handleShareClick = async (channel?: string) => {
    setErrorMsg(null);
    try {
      // Enforce limit server-side!
      await api.trackInviteClick();
      await fetchStats();

      const shareText = `Join MS Official now and start earning daily check-in rewards & referral commissions! Register with my code ${referralCode}: ${referralLink}`;

      if (channel === 'whatsapp') {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
      } else if (channel === 'telegram') {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`,
          '_blank'
        );
      } else if (channel === 'native' && navigator.share) {
        await navigator.share({
          title: 'MS Official Referral Invitation',
          text: shareText,
          url: referralLink,
        });
      } else {
        // Copy to clipboard
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Daily invite limit reached. Try again tomorrow.');
    }
  };

  const copyOnly = async () => {
    setErrorMsg(null);
    try {
      await api.trackInviteClick();
      await fetchStats();
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Daily invite limit reached. Try again tomorrow.');
    }
  };

  // Instant quick unlock for test/demo mode
  const handleQuickUnlock = async (packageId: 'weekly' | 'monthly' = 'monthly') => {
    setIsQuickActivating(true);
    setErrorMsg(null);
    try {
      const res = await api.quickActivatePackage(packageId);
      setSuccessMsg(res.message);
      await refreshUser();
      await fetchStats();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick activation failed');
    } finally {
      setIsQuickActivating(false);
    }
  };

  const isLimitReached = stats ? stats.dailyInvitesUsed >= stats.dailyInviteLimit : false;
  const bonusPct = stats?.bonusPercentage || (activePackage?.packageId === 'monthly' ? 20 : 10);

  // LOCKED STATE: If user has no active package, prompt them to buy a package to unlock
  if (!isUnlocked) {
    return (
      <div className="space-y-6 pb-8">
        {/* Title */}
        <div>
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Restricted Feature</span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Invite Friends</h2>
          <p className="text-xs text-slate-400 mt-1">
            Buy your package to unlock Page 2 (Invite Friends) and start earning referral commissions.
          </p>
        </div>

        {/* Lock Announcement Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-950/50">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            Page Locked — Package Required
          </span>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
            Buy Your Package to Unlock Page Invite
          </h3>

          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed mb-6">
            Page 2 (Invite Friends) requires an active membership. Purchasing a package unlocks your personal invite link, daily quota (up to 10 invites/day), referral bonuses up to 20%, and screenshot verification chat.
          </p>

          {activePackage?.status === 'pending_verification' && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Payment Verification Pending for <strong>{activePackage.packageName}</strong>. Admin verification is in progress.
              </span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Package Selection Cards to Buy & Unlock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg mx-auto mb-6">
            {/* Weekly */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white uppercase">One Week</span>
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-lg font-extrabold text-white font-mono mb-2">Rs. 500</div>
                <div className="space-y-1 text-[11px] text-slate-400 mb-4">
                  <div>✓ 5 Invite Links / Day</div>
                  <div>✓ 10% Referral Bonus</div>
                  <div>✓ 7-Day Access</div>
                </div>
              </div>
              <button
                onClick={() => packages && setSelectedOffer(packages.weekly)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer border border-slate-700"
              >
                BUY ONE WEEK
              </button>
            </div>

            {/* Monthly */}
            <div className="bg-slate-950/80 border-2 border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between relative">
              <span className="absolute -top-2.5 right-3 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                Best Value
              </span>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase">One Month</span>
                  <Crown className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-lg font-extrabold text-white font-mono mb-2">Rs. 1,000</div>
                <div className="space-y-1 text-[11px] text-slate-300 mb-4">
                  <div>✓ 10 Invite Links / Day</div>
                  <div>✓ 20% Referral Bonus</div>
                  <div>✓ 30-Day Access</div>
                </div>
              </div>
              <button
                onClick={() => packages && setSelectedOffer(packages.monthly)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-emerald-950/60"
              >
                BUY ONE MONTH
              </button>
            </div>
          </div>

          {/* Quick 1-Click Unlock for Testing (Hidden) */}
          <div className="hidden">
            <button
              onClick={() => handleQuickUnlock('monthly')}
              disabled={isQuickActivating}
              className="hidden"
            >
              <Unlock className="w-4 h-4" />
              <span>Instant Unlock Package</span>
            </button>
          </div>
        </div>

        {/* Payment Modal if user clicked Buy */}
        {selectedOffer && (
          <PaymentModal
            packageOffer={selectedOffer}
            onClose={() => setSelectedOffer(null)}
            onSuccess={() => {
              refreshUser();
              fetchStats();
            }}
          />
        )}
      </div>
    );
  }

  // UNLOCKED STATE: User has an active package! Full functionality visible
  return (
    <div className="space-y-6 pb-8">
      {/* Title & Header */}
      <div>
        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Referral Network</span>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Invite Friends</h2>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
            <Unlock className="w-3 h-3" /> Unlocked
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Share your personal link to earn instant referral bonuses whenever a friend joins or activates a package.
        </p>
      </div>

      {/* Unlocked Active Package Notice */}
      <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Active Package: <strong>{activePackage?.packageName}</strong></span>
        </div>
        <span className="font-mono text-[11px] text-emerald-400">
          Expires: {new Date(activePackage?.expiryDate || '').toLocaleDateString()}
        </span>
      </div>

      {/* Referral Link & Sharing Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Your Personal Invite Link</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Referral Bonus: {bonusPct}%</span>
          </div>
        </div>

        {/* Domain Selector Tabs */}
        <div className="mb-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 block">Select Referral Invite Domain:</span>
            {selectedDomain === 'dev' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Connected
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedDomain('dev')}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedDomain === 'dev'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="Connect directly to https://ais-dev-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app"
            >
              <span className="truncate">ais-dev (Live)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDomain('msofficial')}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedDomain === 'msofficial'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="truncate">msofficial.com</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDomain('786msofficial')}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedDomain === '786msofficial'
                  ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="truncate">786msofficial.com</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDomain('cloud')}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedDomain === 'cloud'
                  ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="truncate">ais-pre (Shared)</span>
            </button>
          </div>
        </div>

        {/* Link Input & Copy */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-2 mb-3 gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="w-full bg-transparent px-3 text-xs sm:text-sm text-slate-200 font-mono focus:outline-none"
          />
          <a
            href={currentBase}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors flex items-center gap-1 border border-slate-700/60"
            title="Open Website with this domain"
          >
            <span>Open</span>
          </a>
          <button
            onClick={copyOnly}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>

        {/* Daily Invite Limit Indicator */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">Daily Invite Limit:</span>
          </div>
          <div className="font-mono">
            {stats ? (
              <span className={`font-bold ${isLimitReached ? 'text-red-400' : 'text-emerald-400'}`}>
                {stats.dailyInvitesUsed} / {stats.dailyInviteLimit} invites used today
              </span>
            ) : (
              <span className="text-slate-400">Loading quota...</span>
            )}
          </div>
        </div>

        {/* Limit Warning if reached */}
        {isLimitReached && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Daily invite limit reached. Try again tomorrow.</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 5 Requested Buttons: COPY INVITE LINK, SHARE, TELEGRAM, WHATSAPP, COPY */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            onClick={() => handleShareClick()}
            disabled={isLimitReached}
            className="py-3 px-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl text-[11px] tracking-wide transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>COPY INVITE LINK</span>
          </button>

          <button
            onClick={() => handleShareClick('native')}
            disabled={isLimitReached}
            className="py-3 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold rounded-xl text-[11px] tracking-wide transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>SHARE</span>
          </button>

          <button
            onClick={() => handleShareClick('telegram')}
            disabled={isLimitReached}
            className="py-3 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold rounded-xl text-[11px] tracking-wide transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-blue-400" />
            <span>TELEGRAM</span>
          </button>

          <button
            onClick={() => handleShareClick('whatsapp')}
            disabled={isLimitReached}
            className="py-3 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold rounded-xl text-[11px] tracking-wide transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>WHATSAPP</span>
          </button>

          <button
            onClick={copyOnly}
            disabled={isLimitReached}
            className="py-3 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold rounded-xl text-[11px] tracking-wide transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>COPY</span>
          </button>
        </div>
      </div>

      {/* Referral Statistics Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Real-time Statistics</span>
          <h3 className="text-base font-bold text-white tracking-tight">Referral Performance</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Total Invited Users</span>
            <div className="text-xl font-extrabold text-white font-mono">{stats?.totalInvited || 0}</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Active Referrals</span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">{stats?.activeReferrals || 0}</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Pending Referrals</span>
            <div className="text-xl font-extrabold text-amber-400 font-mono">{stats?.pendingReferrals || 0}</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 sm:col-span-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Earned Bonus</span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">
              Rs. {(stats?.earnedBonus || 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Today's Invitations</span>
            <div className="text-xl font-extrabold text-white font-mono">{stats?.dailyInvitesUsed || 0}</div>
          </div>
        </div>
      </div>

      {/* Send Friend Invite Screenshot Chat Section */}
      <InviteScreenshotSection />
    </div>
  );
};
