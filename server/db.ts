import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  referralCode: string;
  referredBy: string | null;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserCredentials {
  userId: string;
  passwordHash: string;
  salt: string;
  isGoogleAuth?: boolean;
}

export interface AdminCredentials {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  status: 'active' | 'suspended';
}

export interface PackageDefinition {
  id: 'weekly' | 'monthly';
  name: string;
  price: number;
  durationDays: number;
  inviteLimit: number;
  screenshotLimit: number;
  bonusPercentage: number;
  description: string;
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
  approvedBy?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'not_checked_in' | 'checked_in' | 'checked_out';
  updatedAt: string;
}

export interface ReferralRecord {
  id: string;
  inviterId: string;
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  status: 'pending' | 'active';
  bonusEarned: number;
  createdAt: string;
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

export interface Wallet {
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
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

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUser: string | null;
  details: string;
  timestamp: string;
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

export interface DailyUsage {
  userId: string;
  date: string; // YYYY-MM-DD
  invitesCount: number;
  screenshotsCount: number;
}

export interface Session {
  token: string;
  userId: string;
  role: 'user' | 'admin';
  createdAt: number;
  expiresAt: number;
}

export interface DomainSettings {
  customDomain: string;
  useHttps: boolean;
  subdomainAdmin: string;
  subdomainApp: string;
}

export interface DatabaseSchema {
  users: User[];
  userCredentials: UserCredentials[];
  adminCredentials: AdminCredentials[];
  packages: PackageDefinition[];
  userPackages: UserPackage[];
  attendance: AttendanceRecord[];
  referrals: ReferralRecord[];
  screenshots: ScreenshotSubmission[];
  wallets: Record<string, Wallet>;
  walletTransactions: WalletTransaction[];
  withdrawals: WithdrawalRecord[];
  supportMessages: SupportMessage[];
  adminAuditLogs: AdminAuditLog[];
  paymentSettings: PaymentSettings;
  packageSettings: PackageSettings;
  domainSettings: DomainSettings;
  dailyUsage: DailyUsage[];
  sessions: Session[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Password utility
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return computed === hash;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getTodayDateStr(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Generate default QR SVG as data URI
function generateSampleQrSvg(title: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" fill="#090d16" rx="16"/>
    <rect x="20" y="20" width="50" height="50" fill="none" stroke="#10b981" stroke-width="8" rx="8"/>
    <rect x="35" y="35" width="20" height="20" fill="#10b981"/>
    <rect x="130" y="20" width="50" height="50" fill="none" stroke="#10b981" stroke-width="8" rx="8"/>
    <rect x="145" y="35" width="20" height="20" fill="#10b981"/>
    <rect x="20" y="130" width="50" height="50" fill="none" stroke="#10b981" stroke-width="8" rx="8"/>
    <rect x="35" y="145" width="20" height="20" fill="#10b981"/>
    <rect x="85" y="30" width="12" height="12" fill="#34d399"/>
    <rect x="105" y="45" width="12" height="25" fill="#34d399"/>
    <rect x="85" y="85" width="30" height="30" fill="#10b981" rx="4"/>
    <rect x="130" y="100" width="15" height="15" fill="#34d399"/>
    <rect x="155" y="125" width="25" height="15" fill="#34d399"/>
    <rect x="90" y="140" width="20" height="35" fill="#34d399"/>
    <rect x="130" y="155" width="40" height="20" fill="#34d399"/>
    <text x="100" y="190" fill="#6ee7b7" font-size="10" font-family="sans-serif" text-anchor="middle">${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
    this.seedDefaults();
    this.checkExpirations();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading database, initializing fresh:', e);
    }

    return this.createEmptySchema();
  }

  private createEmptySchema(): DatabaseSchema {
    return {
      users: [],
      userCredentials: [],
      adminCredentials: [],
      packages: [
        {
          id: 'weekly',
          name: 'One Week',
          price: 500,
          durationDays: 7,
          inviteLimit: 5,
          screenshotLimit: 5,
          bonusPercentage: 10,
          description: 'One-week check-in access, 5 daily invites, 10% referral bonus',
        },
        {
          id: 'monthly',
          name: 'One Month',
          price: 1000,
          durationDays: 30,
          inviteLimit: 10,
          screenshotLimit: 10,
          bonusPercentage: 20,
          description: 'One-month check-in access, 10 daily invites, 20% referral bonus',
        },
      ],
      userPackages: [],
      attendance: [],
      referrals: [],
      screenshots: [],
      wallets: {},
      walletTransactions: [],
      withdrawals: [],
      supportMessages: [],
      adminAuditLogs: [],
      paymentSettings: {
        jazzCash: {
          accountName: 'MS Official Finance',
          accountNumber: '0301-2345678',
          qrCode: generateSampleQrSvg('JAZZCASH OFFICIAL'),
          instructions: 'Send exact package fee to the JazzCash account above, take a screenshot of your successful transaction receipt, and upload it.',
        },
        easypaisa: {
          accountName: 'MS Official Treasury',
          accountNumber: '0345-9876543',
          qrCode: generateSampleQrSvg('EASYPAISA OFFICIAL'),
          instructions: 'Send exact package fee to the Easypaisa account above, take a screenshot of your successful transaction receipt, and upload it.',
        },
      },
      packageSettings: {
        weekly: {
          price: 500,
          inviteLimit: 5,
          screenshotLimit: 5,
          bonusPercentage: 10,
        },
        monthly: {
          price: 1000,
          inviteLimit: 10,
          screenshotLimit: 10,
          bonusPercentage: 20,
        },
      },
      domainSettings: {
        customDomain: 'ais-pre-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app',
        useHttps: true,
        subdomainAdmin: 'admin',
        subdomainApp: 'app',
      },
      dailyUsage: [],
      sessions: [],
    };
  }

  private seedDefaults() {
    // Seed default admin if missing
    const defaultAdmins = [
      { id: 'admin_master_1', email: 'admin@msofficial.com', name: 'Master Administrator' },
      { id: 'admin_master_gmail', email: 'admin@gmail.com', name: 'Admin Console' },
      { id: 'admin_developer', email: 'developeralihusnain@gmail.com', name: 'Developer Admin' },
    ];

    let changed = false;
    for (const def of defaultAdmins) {
      const existing = this.data.adminCredentials.find(
        (a) => a.email.toLowerCase() === def.email.toLowerCase()
      );
      if (!existing) {
        const { hash, salt } = hashPassword('admin123456');
        this.data.adminCredentials.push({
          id: def.id,
          email: def.email,
          name: def.name,
          passwordHash: hash,
          salt,
          twoFactorEnabled: false,
          status: 'active',
        });
        changed = true;
      } else if (!existing.status) {
        existing.status = 'active';
        changed = true;
      }
    }

    if (changed) {
      this.save();
    }
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (e) {
      console.error('Failed to save database atomically:', e);
    }
  }

  // Routine check for package expiration
  public checkExpirations(): void {
    const now = new Date().toISOString();
    let updated = false;

    this.data.userPackages.forEach((pkg) => {
      if (pkg.status === 'active' && pkg.expiryDate < now) {
        pkg.status = 'expired';
        updated = true;
      }
    });

    if (updated) {
      this.save();
    }
  }

  // Getters
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByPhone(phone: string): User | undefined {
    return this.data.users.find((u) => u.phone === phone);
  }

  public getUserByReferralCode(code: string): User | undefined {
    return this.data.users.find((u) => u.referralCode.toUpperCase() === code.toUpperCase());
  }

  public addUser(user: User, passwordHash: string, salt: string, isGoogleAuth = false): void {
    this.data.users.push(user);
    this.data.userCredentials.push({
      userId: user.id,
      passwordHash,
      salt,
      isGoogleAuth,
    });
    // Initialize wallet
    this.data.wallets[user.id] = {
      userId: user.id,
      availableBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      updatedAt: new Date().toISOString(),
    };
    this.save();
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  public getUserCredentials(userId: string): UserCredentials | undefined {
    return this.data.userCredentials.find((c) => c.userId === userId);
  }

  public getAdminByEmail(email: string): AdminCredentials | undefined {
    return this.data.adminCredentials.find((a) => a.email.toLowerCase() === email.toLowerCase());
  }

  public updateAdminCredentials(id: string, updates: Partial<AdminCredentials>): void {
    const admin = this.data.adminCredentials.find((a) => a.id === id);
    if (admin) {
      Object.assign(admin, updates);
      this.save();
    }
  }

  // Sessions
  public createSession(userId: string, role: 'user' | 'admin', expiresInDays = 7): Session {
    const token = generateToken();
    const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
    const session: Session = {
      token,
      userId,
      role,
      createdAt: Date.now(),
      expiresAt,
    };
    this.data.sessions.push(session);
    // Cleanup expired sessions
    this.data.sessions = this.data.sessions.filter((s) => s.expiresAt > Date.now());
    this.save();
    return session;
  }

  public getSession(token: string): Session | undefined {
    const session = this.data.sessions.find((s) => s.token === token);
    if (session && session.expiresAt > Date.now()) {
      return session;
    }
    return undefined;
  }

  public deleteSession(token: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  // Attendance
  public getAttendanceForToday(userId: string): AttendanceRecord {
    const today = getTodayDateStr();
    let record = this.data.attendance.find((a) => a.userId === userId && a.date === today);
    if (!record) {
      record = {
        id: crypto.randomUUID(),
        userId,
        date: today,
        checkInTime: null,
        checkOutTime: null,
        status: 'not_checked_in',
        updatedAt: new Date().toISOString(),
      };
      this.data.attendance.push(record);
      this.save();
    }
    return record;
  }

  public updateAttendance(record: AttendanceRecord): void {
    const index = this.data.attendance.findIndex((a) => a.id === record.id);
    if (index >= 0) {
      this.data.attendance[index] = record;
    } else {
      this.data.attendance.push(record);
    }
    this.save();
  }

  // Packages
  public getActiveUserPackage(userId: string): UserPackage | undefined {
    this.checkExpirations();
    return this.data.userPackages.find((p) => p.userId === userId && p.status === 'active');
  }

  public getUserPackages(userId: string): UserPackage[] {
    return this.data.userPackages
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllUserPackages(): UserPackage[] {
    this.checkExpirations();
    return this.data.userPackages;
  }

  public addUserPackage(pkg: UserPackage): void {
    this.data.userPackages.push(pkg);
    this.save();
  }

  public updateUserPackage(id: string, updates: Partial<UserPackage>): UserPackage | undefined {
    const pkg = this.data.userPackages.find((p) => p.id === id);
    if (!pkg) return undefined;
    Object.assign(pkg, updates);
    this.save();
    return pkg;
  }

  // Quotas & Daily reset
  public getDailyUsage(userId: string): DailyUsage {
    const today = getTodayDateStr();
    let usage = this.data.dailyUsage.find((u) => u.userId === userId && u.date === today);
    if (!usage) {
      usage = {
        userId,
        date: today,
        invitesCount: 0,
        screenshotsCount: 0,
      };
      this.data.dailyUsage.push(usage);
      this.save();
    }
    return usage;
  }

  public incrementDailyInvites(userId: string): DailyUsage {
    const usage = this.getDailyUsage(userId);
    usage.invitesCount += 1;
    this.save();
    return usage;
  }

  public incrementDailyScreenshots(userId: string): DailyUsage {
    const usage = this.getDailyUsage(userId);
    usage.screenshotsCount += 1;
    this.save();
    return usage;
  }

  // Referrals
  public getReferralsForUser(userId: string): ReferralRecord[] {
    return this.data.referrals.filter((r) => r.inviterId === userId);
  }

  public addReferral(record: ReferralRecord): void {
    this.data.referrals.push(record);
    this.save();
  }

  // Screenshots
  public getScreenshotsForUser(userId: string): ScreenshotSubmission[] {
    return this.data.screenshots
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllScreenshots(): ScreenshotSubmission[] {
    return this.data.screenshots.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public addScreenshot(submission: ScreenshotSubmission): void {
    this.data.screenshots.push(submission);
    this.save();
  }

  public updateScreenshot(id: string, updates: Partial<ScreenshotSubmission>): ScreenshotSubmission | undefined {
    const item = this.data.screenshots.find((s) => s.id === id);
    if (!item) return undefined;
    Object.assign(item, updates);
    this.save();
    return item;
  }

  // Wallet
  public getWallet(userId: string): Wallet {
    if (!this.data.wallets[userId]) {
      this.data.wallets[userId] = {
        userId,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        updatedAt: new Date().toISOString(),
      };
      this.save();
    }
    return this.data.wallets[userId];
  }

  public adjustBalance(
    userId: string,
    amount: number,
    reason: string,
    adminName: string | null = null,
    isPending = false
  ): Wallet {
    const wallet = this.getWallet(userId);
    if (isPending) {
      wallet.pendingBalance += amount;
    } else {
      wallet.availableBalance += amount;
      if (amount > 0) {
        wallet.totalEarned += amount;
      }
    }
    wallet.updatedAt = new Date().toISOString();

    const tx: WalletTransaction = {
      id: `TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      amount: Math.abs(amount),
      type: amount >= 0 ? 'credit' : 'debit',
      reason,
      adminName,
      createdAt: new Date().toISOString(),
    };
    this.data.walletTransactions.push(tx);
    this.save();
    return wallet;
  }

  public getWalletTransactions(userId: string): WalletTransaction[] {
    return this.data.walletTransactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllTransactions(): WalletTransaction[] {
    return this.data.walletTransactions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Withdrawals
  public getWithdrawalsForUser(userId: string): WithdrawalRecord[] {
    return this.data.withdrawals
      .filter((w) => w.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllWithdrawals(): WithdrawalRecord[] {
    return this.data.withdrawals.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public addWithdrawal(rec: WithdrawalRecord): void {
    this.data.withdrawals.push(rec);
    this.save();
  }

  public updateWithdrawal(id: string, updates: Partial<WithdrawalRecord>): WithdrawalRecord | undefined {
    const w = this.data.withdrawals.find((item) => item.id === id);
    if (!w) return undefined;
    Object.assign(w, updates);
    this.save();
    return w;
  }

  // Support Messages
  public getSupportMessagesForUser(userId: string): SupportMessage[] {
    return this.data.supportMessages
      .filter((m) => m.userId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public getAllSupportMessages(): SupportMessage[] {
    return this.data.supportMessages.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public addSupportMessage(msg: SupportMessage): void {
    this.data.supportMessages.push(msg);
    this.save();
  }

  public markMessagesRead(userId: string, sender: 'user' | 'admin'): void {
    this.data.supportMessages.forEach((m) => {
      if (m.userId === userId && m.sender === sender && m.status === 'unread') {
        m.status = 'read';
      }
    });
    this.save();
  }

  // Audit Logs
  public addAuditLog(adminId: string, adminName: string, action: string, details: string, targetUser: string | null = null): void {
    const log: AdminAuditLog = {
      id: `LOG-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      adminId,
      adminName,
      action,
      targetUser,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.adminAuditLogs.push(log);
    this.save();
  }

  public getAuditLogs(): AdminAuditLog[] {
    return this.data.adminAuditLogs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Payment & Package Settings
  public getPaymentSettings(): PaymentSettings {
    return this.data.paymentSettings;
  }

  public updatePaymentSettings(settings: PaymentSettings): void {
    this.data.paymentSettings = settings;
    this.save();
  }

  public getPackageSettings(): PackageSettings {
    return this.data.packageSettings;
  }

  public updatePackageSettings(settings: PackageSettings): void {
    this.data.packageSettings = settings;
    // Keep package definitions in sync
    const weekly = this.data.packages.find((p) => p.id === 'weekly');
    if (weekly) {
      weekly.price = settings.weekly.price;
      weekly.inviteLimit = settings.weekly.inviteLimit;
      weekly.screenshotLimit = settings.weekly.screenshotLimit;
      weekly.bonusPercentage = settings.weekly.bonusPercentage;
    }
    const monthly = this.data.packages.find((p) => p.id === 'monthly');
    if (monthly) {
      monthly.price = settings.monthly.price;
      monthly.inviteLimit = settings.monthly.inviteLimit;
      monthly.screenshotLimit = settings.monthly.screenshotLimit;
      monthly.bonusPercentage = settings.monthly.bonusPercentage;
    }
    this.save();
  }

  // Domain & Deployment Link Settings
  public getDomainSettings(): DomainSettings {
    if (!this.data.domainSettings) {
      this.data.domainSettings = {
        customDomain: 'ais-pre-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app',
        useHttps: true,
        subdomainAdmin: 'admin',
        subdomainApp: 'app',
      };
      this.save();
    }
    return this.data.domainSettings;
  }

  public updateDomainSettings(settings: Partial<DomainSettings>): DomainSettings {
    const current = this.getDomainSettings();
    this.data.domainSettings = {
      ...current,
      ...settings,
    };
    this.save();
    return this.data.domainSettings;
  }
}

export const db = new Database();
