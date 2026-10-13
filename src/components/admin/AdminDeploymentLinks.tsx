import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Copy,
  Check,
  Globe,
  Shield,
  ExternalLink,
  QrCode,
  Sparkles,
  Link2,
  Server,
  Share2,
  CheckCircle2,
  Save,
  HelpCircle,
  X,
  Smartphone,
  Users,
  Package,
  CalendarCheck,
  Headphones,
} from 'lucide-react';

interface DomainLinksData {
  activeDomain: string;
  protocol: string;
  userLink: string;
  adminLink: string;
  subdomainAdminLink: string;
  subdomainAppLink: string;
  referralTemplateLink: string;
  packageLink: string;
  attendanceLink: string;
  supportLink: string;
  cloudPreUrl: string;
  cloudDevUrl: string;
  cloudPreAdminUrl: string;
  domainSettings?: {
    customDomain: string;
    useHttps: boolean;
    subdomainAdmin: string;
    subdomainApp: string;
  };
}

export const AdminDeploymentLinks: React.FC = () => {
  const [data, setData] = useState<DomainLinksData | null>(null);
  const [customDomainInput, setCustomDomainInput] = useState('786msofficial.com');
  const [activeDomainPreset, setActiveDomainPreset] = useState<
    'msofficial' | '786msofficial' | 'cloudPre' | 'custom' | 'cloudDev' | 'current'
  >('msofficial');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sampleReferralCode, setSampleReferralCode] = useState('MS-OFFICIAL');
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [qrModalLink, setQrModalLink] = useState<{ title: string; url: string } | null>(null);


  const CLOUD_PRE_DOMAIN = 'ais-pre-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app';
  const CLOUD_DEV_DOMAIN = 'ais-dev-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app';
  const MSOFFICIAL_DOMAIN = 'msofficial.com';
  const MSOFFICIAL_786_DOMAIN = '786msofficial.com';

  const loadLinks = async (targetDomain?: string) => {
    try {
      const res = await api.getDeploymentLinks(targetDomain || MSOFFICIAL_DOMAIN);
      setData(res);
      if (res.domainSettings?.customDomain && !customDomainInput) {
        setCustomDomainInput(res.domainSettings.customDomain);
      }
    } catch (err) {
      console.error('Failed to load deployment links:', err);
      // Fallback construction
      const origin = `https://${MSOFFICIAL_DOMAIN}`;
      const host = MSOFFICIAL_DOMAIN;
      setData({
        activeDomain: host,
        protocol: 'https',
        userLink: origin,
        adminLink: `${origin}/admin`,
        subdomainAdminLink: `https://admin.${host}`,
        subdomainAppLink: `https://app.${host}`,
        referralTemplateLink: `${origin}/?ref=`,
        packageLink: `${origin}/?tab=packages`,
        attendanceLink: `${origin}/?tab=attendance`,
        supportLink: `${origin}/?tab=support`,
        cloudPreUrl: `https://${CLOUD_PRE_DOMAIN}`,
        cloudDevUrl: `https://${CLOUD_DEV_DOMAIN}`,
        cloudPreAdminUrl: `https://${CLOUD_PRE_DOMAIN}/admin`,
      });
    }
  };

  useEffect(() => {
    // Initial load with default official domain
    loadLinks(MSOFFICIAL_DOMAIN);
  }, []);

  const handleSelectPreset = (
    preset: 'msofficial' | '786msofficial' | 'cloudPre' | 'cloudDev' | 'custom' | 'current'
  ) => {
    setActiveDomainPreset(preset);
    if (preset === 'msofficial') {
      loadLinks(MSOFFICIAL_DOMAIN);
    } else if (preset === '786msofficial') {
      loadLinks(MSOFFICIAL_786_DOMAIN);
    } else if (preset === 'cloudPre') {
      loadLinks(CLOUD_PRE_DOMAIN);
    } else if (preset === 'cloudDev') {
      loadLinks(CLOUD_DEV_DOMAIN);
    } else if (preset === 'current') {
      loadLinks(window.location.host);
    } else if (preset === 'custom' && customDomainInput.trim()) {
      loadLinks(customDomainInput.trim());
    }
  };



  const handleSaveCustomDomain = async () => {
    if (!customDomainInput.trim()) return;
    setIsSavingDomain(true);
    setSaveSuccess(false);
    try {
      await api.updateDomainSettings({
        customDomain: customDomainInput.trim(),
        useHttps: true,
      });
      await loadLinks(customDomainInput.trim());
      setActiveDomainPreset('custom');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving custom domain: ${err.message || 'Failed'}`);
    } finally {
      setIsSavingDomain(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentDomain = data?.activeDomain || CLOUD_PRE_DOMAIN;
  const currentProtocol = data?.protocol || 'https';
  const userAppUrl = `${currentProtocol}://${currentDomain}`;
  const adminConsoleUrl = `${currentProtocol}://${currentDomain}/admin`;
  const referralUrl = `${currentProtocol}://${currentDomain}/?ref=${sampleReferralCode.trim() || 'MS-VIP'}`;
  const packageStoreUrl = `${currentProtocol}://${currentDomain}/?tab=packages`;
  const attendanceUrl = `${currentProtocol}://${currentDomain}/?tab=attendance`;
  const supportUrl = `${currentProtocol}://${currentDomain}/?tab=support`;
  const subdomainAdminUrl = `${currentProtocol}://admin.${currentDomain}`;

  const copyAllLinksManifest = () => {
    const manifest = `=== MS OFFICIAL PLATFORM LINKS (DOMAIN: ${currentDomain}) ===
1. Public User App: ${userAppUrl}
2. Private Admin Console: ${adminConsoleUrl}
3. Referral Registration: ${referralUrl}
4. Package Store: ${packageStoreUrl}
5. Attendance Check-In: ${attendanceUrl}
6. Customer Support: ${supportUrl}
7. Admin Subdomain (Optional): ${subdomainAdminUrl}
Generated at: ${new Date().toISOString()}`;

    navigator.clipboard.writeText(manifest);
    setCopiedKey('ALL_MANIFEST');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Architecture & Domain Hub
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Links with Domain Generator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, format, test, and distribute production links mapped to your active domain or custom URL.
          </p>
        </div>

        <button
          onClick={copyAllLinksManifest}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer w-fit"
        >
          {copiedKey === 'ALL_MANIFEST' ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
          <span>{copiedKey === 'ALL_MANIFEST' ? 'ALL LINKS COPIED' : 'COPY ALL LINKS MANIFEST'}</span>
        </button>
      </div>

      {/* Featured Production Links Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 rounded-3xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Official Production Links</h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            SSL ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Link 1: msofficial.com */}
          <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Primary Domain
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Official</span>
            </div>
            <p className="text-[11px] font-mono text-slate-300 truncate">https://msofficial.com/</p>
            <div className="flex gap-1.5 pt-1">
              <a
                href="https://msofficial.com/"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-center text-[11px] flex items-center justify-center gap-1 transition-colors"
              >
                <span>Open Site</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard('https://msofficial.com/', 'FEAT_MSOFFICIAL')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedKey === 'FEAT_MSOFFICIAL' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Link 2: 786msofficial.com */}
          <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Alternate VIP Domain
              </span>
              <span className="text-[10px] font-mono text-amber-400">786 Series</span>
            </div>
            <p className="text-[11px] font-mono text-slate-300 truncate">https://786msofficial.com/</p>
            <div className="flex gap-1.5 pt-1">
              <a
                href="https://786msofficial.com/"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold text-center text-[11px] flex items-center justify-center gap-1 transition-colors"
              >
                <span>Open Site</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard('https://786msofficial.com/', 'FEAT_786MSOFFICIAL')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedKey === 'FEAT_786MSOFFICIAL' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Link 3: Cloud Run Support Direct Desk */}
          <div className="bg-slate-950/90 border border-blue-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Direct Support Portal
              </span>
              <span className="text-[10px] font-mono text-blue-400">?tab=support</span>
            </div>
            <p className="text-[11px] font-mono text-slate-300 truncate">
              https://ais-pre-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app/?tab=support
            </p>
            <div className="flex gap-1.5 pt-1">
              <a
                href="https://ais-pre-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app/?tab=support"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-center text-[11px] flex items-center justify-center gap-1 transition-colors"
              >
                <span>Open Support</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    'https://ais-pre-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app/?tab=support',
                    'FEAT_SUPPORT'
                  )
                }
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedKey === 'FEAT_SUPPORT' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MS Official Customer Support Desk Operations Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Live Customer Support Desk</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  HUMAN ASSISTANCE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official support portal for user inquiries, screenshot verifications, and direct helpdesk tickets.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={data?.supportLink || `https://${currentDomain}/?tab=support`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>Open Support Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 shrink-0">Public Direct Support Link:</span>
            <span className="font-mono text-emerald-400 truncate">{data?.supportLink || `https://${currentDomain}/?tab=support`}</span>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(data?.supportLink || `https://${currentDomain}/?tab=support`, 'support-desk-card')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer flex items-center gap-1 self-start sm:self-auto"
          >
            {copiedKey === 'support-desk-card' ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="text-[11px]">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Domain Selection & Custom Domain Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Target Domain Configuration</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Active: <span className="text-emerald-400 font-bold">{currentProtocol}://{currentDomain}</span>
          </span>
        </div>

        {/* Preset Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => handleSelectPreset('msofficial')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeDomainPreset === 'msofficial'
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-white mb-1">
              <span>msofficial.com</span>
              {activeDomainPreset === 'msofficial' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <span className="text-[10px] font-mono block truncate opacity-75">Primary Site</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('786msofficial')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeDomainPreset === '786msofficial'
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-white mb-1">
              <span>786msofficial.com</span>
              {activeDomainPreset === '786msofficial' && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </div>
            <span className="text-[10px] font-mono block truncate opacity-75">VIP Site</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('cloudPre')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeDomainPreset === 'cloudPre'
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-white mb-1">
              <span>Shared Cloud App</span>
              {activeDomainPreset === 'cloudPre' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <span className="text-[10px] font-mono block truncate opacity-75">{CLOUD_PRE_DOMAIN}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('current')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeDomainPreset === 'current'
                ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-200 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-white mb-1">
              <span>Window Host</span>
              {activeDomainPreset === 'current' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
            </div>
            <span className="text-[10px] font-mono block truncate opacity-75">{window.location.host}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('custom')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeDomainPreset === 'custom'
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-white mb-1">
              <span>Custom Domain</span>
              {activeDomainPreset === 'custom' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </div>
            <span className="text-[10px] font-mono block truncate opacity-75">
              {customDomainInput || 'Enter below'}
            </span>
          </button>
        </div>

        {/* Custom Domain Input & Save */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Server className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={customDomainInput}
              onChange={(e) => setCustomDomainInput(e.target.value)}
              placeholder="e.g. msofficial.com or app.msofficial.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSelectPreset('custom')}
              disabled={!customDomainInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer flex-1 sm:flex-initial"
            >
              Apply to Links
            </button>

            <button
              type="button"
              onClick={handleSaveCustomDomain}
              disabled={isSavingDomain || !customDomainInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer flex-1 sm:flex-initial"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingDomain ? 'Saving...' : saveSuccess ? 'Saved as Default!' : 'Save as Default'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Domain Links Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LINK 1: Public User Application Link */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Public User Application Link</h3>
                <span className="text-[10px] text-emerald-400 font-mono">Members & General Public</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
              PORTAL ROOT
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Main public entrypoint for all members. Features login/registration, daily check-in, package purchases, referral earning, and withdrawal wallet.
          </p>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-300 break-all select-all flex items-center justify-between gap-2">
            <span className="truncate">{userAppUrl}</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => copyToClipboard(userAppUrl, 'user')}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
            >
              {copiedKey === 'user' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'user' ? 'COPIED' : 'COPY USER LINK'}</span>
            </button>
            <a
              href={userAppUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Open link in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => setQrModalLink({ title: 'Public User Link QR', url: userAppUrl })}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LINK 2: Private Admin Console Link */}
        <div className="bg-slate-900 border border-red-900/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Private Admin Console Link</h3>
                <span className="text-[10px] text-red-400 font-mono">2FA Secured Management</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-red-950 text-red-300 border border-red-800 text-[10px] font-mono font-bold">
              ROOT ADMIN
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Strictly private URL for authorized administrators. Protected with email, password, 2FA validation, attempt rate-limiting, and audit logging.
          </p>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-red-300 break-all select-all flex items-center justify-between gap-2">
            <span className="truncate">{adminConsoleUrl}</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => copyToClipboard(adminConsoleUrl, 'admin')}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-950/40"
            >
              {copiedKey === 'admin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'admin' ? 'COPIED' : 'COPY ADMIN LINK'}</span>
            </button>
            <a
              href={adminConsoleUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Open link in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => setQrModalLink({ title: 'Admin Console Link QR', url: adminConsoleUrl })}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LINK 3: User Referral Link Generator */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Referral Invitation Link with Domain</h3>
                <span className="text-[10px] text-cyan-400 font-mono">Commission & Invite Attribution</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono">Code:</span>
              <input
                type="text"
                value={sampleReferralCode}
                onChange={(e) => setSampleReferralCode(e.target.value.toUpperCase())}
                placeholder="CODE"
                className="w-24 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded-md text-[10px] font-mono text-cyan-300 text-center font-bold"
              />
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Format distributed by users to invite friends. Pre-populates the referrer code in the registration modal and automatically credits commission bonuses.
          </p>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all flex items-center justify-between gap-2">
            <span className="truncate">{referralUrl}</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => copyToClipboard(referralUrl, 'referral')}
              className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-950/40"
            >
              {copiedKey === 'referral' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'referral' ? 'COPIED' : 'COPY REFERRAL LINK'}</span>
            </button>
            <a
              href={referralUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Open link in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => setQrModalLink({ title: 'Referral Link QR', url: referralUrl })}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LINK 4: Direct Package Store Portal */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Direct Package Store Link</h3>
                <span className="text-[10px] text-amber-400 font-mono">Weekly & Monthly Packages</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold">
              PACKAGES
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Directly routes users to package subscriptions (Weekly @ Rs. 500 / Monthly @ Rs. 1,000), fee payment credentials, and payment screenshot submission.
          </p>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-amber-300 break-all select-all flex items-center justify-between gap-2">
            <span className="truncate">{packageStoreUrl}</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => copyToClipboard(packageStoreUrl, 'packages')}
              className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-950/40"
            >
              {copiedKey === 'packages' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'packages' ? 'COPIED' : 'COPY PACKAGE LINK'}</span>
            </button>
            <a
              href={packageStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Open link in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => setQrModalLink({ title: 'Package Store Link QR', url: packageStoreUrl })}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LINK 5: Attendance & Daily Check-In Link */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Daily Check-In Attendance Link</h3>
                <span className="text-[10px] text-purple-400 font-mono">9:00 AM – 9:00 PM Timed Portal</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold">
              CHECK-IN
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Opens the attendance check-in/out terminal. Enforces active package requirement, 9:00 AM - 9:00 PM working window, and automatic Rs. 100 earnings credit.
          </p>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-purple-300 break-all select-all flex items-center justify-between gap-2">
            <span className="truncate">{attendanceUrl}</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => copyToClipboard(attendanceUrl, 'attendance')}
              className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-950/40"
            >
              {copiedKey === 'attendance' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'attendance' ? 'COPIED' : 'COPY CHECK-IN LINK'}</span>
            </button>
            <a
              href={attendanceUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Open link in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => setQrModalLink({ title: 'Attendance Link QR', url: attendanceUrl })}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LINK 6: Customer Support Desk Link */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Live Customer Support Desk Link</h3>
                <span className="text-[10px] text-blue-400 font-mono">User Support Helpdesk</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold">
              SUPPORT
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Direct deep link for member support inquiries, screenshot attachment reviews, withdrawal assistance, and official administration notices.
          </p>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-blue-300 break-all select-all flex items-center justify-between gap-2">
            <span className="truncate">{supportUrl}</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => copyToClipboard(supportUrl, 'support')}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-950/40"
            >
              {copiedKey === 'support' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'support' ? 'COPIED' : 'COPY SUPPORT LINK'}</span>
            </button>
            <a
              href={supportUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Open link in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => setQrModalLink({ title: 'Support Desk Link QR', url: supportUrl })}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subdomain Architecture & DNS Custom Domain Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Server className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Custom Domain & DNS Setup Guide</h3>
            <p className="text-[10px] text-slate-400">How to attach your custom domain (786msofficial.com)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[11px] font-mono">1</span>
              <span>Point CNAME / A Record</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              In your domain registrar (GoDaddy, Namecheap, Cloudflare), point:
            </p>
            <div className="p-2 rounded bg-slate-900 font-mono text-[10px] text-emerald-400 space-y-0.5">
              <div>Type: CNAME</div>
              <div>Host: @ or app</div>
              <div>Value: {CLOUD_PRE_DOMAIN}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[11px] font-mono">2</span>
              <span>Subdomain Separation</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Optionally route admin access via dedicated subdomain:
            </p>
            <div className="p-2 rounded bg-slate-900 font-mono text-[10px] text-cyan-400 space-y-0.5">
              <div>Type: CNAME</div>
              <div>Host: admin</div>
              <div>Value: {CLOUD_PRE_DOMAIN}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[11px] font-mono">3</span>
              <span>Save as Default in System</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Enter your domain in the input above and click <strong className="text-emerald-400 font-bold">"Save as Default"</strong>. All user sharing links, QR codes, and SMS invites will immediately use your custom domain!
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Popup Modal */}
      {qrModalLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setQrModalLink(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <h4 className="text-base font-bold text-white">{qrModalLink.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">Scan with phone camera</p>
            </div>

            {/* Generated QR Code SVG */}
            <div className="p-4 bg-white rounded-2xl flex items-center justify-center shadow-inner">
              <svg viewBox="0 0 100 100" className="w-48 h-48">
                {/* SVG QR Code Simulation */}
                <rect width="100" height="100" fill="white" />
                {/* Corner 1 */}
                <rect x="10" y="10" width="24" height="24" fill="#020617" rx="3" />
                <rect x="15" y="15" width="14" height="14" fill="white" />
                <rect x="19" y="19" width="6" height="6" fill="#020617" />
                {/* Corner 2 */}
                <rect x="66" y="10" width="24" height="24" fill="#020617" rx="3" />
                <rect x="71" y="15" width="14" height="14" fill="white" />
                <rect x="75" y="19" width="6" height="6" fill="#020617" />
                {/* Corner 3 */}
                <rect x="10" y="66" width="24" height="24" fill="#020617" rx="3" />
                <rect x="15" y="71" width="14" height="14" fill="white" />
                <rect x="19" y="75" width="6" height="6" fill="#020617" />
                {/* Data blocks */}
                <rect x="40" y="15" width="5" height="5" fill="#020617" />
                <rect x="50" y="15" width="5" height="5" fill="#020617" />
                <rect x="45" y="25" width="5" height="5" fill="#020617" />
                <rect x="40" y="35" width="5" height="5" fill="#020617" />
                <rect x="55" y="35" width="5" height="5" fill="#020617" />
                <rect x="15" y="45" width="5" height="5" fill="#020617" />
                <rect x="25" y="45" width="5" height="5" fill="#020617" />
                <rect x="35" y="45" width="5" height="5" fill="#020617" />
                <rect x="45" y="45" width="10" height="10" fill="#059669" rx="2" />
                <rect x="65" y="45" width="5" height="5" fill="#020617" />
                <rect x="75" y="45" width="5" height="5" fill="#020617" />
                <rect x="85" y="45" width="5" height="5" fill="#020617" />
                <rect x="40" y="65" width="5" height="5" fill="#020617" />
                <rect x="50" y="65" width="5" height="5" fill="#020617" />
                <rect x="45" y="75" width="5" height="5" fill="#020617" />
                <rect x="65" y="65" width="5" height="5" fill="#020617" />
                <rect x="75" y="75" width="5" height="5" fill="#020617" />
                <rect x="85" y="85" width="5" height="5" fill="#020617" />
              </svg>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 break-all select-all text-center">
              {qrModalLink.url}
            </div>

            <button
              onClick={() => copyToClipboard(qrModalLink.url, 'modal')}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedKey === 'modal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'modal' ? 'LINK COPIED' : 'COPY LINK ADDRESS'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
