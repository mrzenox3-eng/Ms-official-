import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AdminStats, AdminAuditLog } from '../../types';
import {
  Users,
  UserCheck,
  Radio,
  Package,
  Crown,
  Clock,
  ArrowDownToLine,
  CheckCircle2,
  Wallet,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminAuditLogs().catch(() => []),
      ]);
      setStats(statsData);
      setRecentLogs(logsData.slice(0, 5));
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalPackages = (stats?.activeWeeklyPackages ?? 0) + (stats?.activeMonthlyPackages ?? 0);
  const weeklyPct = totalPackages > 0 ? Math.round(((stats?.activeWeeklyPackages ?? 0) / totalPackages) * 100) : 50;
  const monthlyPct = totalPackages > 0 ? Math.round(((stats?.activeMonthlyPackages ?? 0) / totalPackages) * 100) : 50;

  const statCards = [
    {
      title: 'Total Users',
      value: (stats?.totalUsers ?? 0).toLocaleString(),
      sub: 'Registered accounts',
      icon: Users,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      action: () => onNavigate('users'),
    },
    {
      title: 'Active Users',
      value: (stats?.activeUsers ?? 0).toLocaleString(),
      sub: 'Good standing',
      icon: UserCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      action: () => onNavigate('users'),
    },
    {
      title: 'Online Users',
      value: (stats?.onlineUsers ?? 0).toLocaleString(),
      sub: 'Current live activity',
      icon: Radio,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      action: () => onNavigate('users'),
    },
    {
      title: 'Active Weekly Packages',
      value: (stats?.activeWeeklyPackages ?? 0).toLocaleString(),
      sub: '7-day validity (Rs. 500)',
      icon: Package,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      action: () => onNavigate('packages'),
    },
    {
      title: 'Active Monthly Packages',
      value: (stats?.activeMonthlyPackages ?? 0).toLocaleString(),
      sub: '30-day validity (Rs. 1,000)',
      icon: Crown,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      action: () => onNavigate('packages'),
    },
    {
      title: 'Pending Payments',
      value: (stats?.pendingPayments ?? 0).toLocaleString(),
      sub: 'Require verification',
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      highlight: (stats?.pendingPayments ?? 0) > 0,
      action: () => onNavigate('packages'),
    },
    {
      title: 'Pending Withdrawals',
      value: (stats?.pendingWithdrawals ?? 0).toLocaleString(),
      sub: 'Payout claims in queue',
      icon: ArrowDownToLine,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      highlight: (stats?.pendingWithdrawals ?? 0) > 0,
      action: () => onNavigate('withdrawals'),
    },
    {
      title: 'Successful Withdrawals',
      value: (stats?.successfulWithdrawals ?? 0).toLocaleString(),
      sub: 'Processed to Jazz/Easy',
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      action: () => onNavigate('withdrawals'),
    },
    {
      title: 'Total System Balance',
      value: `Rs. ${(stats?.totalBalance ?? 0).toLocaleString()}`,
      sub: 'Member wallets aggregate',
      icon: Wallet,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      action: () => onNavigate('balances'),
    },
    {
      title: 'Pending Inquiries',
      value: (stats?.pendingCustomerMessages ?? 0).toLocaleString(),
      sub: 'Unread member messages',
      icon: MessageSquare,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      highlight: (stats?.pendingCustomerMessages ?? 0) > 0,
      action: () => onNavigate('support'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Institutional Top Control Bar */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-6 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
              Executive Console
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Gateway Services
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">MS Official Operations Terminal</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time server synchronization for member authentication, attendance validation, manual and automated package approvals, and ledger balances.
          </p>
        </div>

        {/* Quick status cluster */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Security:</span>
            <span className="text-white font-bold">SHA-512 Strict</span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs font-mono">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400">Database:</span>
            <span className="text-emerald-400 font-bold">Online</span>
          </div>

          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 10 Core Stat Metrics (Desktop 5-column grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={card.action}
              className={`p-4 rounded-2xl bg-slate-900 border text-left transition-all hover:border-slate-600 hover:-translate-y-0.5 cursor-pointer shadow-md flex flex-col justify-between ${
                card.highlight
                  ? 'border-amber-500/50 bg-amber-950/20 ring-1 ring-amber-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                    {card.title}
                  </span>
                  <div className={`p-1.5 rounded-lg border ${card.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-mono tracking-tight tabular-nums">
                  {card.value}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span className="truncate">{card.sub}</span>
                <ArrowUpRight className="w-3 h-3 text-slate-600 shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Operations Matrix & Insights (Desktop 2-column layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Urgent Action Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Priority Task Queues</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Requires Admin Attention</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Task 1: Package verification */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-300">
                    <span>Payment Verification</span>
                    <span className="font-mono text-amber-400 font-bold">{stats?.pendingPayments ?? 0}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    JazzCash & Easypaisa screenshots awaiting approval.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('packages')}
                  className="w-full py-2 px-3 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-amber-500/30 cursor-pointer"
                >
                  Review Proofs ({stats?.pendingPayments ?? 0})
                </button>
              </div>

              {/* Task 2: Payout claims */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-300">
                    <span>Payout Requests</span>
                    <span className="font-mono text-rose-400 font-bold">{stats?.pendingWithdrawals ?? 0}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Pending withdrawal claims ready for transfer.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('withdrawals')}
                  className="w-full py-2 px-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/30 cursor-pointer"
                >
                  Process Payouts ({stats?.pendingWithdrawals ?? 0})
                </button>
              </div>

              {/* Task 3: Support chat */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-300">
                    <span>Member Inquiries</span>
                    <span className="font-mono text-blue-400 font-bold">{stats?.pendingCustomerMessages ?? 0}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Unread member support messages in live helpdesk.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('support')}
                  className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-blue-500/30 cursor-pointer"
                >
                  Open Helpdesk ({stats?.pendingCustomerMessages ?? 0})
                </button>
              </div>
            </div>
          </div>

          {/* Subscriptions Ratio Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Package Distribution</h3>
              <span className="text-xs font-mono text-slate-400 font-bold">{totalPackages} Active Plans</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">One Week (Rs. 500)</span>
                  <span className="font-mono text-slate-400 font-bold">
                    {stats?.activeWeeklyPackages ?? 0} ({weeklyPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${weeklyPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">One Month (Rs. 1,000)</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {stats?.activeMonthlyPackages ?? 0} ({monthlyPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${monthlyPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Audit Trail Snippet */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Audit Trail</h3>
              <button
                onClick={() => onNavigate('audit_logs')}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No recent logs.</div>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-red-400 text-[10px]">{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] line-clamp-2">{log.details}</p>
                    <span className="text-[10px] text-slate-600 block">By: {log.adminName}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <button
              onClick={() => onNavigate('audit_logs')}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Open Complete Audit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
