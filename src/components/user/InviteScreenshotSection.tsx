import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ScreenshotSubmission } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { uploadReferralScreenshot, validateFile } from '../../api/storage';
import { Camera, Send, MessageSquare, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export const InviteScreenshotSection: React.FC = () => {
  const { user, activePackage, dailyUsage, refreshUser } = useAuth();
  const [submissions, setSubmissions] = useState<ScreenshotSubmission[]>([]);
  const [friendName, setFriendName] = useState('');
  const [message, setMessage] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const maxScreenshots = activePackage?.packageId === 'monthly' ? 10 : 5;
  const screenshotsUsed = dailyUsage?.screenshotsUsed || 0;
  const isLimitReached = screenshotsUsed >= maxScreenshots;

  const loadSubmissions = async () => {
    try {
      const data = await api.getMyScreenshots();
      setSubmissions(data);
    } catch (e) {
      console.error('Failed to load submissions:', e);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate using storage utility (type + size <= 10MB)
    const validation = validateFile(file);
    if (!validation.valid) {
      setFeedback({ type: 'error', text: validation.error || 'Invalid file format or size' });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotData(reader.result as string);
      setFeedback(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (isLimitReached) {
      setFeedback({
        type: 'error',
        text: `Daily screenshot limit (${maxScreenshots}/day) reached. Try again tomorrow.`,
      });
      return;
    }

    if (!friendName.trim()) {
      setFeedback({ type: 'error', text: 'Please enter the name of your invited friend' });
      return;
    }
    if (!screenshotData) {
      setFeedback({ type: 'error', text: 'Please select or upload the screenshot proof' });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      let finalImageUrl = screenshotData;

      // Upload to Backend Storage
      try {
        if (selectedFile) {
          finalImageUrl = await uploadReferralScreenshot(
            selectedFile,
            user?.id || 'guest',
            (percent) => setUploadProgress(percent)
          );
        } else if (screenshotData) {
          finalImageUrl = await uploadReferralScreenshot(
            screenshotData,
            user?.id || 'guest',
            (percent) => setUploadProgress(percent)
          );
        }
      } catch (storageErr: any) {
        console.warn('Backend storage upload notice:', storageErr);
        finalImageUrl = screenshotData;
      }

      const res = await api.submitScreenshot({
        friendName: friendName.trim(),
        imageUrl: finalImageUrl,
        message: message.trim(),
      });

      setFeedback({ type: 'success', text: 'Screenshot submitted successfully to backend storage' });
      setFriendName('');
      setMessage('');
      setScreenshotData(null);
      setSelectedFile(null);
      await loadSubmissions();
      await refreshUser();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Submission failed' });
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Verification Chat</span>
          <h3 className="text-base font-bold text-white tracking-tight">Send Friend Invite Screenshot</h3>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-400 font-mono">
            {screenshotsUsed} / {maxScreenshots} used today
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border-red-800 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Invited Friend Name / Number
          </label>
          <input
            type="text"
            required
            disabled={isLimitReached || loading}
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="e.g. Usman Tariq (0302-1234567)"
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Screenshot Proof
          </label>
          <div className="border border-dashed border-slate-700 rounded-xl p-3 bg-slate-900/60 text-center relative hover:border-emerald-500/40 transition-colors">
            <input
              type="file"
              accept="image/*"
              disabled={isLimitReached || loading}
              onChange={handleImage}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            {screenshotData ? (
              <div className="flex items-center justify-center gap-3">
                <img
                  src={screenshotData}
                  alt="Proof preview"
                  className="w-10 h-10 object-cover rounded-lg border border-emerald-500/40"
                />
                <span className="text-xs text-emerald-400 font-medium">Screenshot attached (Tap to replace)</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs py-1">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Upload chat or registration proof screenshot</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Optional Message for Admin
          </label>
          <input
            type="text"
            disabled={isLimitReached || loading}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Registered with my link just now"
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
        </div>

        {/* Storage Upload Progress Bar */}
        {uploadProgress !== null && (
          <div className="space-y-1 p-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between text-[11px] text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Uploading to Backend Storage...
              </span>
              <span className="font-mono text-emerald-400 font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-200 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLimitReached || loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{loading ? 'Uploading & Submitting...' : isLimitReached ? 'Daily Limit Reached' : 'Submit Screenshot'}</span>
        </button>
      </form>

      {/* Conversation / Submissions Feed */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span>Screenshot History & Admin Replies</span>
        </h4>

        {submissions.length === 0 ? (
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-center text-xs text-slate-500">
            No screenshots submitted yet. Upload a proof above when a friend registers.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {submissions.map((sub) => {
              const statusStyles = {
                approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
                resolved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              }[sub.status] || 'bg-slate-800 text-slate-300 border-slate-700';

              return (
                <div key={sub.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{sub.friendName}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyles}`}>
                      {sub.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex gap-3 items-start">
                    {sub.imageUrl && (
                      <img
                        src={sub.imageUrl}
                        alt="Submission"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-800 shrink-0"
                      />
                    )}
                    <div className="text-xs text-slate-300">
                      {sub.message && <p className="mb-1">{sub.message}</p>}
                      <span className="text-[10px] text-slate-500">
                        {new Date(sub.createdAt).toLocaleDateString()} at{' '}
                        {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {sub.adminReply && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">Admin Response:</span>
                      <p className="text-slate-200">{sub.adminReply}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
