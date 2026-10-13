import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AdminUserListItem, WalletTransaction } from '../../types';
import {
  Search,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldAlert,
  Wallet,
  ArrowRight,
  TrendingUp,
  History,
} from 'lucide-react';

export const AdminBalances: React.FC = () => {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [allTransactions, setAllTransactions] = useState<WalletTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [actionType, setActionType] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState<string>('1000');
  const [reason, setReason] = useState('Referral Bonus');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await api.getAdminUsers(searchTerm);
      setUsers(data);
      if (!selectedUser && data.length > 0) {
        setSelectedUser(data[0]);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const quickAmounts = [500, 1000, 2500, 5000, 10000];
  const auditReasons = [
    'Referral Bonus',
    'Daily Attendance Bonus',
    'Special Campaign Reward',
    'Customer Service Compensation',
    'Manual Correction / Reconciliation',
  ];

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount in Rs.');
      return;
    }
    if (!reason.trim()) {
      setError('Please select or provide a mandatory audit reason');
      return;
    }

    if (actionType === 'remove' && selectedUser.balance < numAmount) {
      setError(`Cannot deduct Rs. ${numAmount}. User only has Rs. ${selectedUser.balance} available.`);
      return;
    }

    const confirmMsg = `«Confirm Balance Adjustment»\n\nAction: ${actionType.toUpperCase()} Rs. ${numAmount.toLocaleString()}\nTarget: ${selectedUser.name} (${selectedUser.email})\nReason: ${reason}`;
    if (!confirm(confirmMsg)) return;

    setIsSubmitting(true);
    try {
      const res = await api.adjustBalance({
        userId: selectedUser.id,
        amount: numAmount,
        action: actionType,
        reason: reason.trim(),
      });

      setFeedback(`Balance adjusted successfully. New Available Balance: Rs. ${res.wallet.availableBalance.toLocaleString()}`);
      setTimeout(() => setFeedback(null), 3500);
      await fetchUsers();
      // Update local selection
      setSelectedUser((prev) => (prev ? { ...prev, balance: res.wallet.availableBalance } : null));
    } catch (err: any) {
      setError(err.message || 'Balance adjustment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedBalance = selectedUser
    ? actionType === 'add'
      ? selectedUser.balance + (parseFloat(amount) || 0)
      : Math.max(0, selectedUser.balance - (parseFloat(amount) || 0))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Institutional Ledger</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Account Balance & Wallet Terminal</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Credit and debit member accounts with instant mathematical simulation, audit tracking, and immutable transaction creation.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Desktop 2-column Ledger Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 of 12): Quick Adjustment Terminal */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-red-400" />
                <span>Balance Adjustment Terminal</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-400">PKR Ledger</span>
            </div>

            {selectedUser ? (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Target Member:</span>
                  <span className="font-bold text-white">{selectedUser.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-3 font-mono">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-300">{selectedUser.email}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Current Balance</span>
                    <div className="text-sm font-bold text-slate-200 font-mono">
                      Rs. {selectedUser.balance.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Simulated Balance</span>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      Rs. {calculatedBalance.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-500 mb-4 text-center">
                Select a user from the directory on the right.
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              {/* Action type switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActionType('add')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    actionType === 'add'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Credit (+ Add)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('remove')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    actionType === 'remove'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Debit (− Remove)</span>
                </button>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Amount in PKR (Rs.)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base font-bold text-white font-mono placeholder-slate-600 focus:outline-none focus:border-red-500"
                />

                {/* Quick amount chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(q.toString())}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-800 cursor-pointer"
                    >
                      +{q.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audit reason selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Audit Reason (Mandatory)
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 mb-2 cursor-pointer"
                >
                  {auditReasons.map((r, i) => (
                    <option key={i} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Or type custom reason..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedUser}
                className={`w-full py-3.5 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer ${
                  actionType === 'add'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                    : 'bg-red-600 hover:bg-red-500 shadow-red-950/40'
                }`}
              >
                <span>
                  {isSubmitting
                    ? 'Executing Adjustment...'
                    : `Execute ${actionType === 'add' ? 'Credit' : 'Debit'} of Rs. ${amount || '0'}`}
                </span>
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Adjustment is recorded permanently in the immutable audit trail.</span>
          </div>
        </div>

        {/* Right Column (7 of 12): Member Search & Select Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Select Member to Adjust</h3>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter users..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3 text-right">Available Balance</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {users.map((u) => {
                    const isSelected = selectedUser?.id === u.id;
                    return (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-red-950/20 border-l-2 border-red-500' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white">{u.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {u.id.slice(0, 8)}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{u.phone}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          Rs. {u.balance.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isSelected
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isSelected ? 'Active Target' : 'Select'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
