export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  status: 'active' | 'suspended';
  createdAt?: string;
}

export interface Wallet {
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  updatedAt: string;
}

export interface UserPackage {
  id: string;
  userId: string;
  packageId: 'weekly' | 'monthly';
  packageName: string;
  price: number;
  startDate: string;
  expiryDate: string;
  status: 'active' | 'pending_verification' | 'expired' | 'rejected';
  paymentMethod: 'JazzCash' | 'Easypaisa';
  senderAccountName: string;
  senderPhone: string;
  transactionProofUrl: string;
  notes?: string;
  createdAt: string;
  approvedAt: string | null;
}

export interface DailyUsage {
  invitesUsed: number;
  invitesLimit: number;
  screenshotsUsed: number;
  screenshotsLimit: number;
}

export interface AttendanceStatus {
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'not_checked_in' | 'checked_in' | 'checked_out';
  withinHours: boolean;
  hoursMessage: string;
  workingWindow: string;
}

export interface PackageOffer {
  id: 'weekly' | 'monthly';
  name: string;
  price: number;
  durationDays: number;
  dailyInvites: number;
  dailyScreenshots: number;
  bonus: number;
  benefits: string[];
}

export interface PaymentSettings {
  jazzCash: {
    accountName: string;
    accountNumber: string;
    qrCode: string;
    instructions: string;
  };
  easypaisa: {
    accountName: string;
    accountNumber: string;
    qrCode: string;
    instructions: string;
  };
}

export interface PackageSettings {
  weekly: {
    price: number;
    inviteLimit: number;
    screenshotLimit: number;
    bonusPercentage: number;
  };
  monthly: {
    price: number;
    inviteLimit: number;
    screenshotLimit: number;
    bonusPercentage: number;
  };
}

export interface ReferralStats {
  referralCode: string;
  bonusPercentage: number;
  totalInvited: number;
  activeReferrals: number;
  pendingReferrals: number;
  earnedBonus: number;
  dailyInvitesUsed: number;
  dailyInviteLimit: number;
  isLimitReached: boolean;
  referralList: Array<{
    id: string;
    invitedUserName: string;
    invitedUserEmail: string;
    status: 'pending' | 'active';
    bonusEarned: number;
    createdAt: string;
  }>;
}

export interface ScreenshotSubmission {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  friendName: string;
  imageUrl: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'resolved';
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  adminName: string | null;
  createdAt: string;
}

export interface WithdrawalRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: 'JazzCash' | 'Easypaisa';
  accountName: string;
  phone: string;
  status: 'pending' | 'successful' | 'rejected';
  adminId: string | null;
  adminNotes: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface SupportMessage {
  id: string;
  userId: string;
  userName: string;
  sender: 'user' | 'admin';
  message: string;
  attachment: string | null;
  status: 'unread' | 'read' | 'resolved';
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  activeWeeklyPackages: number;
  activeMonthlyPackages: number;
  pendingPayments: number;
  pendingWithdrawals: number;
  successfulWithdrawals: number;
  totalBalance: number;
  pendingCustomerMessages: number;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'suspended';
  referralCode: string;
  createdAt: string;
  package: string;
  balance: number;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUser: string | null;
  details: string;
  timestamp: string;
}
