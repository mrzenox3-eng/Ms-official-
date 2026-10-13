import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminDashboard } from './AdminDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminPackages } from './AdminPackages';
import { AdminScreenshots } from './AdminScreenshots';
import { AdminBalances } from './AdminBalances';
import { AdminCustomerService } from './AdminCustomerService';
import { AdminWithdrawals } from './AdminWithdrawals';
import { AdminPaymentSettings } from './AdminPaymentSettings';
import { AdminPackageSettings } from './AdminPackageSettings';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminDeploymentLinks } from './AdminDeploymentLinks';
import { api } from '../../api/client';
import { AdminStats } from '../../types';

export const AdminApp: React.FC = () => {
  const { admin, isLoading } = useAdminAuth();
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const fetchStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchStats();
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [admin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-500 font-mono">
        Verifying administrative session...
      </div>
    );
  }

  if (!admin) {
    return <AdminLogin />;
  }

  const tabTitles: Record<AdminTab, string> = {
    dashboard: 'Administrator Dashboard',
    users: 'User Account Directory',
    packages: 'Package & Verification Operations',
    screenshots: 'User Screenshot Chat Management',
    balances: 'Account Balance & Wallet Terminal',
    support: 'Customer Service Console',
    withdrawals: 'Withdrawal Management (Payouts)',
    payment_settings: 'Payment Account Settings',
    package_settings: 'Package & Benefit Configuration',
    audit_logs: 'Immutable Admin Audit Logs',
    deployment_links: 'Links with Domain & Platform Architecture',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row selection:bg-red-500/30 selection:text-red-200">
      {/* Sidebar with pending badges */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        pendingCounts={{
          payments: stats?.pendingPayments,
          withdrawals: stats?.pendingWithdrawals,
          support: stats?.pendingCustomerMessages,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          currentTabTitle={tabTitles[currentTab]}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onRefreshAll={fetchStats}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && <AdminDashboard onNavigate={setCurrentTab} />}
          {currentTab === 'users' && <AdminUsers />}
          {currentTab === 'packages' && <AdminPackages />}
          {currentTab === 'screenshots' && <AdminScreenshots />}
          {currentTab === 'balances' && <AdminBalances />}
          {currentTab === 'support' && <AdminCustomerService />}
          {currentTab === 'withdrawals' && <AdminWithdrawals />}
          {currentTab === 'payment_settings' && <AdminPaymentSettings />}
          {currentTab === 'package_settings' && <AdminPackageSettings />}
          {currentTab === 'audit_logs' && <AdminAuditLogs />}
          {currentTab === 'deployment_links' && <AdminDeploymentLinks />}
        </main>
      </div>
    </div>
  );
};
