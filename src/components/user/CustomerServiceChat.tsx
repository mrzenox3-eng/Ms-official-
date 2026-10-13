import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { SupportMessage } from '../../types';
import { X, Send, Camera, Headphones, CheckCheck, Clock, User, Shield, Sparkles } from 'lucide-react';

interface CustomerServiceChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerServiceChat: React.FC<CustomerServiceChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState('');
  const [attachmentData, setAttachmentData] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const data = await api.getSupportMessages();
      setMessages(data);
    } catch (e) {
      console.error('Failed to load support messages:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !attachmentData) return;

    setIsSending(true);
    try {
      await api.sendSupportMessage({
        message: text.trim(),
        attachment: attachmentData || undefined,
      });
      setText('');
      setAttachmentData(null);
      await fetchMessages();
    } catch (err) {
      console.error('Failed to send support message:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md h-[550px] max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Customer Support</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Official Support Active</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <Headphones className="w-8 h-8 text-slate-600 mb-2" />
              <p className="font-semibold text-slate-400">Welcome to MS Official Helpdesk</p>
              <p className="text-[11px] mt-1 max-w-xs">
                How can we assist you today? Send a message or attach a screenshot regarding your account, deposits, or withdrawals.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isAdmin = m.sender === 'admin';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    {isAdmin ? (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Official Support
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">You</span>
                    )}
                    <span className="text-[9px] text-slate-600">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                      isAdmin
                        ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'
                        : 'bg-emerald-600 text-white rounded-tr-sm shadow-md shadow-emerald-950/40'
                    }`}
                  >
                    {m.message && <p>{m.message}</p>}
                    {m.attachment && (
                      <img
                        src={m.attachment}
                        alt="Attachment"
                        className="rounded-lg max-h-48 object-cover border border-black/20"
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment preview if selected */}
        {attachmentData && (
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={attachmentData}
                alt="Upload preview"
                className="w-10 h-10 object-cover rounded-lg border border-emerald-500/40"
              />
              <span className="text-xs text-emerald-400 font-medium">Screenshot ready</span>
            </div>
            <button
              onClick={() => setAttachmentData(null)}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button
              type="button"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Attach screenshot"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 py-2.5 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            disabled={(!text.trim() && !attachmentData) || isSending}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-950/40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
