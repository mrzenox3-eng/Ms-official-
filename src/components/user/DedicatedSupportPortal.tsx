import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { uploadFile, validateFile } from '../../api/storage';
import { SupportMessage } from '../../types';
import { UserBottomNav, UserTab } from './UserBottomNav';
import { useScreen } from '../../context/ScreenContext';
import { MaximizeButton } from '../common/MaximizeButton';
import appIcon from '../../assets/images/ms_official_icon_new_1791275507280.jpg';
import {
  Headphones,
  Send,
  Camera,
  CheckCheck,
  Clock,
  User,
  Shield,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  PhoneCall,
  X,
  Globe,
} from 'lucide-react';

interface DedicatedSupportPortalProps {
  onBackToApp?: () => void;
  onNavigateTab?: (tab: UserTab) => void;
}

export const DedicatedSupportPortal: React.FC<DedicatedSupportPortalProps> = ({
  onBackToApp,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const { isMaximizedLayout } = useScreen();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persistent guest identifier so visitors retain their support thread across reloads
  const [guestId] = useState<string>(() => {
    let stored = localStorage.getItem('ms_support_guest_id');
    if (!stored) {
      stored = `guest_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('ms_support_guest_id', stored);
    }
    return stored;
  });

  const fetchMessages = async () => {
    try {
      const data = await api.getSupportMessages(user ? undefined : guestId);
      setMessages(data);
    } catch (e) {
      console.error('Failed to load support messages:', e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [user, guestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file format or size');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleSendMessageWithText = async (messageText: string) => {
    if (!messageText.trim() && !filePreview && !selectedFile) return;

    setError(null);
    setIsSending(true);

    try {
      let attachmentUrl = filePreview || undefined;

      // Upload screenshot directly to Backend Storage if file is present
      if (selectedFile) {
        try {
          setUploadProgress(10);
          const uploadRes = await uploadFile(selectedFile, {
            folder: 'support',
            userId: user?.id || guestId,
            onProgress: (pct) => setUploadProgress(pct),
          });
          attachmentUrl = uploadRes.url;
        } catch (storageErr) {
          console.warn('Backend storage upload notice:', storageErr);
          attachmentUrl = filePreview || undefined;
        }
      }

      await api.sendSupportMessage({
        message: messageText.trim(),
        attachment: attachmentUrl,
        guestId: user ? undefined : guestId,
        guestName: user ? undefined : guestName.trim() ? `${guestName.trim()} (${guestPhone || 'Guest'})` : undefined,
      });

      setText('');
      setSelectedFile(null);
      setFilePreview(null);
      setUploadProgress(null);
      await fetchMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      setUploadProgress(null);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSendMessageWithText(text);
  };

  const handleQuickQuestion = (question: string) => {
    setText(question);
  };

  const handleTabClick = (tab: UserTab) => {
    if (tab === 'support') return;
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else if (onBackToApp) {
      onBackToApp();
      window.history.pushState({}, '', `/?tab=${tab}`);
    } else {
      window.location.href = `/?tab=${tab}`;
    }
  };

  const faqs = [
    {
      q: 'How do I activate Weekly or Monthly Packages?',
      a: 'Go to Packages in the app, select your tier (Weekly Rs. 500 or Monthly Rs. 1,000), transfer the fee to our official JazzCash or Easypaisa account, and upload the receipt screenshot. Approval takes 5-15 minutes.',
    },
    {
      q: 'When are Daily Check-In attendance rewards available?',
      a: 'Daily check-in is strictly active between 9:00 AM and 9:00 PM (12-hour window). You must have an active subscription package to earn the daily Rs. 100 reward.',
    },
    {
      q: 'How long do withdrawal requests take?',
      a: 'Withdrawals are processed directly by MS Official administrators to your JazzCash or Easypaisa account, usually within 1-2 hours during standard business times for Rs. 1,000, Rs. 2,500, Rs. 5,000, or Rs. 10,000.',
    },
    {
      q: 'What is the referral bonus rate?',
      a: 'Weekly packages earn 10% referral bonus per invited friend, while Monthly packages earn 20% bonus commissions. Your invite link credits instantly upon registration.',
    },
  ];

  const quickQuestions = [
    'What are the package prices?',
    'What are attendance check-in hours?',
    'How do I deposit via JazzCash or Easypaisa?',
    'What are the withdrawal limits?',
    'What is the referral program bonus?',
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 pb-24 overflow-x-hidden w-full">
      {/* Top Support Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 shadow-xl">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-md bg-slate-900 flex items-center justify-center shrink-0">
              <img src={appIcon} alt="MS Official Icon" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  MS Official Support Desk
                </h1>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  24/7 LIVE
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">Official Customer Support Representatives Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Maximize Full Adjust Screen Button */}
            <MaximizeButton variant="header" />

            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to App</span>
                <span className="sm:hidden">App</span>
              </button>
            )}
          </div>
        </div>

        {/* Official Domains Quick Link Strip */}
        <div className="bg-slate-950 border-t border-slate-800/80 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-slate-400 overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-300">Official Domains:</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://msofficial.com/"
              target="_blank"
              rel="noreferrer"
              className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono transition-colors flex items-center gap-1"
            >
              <span>msofficial.com</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a
              href="https://786msofficial.com/"
              target="_blank"
              rel="noreferrer"
              className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono transition-colors flex items-center gap-1"
            >
              <span>786msofficial.com</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Support Workspace — dynamically full adjusts when maximized */}
      <main
        className={`flex-1 w-full mx-auto px-3 py-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start transition-all duration-300 ${
          isMaximizedLayout ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        {/* Left Column: Live Conversation Thread (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[580px] sm:h-[620px] max-h-[75vh] sm:max-h-[80vh] overflow-hidden">
          {/* Thread Header Info & Customer Support Status */}
          <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-300 truncate">
                {user ? `Member: ${user.name}` : `Live Support (${guestId.substring(0, 8)})`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Customer Support Active</span>
              </span>
            </div>
          </div>

          {/* Guest Contact Details Input (Only if unauthenticated) */}
          {!user && (
            <div className="p-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-col sm:flex-row gap-2 text-xs">
              <input
                type="text"
                placeholder="Your Name (Optional)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="WhatsApp / Phone (Optional)"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full sm:w-48 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="m-3 p-3 rounded-2xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3">
            {/* Automated Welcome Message */}
            <div className="flex items-start gap-2.5 max-w-[90%] sm:max-w-[85%]">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs space-y-1 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-400 text-[11px]">MS Official Customer Support</span>
                  <span className="text-[9px] text-slate-500 font-mono">Official Helpdesk</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Welcome to MS Official Customer Support. Our official representatives are here to assist you with Weekly/Monthly package activations, payment verification, daily attendance rewards (9 AM - 9 PM), or withdrawals. Please send your message or upload a payment screenshot.
                </p>
              </div>
            </div>

            {/* Conversation Messages */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] sm:max-w-[85%] flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isUser
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs shadow-emerald-500/30'
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`rounded-2xl p-3 text-xs space-y-1 shadow-md ${
                        isUser
                          ? 'bg-emerald-600/90 text-white rounded-tr-none'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                        <span className="font-bold flex items-center gap-1">
                          {isUser ? 'You' : (msg.userName && !msg.userName.includes('AI') ? msg.userName : 'Customer Support')}
                        </span>
                        <span className="font-mono">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}

                      {msg.attachment && (
                        <div className="pt-1.5">
                          <a href={msg.attachment} target="_blank" rel="noreferrer">
                            <img
                              src={msg.attachment}
                              alt="Attachment"
                              className="max-h-48 rounded-xl object-cover border border-white/20 shadow-md hover:opacity-90 transition-opacity"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Chips Bar */}
          <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-emerald-400" /> Common Topics:
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickQuestion(q)}
                disabled={isSending}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shrink-0 transition-colors cursor-pointer text-[11px] whitespace-nowrap active:scale-95 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Attachment Preview Box */}
          {filePreview && (
            <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-emerald-500/40" />
                <div className="text-[11px]">
                  <span className="text-emerald-400 font-semibold block truncate max-w-[200px]">
                    {selectedFile?.name || 'Screenshot attached'}
                  </span>
                  <span className="text-[10px] text-slate-500">Ready to upload with message</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveAttachment}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Progress Indicator */}
          {uploadProgress !== null && (
            <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-800 text-[10px] flex items-center justify-between font-mono text-emerald-400">
              <span>Uploading screenshot to backend storage...</span>
              <span>{uploadProgress}%</span>
            </div>
          )}

          {/* Message Form Input */}
          <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <label
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors cursor-pointer shrink-0"
              title="Attach screenshot proof or receipt"
            >
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask a question or report payment proof..."
              className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />

            <button
              type="submit"
              disabled={isSending || (!text.trim() && !filePreview)}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-emerald-950/50 cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: FAQ & Official Information (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Official Verification Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Official Verification Notice</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This helpdesk connects directly to MS Official Master Administrators. For account deposit verifications, always provide your sender account name and JazzCash/Easypaisa transaction ID.
            </p>
          </div>

          {/* Quick FAQ Accordion (Hidden per request) */}
          <div className="hidden bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Frequently Asked Questions</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full font-semibold">
                {faqs.length} Topics
              </span>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div
                    key={index}
                    className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                      isOpen
                        ? 'bg-slate-950 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-950/30'
                        : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full p-3.5 text-left text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="leading-snug">{faq.q}</span>
                      <div className="shrink-0 p-1 rounded-lg bg-slate-900 border border-slate-800/80">
                        {isOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 text-[11px] text-slate-300 leading-relaxed border-t border-slate-900/80 pt-2.5 space-y-2.5 bg-slate-950">
                        <p>{faq.a}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-500">Official Policy Verified</span>
                          <button
                            type="button"
                            onClick={() => handleQuickQuestion(faq.q)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-950/60 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold transition-all cursor-pointer active:scale-95"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Ask about this</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Action */}
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg active:scale-98"
            >
              <span>Return to MS Official Platform</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </main>

      {/* 5-Button Bottom Mobile Navigation Bar — Full fit on all phone screens */}
      <UserBottomNav
        currentTab="support"
        onTabChange={handleTabClick}
        unreadSupportCount={0}
      />
    </div>
  );
};
