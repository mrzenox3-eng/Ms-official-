import {
  User,
  Wallet,
  UserPackage,
  DailyUsage,
  AttendanceStatus,
  PackageOffer,
  PaymentSettings,
  PackageSettings,
  ReferralStats,
  ScreenshotSubmission,
  WalletTransaction,
  WithdrawalRecord,
  SupportMessage,
  AdminStats,
  AdminUserListItem,
  AdminAuditLog,
} from '../types';

class ApiClient {
  private getUserToken(): string | null {
    return localStorage.getItem('ms_user_token');
  }

  private getAdminToken(): string | null {
    return localStorage.getItem('ms_admin_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, isAdmin = false): Promise<T> {
    const token = isAdmin ? this.getAdminToken() : this.getUserToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Server request failed');
    }

    return data as T;
  }

  // --- USER AUTH ---
  async register(params: { name: string; email: string; phone: string; referralCode?: string }) {
    return this.request<{ success: boolean; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async updatePhoneNumber(phone: string) {
    return this.request<{ success: boolean; message: string; phone: string }>('/user/update-phone', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async login(params: { email?: string; phone?: string }) {
    return this.request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async googleAuth(params: { email: string; name?: string; phone?: string }) {
    return this.request<{ success: boolean; token: string; user: User }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getMe() {
    return this.request<{
      user: User;
      wallet: Wallet;
      activePackage: UserPackage | null;
      dailyUsage: DailyUsage;
    }>('/auth/me');
  }

  async logout() {
    try {
      await this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('ms_user_token');
    }
  }

  async resetPassword(email: string) {
    return this.request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // --- ATTENDANCE ---
  async getTodayAttendance() {
    return this.request<AttendanceStatus>('/attendance/today');
  }

  async checkIn() {
    return this.request<{ success: boolean; message: string; record: any }>('/attendance/check-in', {
      method: 'POST',
    });
  }

  async checkOut() {
    return this.request<{ success: boolean; message: string; record: any }>('/attendance/check-out', {
      method: 'POST',
    });
  }

  // --- PACKAGES ---
  async getAvailablePackages() {
    return this.request<{ weekly: PackageOffer; monthly: PackageOffer }>('/packages/available');
  }

  async getPaymentDetails() {
    return this.request<PaymentSettings>('/packages/payment-details');
  }

  async getMyPackages() {
    return this.request<{ activePackage: UserPackage | null; history: UserPackage[] }>('/packages/my');
  }

  async purchasePackage(params: {
    packageId: 'weekly' | 'monthly';
    paymentMethod: 'JazzCash' | 'Easypaisa';
    senderAccountName: string;
    senderPhone: string;
    transactionProofUrl: string;
  }) {
    return this.request<{ success: boolean; message: string; package: UserPackage }>('/packages/purchase', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async quickActivatePackage(packageId: 'weekly' | 'monthly' = 'monthly') {
    return this.request<{ success: boolean; message: string; package: UserPackage }>('/packages/quick-activate', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    });
  }

  async instantBuyPackage(packageId: 'weekly' | 'monthly' = 'monthly') {
    return this.quickActivatePackage(packageId);
  }

  // --- REFERRALS & SCREENSHOTS ---
  async getReferralStats() {
    return this.request<ReferralStats>('/referrals/stats');
  }

  async trackInviteClick() {
    return this.request<{ success: boolean; invitesUsed: number; limit: number }>('/referrals/track-click', {
      method: 'POST',
    });
  }

  async submitScreenshot(params: { friendName: string; imageUrl: string; message?: string }) {
    return this.request<{ success: boolean; message: string; submission: ScreenshotSubmission }>(
      '/referrals/submit-screenshot',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }

  async getMyScreenshots() {
    return this.request<ScreenshotSubmission[]>('/referrals/my-screenshots');
  }

  // --- WALLET & WITHDRAWALS ---
  async getWalletSummary() {
    return this.request<{
      wallet: Wallet;
      recentTransactions: WalletTransaction[];
      recentWithdrawals: WithdrawalRecord[];
    }>('/wallet/summary');
  }

  async getTransactions() {
    return this.request<WalletTransaction[]>('/wallet/transactions');
  }

  async getWithdrawals() {
    return this.request<WithdrawalRecord[]>('/wallet/withdrawals');
  }

  async requestWithdrawal(params: {
    amount: number;
    method: 'JazzCash' | 'Easypaisa';
    accountName: string;
    phone: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      withdrawal: WithdrawalRecord;
      updatedWallet: Wallet;
    }>('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // --- SUPPORT MESSAGES ---
  async getSupportMessages(guestId?: string) {
    const query = guestId ? `?guestId=${encodeURIComponent(guestId)}` : '';
    const headers: Record<string, string> = {};
    if (guestId) {
      headers['x-guest-id'] = guestId;
    }
    return this.request<SupportMessage[]>(`/support/messages${query}`, { headers });
  }

  async sendSupportMessage(params: {
    message: string;
    attachment?: string;
    guestId?: string;
    guestName?: string;
  }) {
    const headers: Record<string, string> = {};
    if (params.guestId) {
      headers['x-guest-id'] = params.guestId;
    }
    return this.request<{ success: boolean; message: SupportMessage; userId?: string }>('/support/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
  }

  // ====================================================
  // ADMIN API CALLS
  // ====================================================

  async adminLogin(params: { email: string; password: string; twoFactorCode?: string; enable2FA?: boolean }) {
    return this.request<{ success: boolean; token: string; admin: { id: string; name: string; email: string } }>(
      '/admin/login',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }

  async getAdminMe() {
    return this.request<{ admin: { id: string; name: string; email: string } }>('/admin/me', {}, true);
  }

  async adminLogout() {
    try {
      await this.request<{ success: boolean }>('/admin/logout', { method: 'POST' }, true);
    } finally {
      localStorage.removeItem('ms_admin_token');
    }
  }

  async getAdminStats() {
    return this.request<AdminStats>('/admin/stats', {}, true);
  }

  async getAdminUsers(search?: string, status?: string) {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (status) q.set('status', status);
    return this.request<AdminUserListItem[]>(`/admin/users?${q.toString()}`, {}, true);
  }

  async updateAdminUserStatus(id: string, status: 'active' | 'suspended') {
    return this.request<{ success: boolean; user: User }>(
      `/admin/users/${id}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ status }),
      },
      true
    );
  }

  async getAdminUserHistory(id: string) {
    return this.request<{
      user: User;
      wallet: Wallet;
      packages: UserPackage[];
      transactions: WalletTransaction[];
      withdrawals: WithdrawalRecord[];
    }>(`/admin/users/${id}/history`, {}, true);
  }

  async getAdminPackageRequests() {
    return this.request<
      Array<
        UserPackage & {
          userName: string;
          userEmail: string;
          userPhone: string;
        }
      >
    >('/admin/packages/requests', {}, true);
  }

  async approvePackage(packageId: string) {
    return this.request<{ success: boolean; package: UserPackage }>(
      '/admin/packages/approve',
      {
        method: 'POST',
        body: JSON.stringify({ packageId }),
      },
      true
    );
  }

  async rejectPackage(packageId: string, reason?: string) {
    return this.request<{ success: boolean; package: UserPackage }>(
      '/admin/packages/reject',
      {
        method: 'POST',
        body: JSON.stringify({ packageId, reason }),
      },
      true
    );
  }

  async toggleUserPackageDirectly(params: {
    userId: string;
    packageType: 'weekly' | 'monthly';
    action: 'activate' | 'deactivate';
  }) {
    return this.request<{ success: boolean; message?: string; package?: UserPackage }>(
      '/admin/packages/toggle',
      {
        method: 'POST',
        body: JSON.stringify(params),
      },
      true
    );
  }

  async getAdminScreenshots() {
    return this.request<ScreenshotSubmission[]>('/admin/screenshots', {}, true);
  }

  async updateAdminScreenshot(id: string, status: string, reply?: string) {
    return this.request<{ success: boolean; submission: ScreenshotSubmission }>(
      `/admin/screenshots/${id}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ status, reply }),
      },
      true
    );
  }

  async adjustBalance(params: { userId: string; amount: number; action: 'add' | 'remove'; reason: string }) {
    return this.request<{ success: boolean; message: string; wallet: Wallet }>(
      '/admin/balances/adjust',
      {
        method: 'POST',
        body: JSON.stringify(params),
      },
      true
    );
  }

  async getAdminWithdrawals() {
    return this.request<WithdrawalRecord[]>('/admin/withdrawals', {}, true);
  }

  async updateWithdrawalStatus(id: string, status: 'successful' | 'rejected', notes?: string) {
    return this.request<{ success: boolean; withdrawal: WithdrawalRecord; wallet: Wallet }>(
      `/admin/withdrawals/${id}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ status, notes }),
      },
      true
    );
  }

  async getAdminSupportConversations() {
    return this.request<
      Array<{
        userId: string;
        userName: string;
        unreadCount: number;
        lastMessage: SupportMessage;
      }>
    >('/admin/support/conversations', {}, true);
  }

  async getAdminSupportMessages(userId: string) {
    return this.request<SupportMessage[]>(`/admin/support/${userId}/messages`, {}, true);
  }

  async replyAdminSupportMessage(userId: string, message: string, attachment?: string) {
    return this.request<{ success: boolean; message: SupportMessage }>(
      `/admin/support/${userId}/reply`,
      {
        method: 'POST',
        body: JSON.stringify({ message, attachment }),
      },
      true
    );
  }

  async getAdminPaymentSettings() {
    return this.request<PaymentSettings>('/admin/settings/payment', {}, true);
  }

  async updateAdminPaymentSettings(settings: PaymentSettings) {
    return this.request<{ success: boolean; settings: PaymentSettings }>(
      '/admin/settings/payment',
      {
        method: 'POST',
        body: JSON.stringify(settings),
      },
      true
    );
  }

  async getAdminPackageSettings() {
    return this.request<PackageSettings>('/admin/settings/packages', {}, true);
  }

  async updateAdminPackageSettings(settings: PackageSettings) {
    return this.request<{ success: boolean; settings: PackageSettings }>(
      '/admin/settings/packages',
      {
        method: 'POST',
        body: JSON.stringify(settings),
      },
      true
    );
  }

  async getAdminAuditLogs() {
    return this.request<AdminAuditLog[]>('/admin/audit-logs', {}, true);
  }

  async getDeploymentLinks(domain?: string) {
    const query = domain ? `?domain=${encodeURIComponent(domain)}` : '';
    return this.request<{
      activeDomain: string;
      protocol: string;
      userLink: string;
      adminLink: string;
      subdomainAdminLink: string;
      subdomainAppLink: string;
      referralTemplateLink: string;
      packageLink: string;
      attendanceLink: string;
      supportLink: string;
      cloudPreUrl: string;
      cloudDevUrl: string;
      cloudPreAdminUrl: string;
      domainSettings?: {
        customDomain: string;
        useHttps: boolean;
        subdomainAdmin: string;
        subdomainApp: string;
      };
    }>(`/admin/deployment-links${query}`, {}, true);
  }

  async updateDomainSettings(settings: {
    customDomain: string;
    useHttps?: boolean;
    subdomainAdmin?: string;
    subdomainApp?: string;
  }) {
    return this.request<{ success: boolean; settings: any }>(
      '/admin/domain-settings',
      {
        method: 'POST',
        body: JSON.stringify(settings),
      },
      true
    );
  }

  async getPublicDomainLinks() {
    return this.request<{
      activeDomain: string;
      baseUrl: string;
      adminUrl: string;
      referralTemplate: string;
      supportUrl: string;
      msofficialUrl: string;
      msofficialSupportUrl: string;
      msofficial786Url: string;
      msofficial786SupportUrl: string;
      cloudPreUrl: string;
      cloudPreSupportUrl: string;
      availableDomains: Array<{ id: string; name: string; domain: string; baseUrl: string }>;
    }>('/public/domain-links');
  }
}

export const api = new ApiClient();
