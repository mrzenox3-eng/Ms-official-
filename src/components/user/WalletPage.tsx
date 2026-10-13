import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Wallet, WithdrawalRecord, WalletTransaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { WithdrawalModal } from './WithdrawalModal';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const WalletPage: React.FC = () => {
  const { wallet: authWallet, refreshUser } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(authWallet);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'transactions'>('withdrawals');
  const [isLoading, setIsLoading] = useState(false);

  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      const summary = await api.getWalletSummary();
      setWallet(summary.wallet);
      setWithdrawals(summary.recentWithdrawals);
      setTransactions(summary.recentTransactions);
    } catch (e) {
      console.error('Failed to load wallet data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const totalAccountBalance = (wallet?.availableBalance || 0) + (wallet?.pendingBalance || 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Financial Overview</span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">My Wallet</h2>
        </div>
        <button
          onClick={fetchWalletData}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          title="Refresh balances"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Primary Balance Cards */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <WalletIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Account Balance</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">PKR / Pakistani Rupee</span>
        </div>

        <div className="mb-6">
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
            Rs. {totalAccountBalance.toLocaleString()}
          </div>
        </div>

        {/* 2 Sub Balances: Available Balance & Pending Balance */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80 mb-6">
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Available Balance</span>
            <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
              Rs. {(wallet?.availableBalance || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Ready for withdrawal</span>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Pending Balance</span>
            <div className="text-lg sm:text-xl font-bold text-amber-400 font-mono">
              Rs. {(wallet?.pendingBalance || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">In verification process</span>
          </div>
        </div>

        {/* WITHDRAW BUTTON */}
        <button
          onClick={() => setIsWithdrawOpen(true)}
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>WITHDRAW</span>
        </button>
      </div>

      {/* Transaction & Withdrawal History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'withdrawals' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Withdrawals
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'transactions' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ledger Logs
            </button>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Real-time DB records</span>
        </div>

        {activeTab === 'withdrawals' ? (
          <div>
            {withdrawals.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No withdrawal requests found yet.</p>
                <span className="text-[10px] text-slate-500">Your requested payouts will appear here.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => {
                  const statusDisplay = {
                    successful: {
                      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
                      label: 'Successful',
                    },
                    rejected: {
                      badge: 'bg-red-500/10 text-red-400 border-red-500/20',
                      icon: <XCircle className="w-3.5 h-3.5 text-red-400" />,
                      label: 'Rejected',
                    },
                    pending: {
                      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
                      label: 'Pending',
                    },
                  }[w.status];

                  return (
                    <div
                      key={w.id}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono">{w.id}</span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusDisplay.badge}`}
                          >
                            {statusDisplay.icon}
                            <span>{statusDisplay.label}</span>
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{w.method}</span>
                          <span>·</span>
                          <span className="font-mono">{w.phone}</span>
                          <span>·</span>
                          <span>{new Date(w.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                        <div className="text-base font-bold text-white font-mono">
                          Rs. {w.amount.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {transactions.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No ledger transactions yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{tx.reason}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString()} · {tx.id}
                        {tx.adminName && ` · Admin: ${tx.adminName}`}
                      </div>
                    </div>
                    <div
                      className={`font-mono font-bold ${
                        tx.type === 'credit' ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'} Rs. {tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Withdrawal Form Modal */}
      {isWithdrawOpen && wallet && (
        <WithdrawalModal
          wallet={wallet}
          onClose={() => setIsWithdrawOpen(false)}
          onSuccess={() => {
            fetchWalletData();
            refreshUser();
          }}
        />
      )}
    </div>
  );
};
