import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AttendanceStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Clock, CheckCircle2, AlertTriangle, LogIn, LogOut, Calendar } from 'lucide-react';

export const DailyAttendanceCard: React.FC = () => {
  const { refreshUser } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<'in' | 'out' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await api.getTodayAttendance();
      setAttendance(data);
    } catch (e: any) {
      console.error('Failed to load attendance:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();

    // Clock ticker
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async () => {
    setFeedback(null);
    setActionLoading('in');
    try {
      const res = await api.checkIn();
      setFeedback({ type: 'success', message: res.message });
      await fetchAttendance();
      await refreshUser();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Check-in failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async () => {
    setFeedback(null);
    setActionLoading('out');
    try {
      const res = await api.checkOut();
      setFeedback({ type: 'success', message: res.message });
      await fetchAttendance();
      await refreshUser();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Check-out failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const isCheckedIn = attendance?.status === 'checked_in';
  const isCheckedOut = attendance?.status === 'checked_out';
  const canCheckIn = attendance?.withinHours && attendance?.status === 'not_checked_in';
  const canCheckOut = attendance?.withinHours && attendance?.status === 'checked_in';

  const getStatusDisplay = () => {
    if (!attendance?.withinHours) {
      return {
        label: 'Outside Allowed Hours',
        dot: 'text-amber-500',
        bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      };
    }
    if (isCheckedOut) {
      return {
        label: 'Checked Out',
        dot: 'text-slate-400',
        bg: 'bg-slate-800 text-slate-300 border-slate-700',
      };
    }
    if (isCheckedIn) {
      return {
        label: 'Checked In',
        dot: 'text-emerald-400',
        bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      };
    }
    return {
      label: 'Not Checked In',
      dot: 'text-slate-500',
      bg: 'bg-slate-800/80 text-slate-400 border-slate-700/80',
    };
  };

  const statusStyle = getStatusDisplay();

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Daily Attendance</span>
          <h2 className="text-lg font-bold text-white tracking-tight">Today's Status</h2>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentTime || '--:--:--'}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {attendance?.date || new Date().toISOString().split('T')[0]}
          </div>
        </div>
      </div>

      {/* Allowed Working Hours Info Box */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3 mb-5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">Working Hours:</span>
        </div>
        <div className="text-slate-400 font-mono">
          <span>Check-In: <strong className="text-slate-200">9:00 AM</strong></span>
          <span className="mx-2 text-slate-600">·</span>
          <span>Check-Out: <strong className="text-slate-200">9:00 PM</strong></span>
        </div>
      </div>

      {/* Main Status Display Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-5">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/80">
          <span className="text-xs text-slate-400">Current State:</span>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg}`}>
            <span className={`w-2 h-2 rounded-full ${statusStyle.dot} bg-current animate-pulse`} />
            <span>{statusStyle.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Check-in Time</div>
            <div className="text-sm sm:text-base font-bold text-white font-mono">
              {attendance?.checkInTime || (loading ? 'Loading...' : 'Pending')}
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Check-out Time</div>
            <div className="text-sm sm:text-base font-bold text-white font-mono">
              {attendance?.checkOutTime || (loading ? 'Loading...' : 'Pending')}
            </div>
          </div>
        </div>
      </div>

      {/* Action Notifications */}
      {feedback && (
        <div
          className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border-red-800 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCheckIn}
          disabled={!canCheckIn || actionLoading !== null}
          className="min-h-[48px] py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>{actionLoading === 'in' ? 'Checking In...' : 'CHECK IN'}</span>
        </button>

        <button
          onClick={handleCheckOut}
          disabled={!canCheckOut || actionLoading !== null}
          className="min-h-[48px] py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800 text-slate-200 hover:text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wide transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{actionLoading === 'out' ? 'Checking Out...' : 'CHECK OUT'}</span>
        </button>
      </div>

      {!attendance?.withinHours && (
        <p className="text-[11px] text-center text-slate-500 mt-3">
          Check-in/out is active between 9:00 AM and 9:00 PM Pakistan Standard Time.
        </p>
      )}
    </section>
  );
};
