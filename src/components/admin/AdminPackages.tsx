import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { UserPackage, AdminUserListItem } from '../../types';
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Package,
  Clock,
  Check,
  ShieldCheck,
  Zap,
  ZapOff,
  Crown,
  Layers,
  PlusCircle,
  User as UserIcon,
} from 'lucide-react';

export const AdminPackages: React.FC = () => {
  const [requests, setRequests] = useState<
    Array<UserPackage & { userName: string; userEmail: string; userPhone: string }>
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Manual package activation state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AdminUserListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [manualPackageType, setManualPackageType] = useState<'weekly' | 'monthly'>('weekly');
  const [isActivatingManual, setIsActivatingManual] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminPackageRequests();
      setRequests(data);
    } catch (e) {
      console.error('Failed to load packages:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (packageId: string) => {
    try {
      await api.approvePackage(packageId);
      setActionFeedback('Package payment verified and membership activated.');
      setTimeout(() => setActionFeedback(null), 3500);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async (packageId: string) => {
    const reason = prompt('Enter rejection reason for payment record:', 'Screenshot unverified or invalid transaction');
    if (reason === null) return;

    try {
      await api.rejectPackage(packageId, reason);
      setActionFeedback('Package payment rejected.');
      setTimeout(() => setActionFeedback(null), 3500);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleToggle = async (userId: string, packageType: 'weekly' | 'monthly', action: 'activate' | 'deactivate') => {
    try {
      const res = await api.toggleUserPackageDirectly({ userId, packageType, action });
      setActionFeedback(res.message || `Package ${action}d successfully for user.`);
      setTimeout(() => setActionFeedback(null), 3000);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const openManualModal = async () => {
    setIsManualModalOpen(true);
    try {
      const users = await api.getAdminUsers();
      setAvailableUsers(users);
      if (users.length > 0 && !selectedUserId) {
        setSelectedUserId(users[0].id);
      }
    } catch (e) {
      console.error('Failed to load users for package activation:', e);
    }
  };

  const handleManualActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      alert('Please select a member account to activate package for.');
      return;
    }

    setIsActivatingManual(true);
    try {
      const res = await api.toggleUserPackageDirectly({
        userId: selectedUserId,
        packageType: manualPackageType,
        action: 'activate',
      });
      setActionFeedback(res.message || 'Package successfully activated for user!');
      setTimeout(() => setActionFeedback(null), 3500);
      setIsManualModalOpen(false);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to activate package');
    } finally {
      setIsActivatingManual(false);
    }
  };

  const pendingRequests = requests.filter((p) => p.status === 'pending_verification');
  const activeRequests = requests.filter((p) => p.status === 'active');

  const displayedRequests = requests.filter((p) => {
    const matchesSearch =
      p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userPhone?.includes(searchTerm) ||
      p.packageName?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'pending') {
      return matchesSearch && p.status === 'pending_verification';
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Subscription Terminal</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Package & Verification Operations</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit JazzCash & Easypaisa screenshots, approve pending memberships, or directly override user subscription plans.
          </p>
        </div>

        {/* Header Action & Tab switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={openManualModal}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer"
            title="Directly activate a package for any registered user"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Activate Package for User</span>
          </button>

          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Verification Queue</span>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All Subscriptions</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
                {requests.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Filter and search */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search package records by Member, Email, or Phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
          />
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-400">
          <span>Active Plans: <strong className="text-emerald-400">{activeRequests.length}</strong></span>
          <span>Pending: <strong className="text-amber-400">{pendingRequests.length}</strong></span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Selected Plan</th>
                <th className="py-3.5 px-4">Payment Channel</th>
                <th className="py-3.5 px-4">Sender Details</th>
                <th className="py-3.5 px-4 text-center">Receipt Proof</th>
                <th className="py-3.5 px-4">Validity</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading package records...
                  </td>
                </tr>
              ) : displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No subscriptions found in this view.
                  </td>
                </tr>
              ) : (
                displayedRequests.map((pkg) => {
                  const isPending = pkg.status === 'pending_verification';
                  const isActive = pkg.status === 'active';

                  return (
                    <tr key={pkg.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{pkg.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{pkg.userEmail}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{pkg.userPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-200 block">{pkg.packageName}</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          Rs. {pkg.price.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            pkg.paymentMethod === 'JazzCash' ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {pkg.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-medium">{pkg.senderAccountName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{pkg.senderPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {pkg.transactionProofUrl ? (
                          <button
                            onClick={() => setSelectedProof(pkg.transactionProofUrl)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1 border border-slate-700"
                            title="Inspect screenshot receipt"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] font-bold">Inspect</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px] font-mono">Manual</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        <div>Start: {new Date(pkg.startDate).toLocaleDateString()}</div>
                        <div className="text-emerald-400 font-bold">
                          Exp: {new Date(pkg.expiryDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {pkg.status === 'pending_verification' ? 'PENDING VERIFICATION' : pkg.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleApprove(pkg.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Verify receipt and activate plan"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(pkg.id)}
                              className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer"
                              title="Reject receipt"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            {isActive ? (
                              <button
                                onClick={() => handleToggle(pkg.userId, pkg.packageId, 'deactivate')}
                                className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 rounded text-[10px] font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                                title="Deactivate this active package"
                              >
                                <ZapOff className="w-2.5 h-2.5" />
                                <span>Deactivate</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggle(pkg.userId, pkg.packageId, 'activate')}
                                className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 rounded text-[10px] font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                                title="Activate this package"
                              >
                                <Zap className="w-2.5 h-2.5" />
                                <span>Activate</span>
                              </button>
                            )}
                          </div>
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

      {/* High-Resolution Screenshot Inspector Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedProof(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Payment Audit</span>
              <h3 className="text-base font-bold text-white">Full-Resolution Receipt Proof</h3>
            </div>
            <div className="max-h-[70vh] overflow-y-auto rounded-2xl bg-black flex items-center justify-center p-3 border border-slate-800">
              <img src={selectedProof} alt="Full resolution proof" className="max-h-[65vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* Manual Package Activation Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsManualModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Admin Grant</span>
                <h3 className="text-base font-bold text-white tracking-tight">Activate Package for User</h3>
              </div>
            </div>

            <form onSubmit={handleManualActivate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Select Registered Member
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.email} ({u.phone}) [Active Plan: {u.package}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Package Duration & Plan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setManualPackageType('weekly')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      manualPackageType === 'weekly'
                        ? 'bg-emerald-950/40 border-emerald-500/80 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>One Week Plan</span>
                    </div>
                    <div className="text-sm font-extrabold text-white mt-1">7 Days</div>
                    <div className="text-[10px] text-slate-400">Rs. 500 equivalent</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualPackageType('monthly')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      manualPackageType === 'monthly'
                        ? 'bg-amber-950/40 border-amber-500/80 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" />
                      <span>One Month Plan</span>
                    </div>
                    <div className="text-sm font-extrabold text-white mt-1">30 Days</div>
                    <div className="text-[10px] text-slate-400">Rs. 1,000 equivalent</div>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                <span>Immediate Activation:</span> This directly grants full daily check-in perks, activates Page 2 referral unlocking, and sets expiry in the database.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActivatingManual}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isActivatingManual ? 'Activating...' : 'CONFIRM ACTIVATION'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
