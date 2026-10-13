import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AdminUserListItem, UserPackage, WalletTransaction, WithdrawalRecord, User, Wallet } from '../../types';
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  History,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  Users,
  Shield,
  Download,
  Phone,
  Zap,
  ZapOff,
  Package,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedUserHistory, setSelectedUserHistory] = useState<{
    user: User;
    wallet: Wallet;
    packages: UserPackage[];
    transactions: WalletTransaction[];
    withdrawals: WithdrawalRecord[];
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers(searchTerm, statusFilter);
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, statusFilter]);

  const handleToggleStatus = async (user: AdminUserListItem) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'suspend'} user ${user.name}?`)) {
      return;
    }

    try {
      await api.updateAdminUserStatus(user.id, newStatus);
      setActionFeedback(`User ${user.name} has been ${newStatus}.`);
      setTimeout(() => setActionFeedback(null), 3000);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleViewHistory = async (userId: string) => {
    setHistoryLoading(true);
    try {
      const data = await api.getAdminUserHistory(userId);
      setSelectedUserHistory(data);
    } catch (e) {
      alert('Failed to load user history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTogglePackage = async (
    userId: string,
    packageType: 'weekly' | 'monthly',
    action: 'activate' | 'deactivate'
  ) => {
    try {
      const res = await api.toggleUserPackageDirectly({ userId, packageType, action });
      setActionFeedback(
        action === 'activate'
          ? `Successfully activated ${packageType === 'monthly' ? 'One Month' : 'One Week'} package!`
          : 'User active package has been deactivated.'
      );
      setTimeout(() => setActionFeedback(null), 3500);
      await fetchUsers();
      if (selectedUserHistory && selectedUserHistory.user.id === userId) {
        await handleViewHistory(userId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update package');
    }
  };

  const activeCount = users.filter((u) => u.status === 'active').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;
  const totalBalance = users.reduce((acc, curr) => acc + (curr.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Account Directory</span>
          <h2 className="text-xl font-bold text-white tracking-tight">User Account Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit registered members, inspect financial balances, toggle account statuses, and review ledger histories.
          </p>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Desktop Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Members</span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">{activeCount}</div>
            <span className="text-[10px] text-slate-500">Accounts in good standing</span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Suspended Members</span>
            <div className="text-xl font-extrabold text-red-400 font-mono mt-1">{suspendedCount}</div>
            <span className="text-[10px] text-slate-500">Blocked from check-in & payouts</span>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cumulative Balances</span>
            <div className="text-xl font-extrabold text-white font-mono mt-1">
              Rs. {totalBalance.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Across {users.length} registered members</span>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by Name, Email, Phone, or User ID..."
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
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Active Plan</th>
                <th className="py-3.5 px-4 text-right">Available Balance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {u.id.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-400">
                        <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{u.phone || 'No phone set'}</span>
                      </div>
                      {u.phone && (
                        <a
                          href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '').replace(/^0/, '92')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-slate-400 hover:text-emerald-300 font-mono inline-block mt-0.5 underline transition-colors"
                          title="Open WhatsApp chat with this real number"
                        >
                          WhatsApp Direct
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.package === 'One Month'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : u.package === 'One Week'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>{u.package}</span>
                        </span>

                        {u.package !== 'None' ? (
                          <button
                            onClick={() =>
                              handleTogglePackage(
                                u.id,
                                u.package === 'One Month' ? 'monthly' : 'weekly',
                                'deactivate'
                              )
                            }
                            className="px-2 py-0.5 rounded-md bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 hover:text-white text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Deactivate package membership for this user"
                          >
                            <ZapOff className="w-2.5 h-2.5" />
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleTogglePackage(u.id, 'weekly', 'activate')}
                              className="px-2 py-0.5 rounded-md bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                              title="Activate One Week (7 Days) Package"
                            >
                              + 7 Days
                            </button>
                            <button
                              onClick={() => handleTogglePackage(u.id, 'monthly', 'activate')}
                              className="px-2 py-0.5 rounded-md bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 text-amber-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                              title="Activate One Month (30 Days) Package"
                            >
                              + 30 Days
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      Rs. {u.balance.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          u.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleViewHistory(u.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="View Complete User History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-red-950/40 hover:bg-red-900 text-red-400'
                              : 'bg-emerald-950/40 hover:bg-emerald-900 text-emerald-400'
                          }`}
                          title={u.status === 'active' ? 'Suspend User' : 'Activate User'}
                        >
                          {u.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User History Modal */}
      {selectedUserHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative my-8 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedUserHistory(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
                Full Account Audit
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {selectedUserHistory.user.name} ({selectedUserHistory.user.email})
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs font-mono">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                  <Phone className="w-3 h-3" />
                  Real Phone: {selectedUserHistory.user.phone || 'None'}
                </span>
                <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                  Referral: {selectedUserHistory.user.referralCode}
                </span>
              </div>
            </div>

            {/* Balances summary */}
            <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Available Balance</span>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  Rs. {selectedUserHistory.wallet.availableBalance.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Pending Balance</span>
                <div className="text-base font-bold text-amber-400 font-mono">
                  Rs. {selectedUserHistory.wallet.pendingBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Scrollable tables */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Package Subscriptions & Status</span>
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => handleTogglePackage(selectedUserHistory.user.id, 'weekly', 'activate')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer"
                      title="Directly activate One Week (7 Days) Package"
                    >
                      + Activate One Week
                    </button>
                    <button
                      onClick={() => handleTogglePackage(selectedUserHistory.user.id, 'monthly', 'activate')}
                      className="px-2.5 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                      title="Directly activate One Month (30 Days) Package"
                    >
                      + Activate One Month
                    </button>
                    {selectedUserHistory.packages.some((p) => p.status === 'active') && (
                      <button
                        onClick={() =>
                          handleTogglePackage(
                            selectedUserHistory.user.id,
                            'monthly',
                            'deactivate'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Deactivate currently active package"
                      >
                        <ZapOff className="w-3 h-3" />
                        <span>Deactivate Active</span>
                      </button>
                    )}
                  </div>
                </div>

                {selectedUserHistory.packages.length === 0 ? (
                  <p className="text-xs text-slate-500 py-1">No package subscriptions recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedUserHistory.packages.map((p) => (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-xl border text-xs flex justify-between items-center ${
                          p.status === 'active'
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-white mr-2">{p.packageName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            via {p.paymentMethod} · {new Date(p.startDate).toLocaleDateString()} to {new Date(p.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {p.status.toUpperCase()}
                          </span>
                          {p.status === 'active' && (
                            <button
                              onClick={() =>
                                handleTogglePackage(
                                  selectedUserHistory.user.id,
                                  p.packageId,
                                  'deactivate'
                                )
                              }
                              className="px-2 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-[10px] font-semibold cursor-pointer"
                              title="Deactivate this package"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-300 mb-2">Withdrawals History</h4>
                {selectedUserHistory.withdrawals.length === 0 ? (
                  <p className="text-xs text-slate-500">No withdrawals made.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedUserHistory.withdrawals.map((w) => (
                      <div key={w.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between">
                        <div>
                          <span className="font-semibold text-white">Rs. {w.amount.toLocaleString()} ({w.method})</span>
                          <span className="text-[10px] text-slate-500 ml-2 font-mono">{w.id}</span>
                        </div>
                        <span className="font-mono text-amber-400 font-bold">{w.status.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-300 mb-2">Ledger Adjustments</h4>
                {selectedUserHistory.transactions.length === 0 ? (
                  <p className="text-xs text-slate-500">No transactions recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedUserHistory.transactions.map((t) => (
                      <div key={t.id} className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center">
                        <div>
                          <span className="text-slate-300">{t.reason}</span>
                          <span className="text-[10px] text-slate-500 ml-2 font-mono">{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`font-mono font-bold ${t.type === 'credit' ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {t.type === 'credit' ? '+' : '-'} Rs. {t.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
