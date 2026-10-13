import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ScreenshotSubmission } from '../../types';
import {
  Search,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Check,
  X,
  Send,
  Eye,
} from 'lucide-react';

export const AdminScreenshots: React.FC = () => {
  const [submissions, setSubmissions] = useState<ScreenshotSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSub, setSelectedSub] = useState<ScreenshotSubmission | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminScreenshots();
      setSubmissions(data);
    } catch (e) {
      console.error('Failed to load screenshots:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleUpdateStatus = async (id: string, status: string, customReply?: string) => {
    try {
      await api.updateAdminScreenshot(id, status, customReply || replyText || undefined);
      setFeedback(`Submission marked as ${status.toUpperCase()}`);
      setTimeout(() => setFeedback(null), 3000);
      setReplyText('');
      await fetchSubmissions();
      // Update selected modal view if active
      if (selectedSub && selectedSub.id === id) {
        setSelectedSub((prev) => (prev ? { ...prev, status: status as any, adminReply: customReply || replyText || prev.adminReply } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update submission');
    }
  };

  const filtered = submissions.filter(
    (s) =>
      s.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.friendName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.userPhone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Referral Proofs</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Invite Screenshot Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit friend invitation proofs, reply to user submissions, award bonuses, and mark conversations resolved.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by User Name, Friend Name, or Phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
          />
        </div>
      </div>

      {/* Submissions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-8 text-center text-slate-500 text-xs">Loading screenshots...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 py-8 text-center text-slate-500 text-xs">No screenshot submissions found.</div>
        ) : (
          filtered.map((sub) => {
            const statusStyle = {
              approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
              resolved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
              pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            }[sub.status] || 'bg-slate-800 text-slate-300';

            return (
              <div
                key={sub.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{sub.userName}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">{sub.userPhone}</span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle}`}>
                      {sub.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex gap-3 mb-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <img
                      src={sub.imageUrl}
                      alt="Proof"
                      className="w-16 h-16 object-cover rounded-xl border border-slate-700 shrink-0 cursor-pointer"
                      onClick={() => setSelectedSub(sub)}
                    />
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-slate-500">Invited Friend:</span>{' '}
                        <strong className="text-white">{sub.friendName}</strong>
                      </div>
                      {sub.message && <p className="text-slate-300 italic line-clamp-2">"{sub.message}"</p>}
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {new Date(sub.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {sub.adminReply && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 mb-4">
                      <span className="text-[10px] font-bold text-red-400 block">Admin Reply:</span>
                      {sub.adminReply}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Conversation</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(sub.id, 'approved', 'Verified and approved!')}
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors cursor-pointer"
                    title="Approve and award Rs. 50 bonus"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(sub.id, 'rejected', 'Screenshot unverified')}
                    className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors cursor-pointer"
                    title="Reject"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(sub.id, 'resolved')}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl text-xs font-semibold cursor-pointer"
                    title="Mark Resolved"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Conversation Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedSub(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Proof Review</span>
              <h3 className="text-base font-bold text-white">
                {selectedSub.userName} · Friend: {selectedSub.friendName}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
              <div className="p-2 bg-black rounded-2xl flex items-center justify-center border border-slate-800">
                <img src={selectedSub.imageUrl} alt="Full Proof" className="max-h-64 object-contain rounded-xl" />
              </div>

              {selectedSub.message && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">User Message:</span>
                  <p className="text-slate-200">{selectedSub.message}</p>
                </div>
              )}

              {selectedSub.adminReply && (
                <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30 text-xs">
                  <span className="text-[10px] text-emerald-400 font-bold block mb-1">Current Admin Reply:</span>
                  <p className="text-slate-200">{selectedSub.adminReply}</p>
                </div>
              )}
            </div>

            {/* Reply Input Form */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write reply to send to user..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedSub.id, 'approved', replyText || 'Approved!')}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Approve (+Rs 50)
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSub.id, 'rejected', replyText || 'Rejected')}
                  className="py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSub.id, 'resolved', replyText || 'Marked Resolved')}
                  className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
