import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { WithdrawalRecord } from '../../types';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  Eye,
  ShieldCheck,
  AlertTriangle,
  ArrowDownToLine,
  Download,
} from 'lucide-react';

export const AdminWithdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmingWithdrawal, setConfirmingWithdrawal] = useState<WithdrawalRecord | null>(null);
  const [processingRef, setProcessingRef] = useState('');

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminWithdrawals();
      setWithdrawals(data);
    } catch (e) {
      console.error('Failed to load withdrawals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleMarkSuccessful = async () => {
    if (!confirmingWithdrawal) return;

    try {
      await api.updateWithdrawalStatus(
        confirmingWithdrawal.id,
        'successful',
        processingRef.trim() || 'Processed by administrator via official gateway'
      );
      setFeedback(`Withdrawal ${confirmingWithdrawal.id} marked as SUCCESSFUL.`);
      setTimeout(() => setFeedback(null), 3500);
      setConfirmingWithdrawal(null);
      setProcessingRef('');
      await fetchWithdrawals();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleReject = async (rec: WithdrawalRecord) => {
    const reason = prompt(
      'Enter reason for rejection (funds will be automatically restored to user available balance):',
      'Account title mismatch or payment returned'
    );
    if (reason === null) return;

    try {
      await api.updateWithdrawalStatus(rec.id, 'rejected', reason);
      setFeedback(`Withdrawal ${rec.id} REJECTED and funds refunded to user available balance.`);
      setTimeout(() => setFeedback(null), 3500);
      await fetchWithdrawals();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const filtered = withdrawals.filter((w) => {
    const matchesSearch =
      w.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.phone?.includes(searchTerm) ||
      w.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.accountName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || w.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const pendingTotal = withdrawals
    .filter((w) => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  const successfulTotal = withdrawals
    .filter((w) => w.status === 'successful')
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Payout Settlement</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Withdrawal Management Terminal</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit member withdrawal claims. Rejection safely refunds funds into the user's available balance, while approval writes verified payouts.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Desktop Metric Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Payout Queue</span>
            <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">
              Rs. {pendingTotal.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">
              {withdrawals.filter((w) => w.status === 'pending').length} orders awaiting processing
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Settled Payouts</span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
              Rs. {successfulTotal.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">
              {withdrawals.filter((w) => w.status === 'successful').length} successful transfers
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Claim Volume</span>
            <div className="text-xl font-extrabold text-white font-mono mt-1">
              {withdrawals.length} Orders
            </div>
            <span className="text-[10px] text-slate-500">All-time ledger withdrawal records</span>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by User, Transaction ID, Phone, or Account Name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="successful">Successful Only</option>
            <option value="rejected">Rejected Only</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="all">All Methods</option>
            <option value="JazzCash">JazzCash</option>
            <option value="Easypaisa">Easypaisa</option>
          </select>
        </div>
      </div>

      {/* High-Density Desktop Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Gateway</th>
                <th className="py-3.5 px-4">Account / Phone</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading payout orders...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No matching withdrawal requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => {
                  const isPending = w.status === 'pending';
                  const statusStyle = {
                    successful: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
                    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse',
                  }[w.status];

                  return (
                    <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{w.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{w.userName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{w.userEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        Rs. {w.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            w.method === 'JazzCash' ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {w.method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium">{w.accountName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{w.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                        {new Date(w.createdAt).toLocaleDateString()}
                        <div className="text-[9px] text-slate-600">
                          {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle}`}>
                          {w.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setConfirmingWithdrawal(w)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Review and mark successful"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark Successful</span>
                            </button>

                            <button
                              onClick={() => handleReject(w)}
                              className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer"
                              title="Reject and restore funds to user wallet"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {w.processedAt ? `Processed: ${new Date(w.processedAt).toLocaleDateString()}` : 'Settled'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setConfirmingWithdrawal(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Payout Verification Confirmation
              </h3>
            </div>

            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              «Confirm this withdrawal has actually been processed?»
            </p>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="text-white font-bold">{confirmingWithdrawal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary:</span>
                <span className="text-white">{confirmingWithdrawal.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Channel / Account:</span>
                <span className="text-white">{confirmingWithdrawal.method} ({confirmingWithdrawal.phone})</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-500">Amount:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  Rs. {confirmingWithdrawal.amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Bank / Gateway Reference Number (Optional)
              </label>
              <input
                type="text"
                value={processingRef}
                onChange={(e) => setProcessingRef(e.target.value)}
                placeholder="e.g. TID-9823101923"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingWithdrawal(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkSuccessful}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-emerald-950/50"
              >
                Confirm & Mark Successful
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
