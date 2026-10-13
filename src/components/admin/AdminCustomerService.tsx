import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { SupportMessage, User, Wallet, UserPackage } from '../../types';
import {
  Search,
  Headphones,
  Send,
  Camera,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Shield,
  X,
  MessageSquare,
  Wallet as WalletIcon,
  Package as PackageIcon,
  ExternalLink,
} from 'lucide-react';

interface ConversationItem {
  userId: string;
  userName: string;
  unreadCount: number;
  lastMessage: SupportMessage;
}

export const AdminCustomerService: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [userMetadata, setUserMetadata] = useState<{
    user: User;
    wallet: Wallet;
    packages: UserPackage[];
  } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [attachmentData, setAttachmentData] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const data = await api.getAdminSupportConversations();
      setConversations(data);
      if (!selectedUserId && data.length > 0) {
        setSelectedUserId(data[0].userId);
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  };

  const fetchMessagesForUser = async (userId: string) => {
    try {
      const [msgs, history] = await Promise.all([
        api.getAdminSupportMessages(userId),
        api.getAdminUserHistory(userId).catch(() => null),
      ]);
      setMessages(msgs);
      if (history) {
        setUserMetadata({
          user: history.user,
          wallet: history.wallet,
          packages: history.packages,
        });
      }
    } catch (e) {
      console.error('Failed to load messages for user:', e);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessagesForUser(selectedUserId);
      const interval = setInterval(() => fetchMessagesForUser(selectedUserId), 3500);
      return () => clearInterval(interval);
    }
  }, [selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    fetchMessagesForUser(userId);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || (!replyText.trim() && !attachmentData)) return;

    setIsSending(true);
    try {
      await api.replyAdminSupportMessage(selectedUserId, replyText.trim(), attachmentData || undefined);
      setReplyText('');
      setAttachmentData(null);
      await fetchMessagesForUser(selectedUserId);
      await fetchConversations();
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeConversation = conversations.find((c) => c.userId === selectedUserId);
  const activePackage = userMetadata?.packages.find((p) => p.status === 'active');

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Communication Terminal</span>
        <h2 className="text-xl font-bold text-white tracking-tight">Customer Service Console</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Desktop three-pane helpdesk terminal: conversations list, chat timeline, and live member ledger profile.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl h-[680px] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Pane 1: Conversations List (3 of 12 cols on desktop) */}
        <div className="md:col-span-4 lg:col-span-3 border-r border-slate-800 flex flex-col h-full bg-slate-950/70">
          <div className="p-3.5 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No active conversations.</div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedUserId === c.userId;
                return (
                  <button
                    key={c.userId}
                    onClick={() => handleSelectUser(c.userId)}
                    className={`w-full text-left p-3 transition-colors cursor-pointer flex items-start gap-3 ${
                      isSelected ? 'bg-slate-900 border-l-4 border-red-500' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      {c.userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-white truncate">{c.userName}</span>
                        {c.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-red-500 text-white font-bold text-[9px] rounded-full">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {c.lastMessage.message || (c.lastMessage.attachment ? '[Screenshot Attached]' : '...')}
                      </p>
                      <span className="text-[9px] text-slate-600 font-mono">
                        {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Pane 2: Middle Chat Stream (6 of 12 cols on desktop) */}
        <div className="md:col-span-8 lg:col-span-6 flex flex-col h-full bg-slate-900/50 border-r border-slate-800/80">
          {selectedUserId ? (
            <>
              {/* Header */}
              <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">{activeConversation?.userName || 'Member'}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {selectedUserId}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-time Chat</span>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No messages in this chat.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.sender === 'admin';
                    return (
                      <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500">
                          <span>{isAdmin ? 'Administrator' : m.userName}</span>
                          <span>·</span>
                          <span className="font-mono">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                            isAdmin
                              ? 'bg-red-600 text-white rounded-tr-sm shadow-md'
                              : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'
                          }`}
                        >
                          {m.message && <p>{m.message}</p>}
                          {m.attachment && (
                            <img
                              src={m.attachment}
                              alt="Attachment"
                              className="rounded-xl max-h-48 object-cover border border-black/30"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Preview attachment */}
              {attachmentData && (
                <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={attachmentData} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-red-500/40" />
                    <span className="text-xs text-red-400 font-medium">Image ready to send</span>
                  </div>
                  <button onClick={() => setAttachmentData(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Chat Input */}
              <form onSubmit={handleSendReply} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                    title="Send screenshot"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write response to user..."
                  className="flex-1 py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />

                <button
                  type="submit"
                  disabled={(!replyText.trim() && !attachmentData) || isSending}
                  className="p-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
              <p>Select a conversation from the left to start responding.</p>
            </div>
          )}
        </div>

        {/* Pane 3: Right Member Profile Sidebar (Desktop 3 of 12 cols) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col h-full bg-slate-950/80 p-4 overflow-y-auto space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Member Dossier</span>
            <h4 className="text-sm font-bold text-white mt-0.5">{userMetadata?.user.name || 'Member Details'}</h4>
            <span className="text-[10px] text-slate-500 font-mono">{userMetadata?.user.email}</span>
          </div>

          {/* Quick info badges */}
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold">
                <WalletIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Available Balance</span>
              </div>
              <div className="text-base font-bold text-emerald-400 font-mono">
                Rs. {(userMetadata?.wallet.availableBalance || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Pending: Rs. {(userMetadata?.wallet.pendingBalance || 0).toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold">
                <PackageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Subscription Plan</span>
              </div>
              <div className="text-xs font-bold text-white">
                {activePackage ? activePackage.packageName : 'No Active Plan'}
              </div>
              {activePackage && (
                <div className="text-[10px] text-slate-500 font-mono">
                  Expires: {new Date(activePackage.expiryDate).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Phone Number</span>
                <span className="font-mono text-slate-200">{userMetadata?.user.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Referral Code</span>
                <span className="font-mono text-slate-200">{userMetadata?.user.referralCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Member Status</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                    userMetadata?.user.status === 'active'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {userMetadata?.user.status?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
