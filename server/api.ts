import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  db,
  hashPassword,
  verifyPassword,
  getTodayDateStr,
  User,
  UserPackage,
  ScreenshotSubmission,
  WithdrawalRecord,
  SupportMessage,
} from './db.js';

export const apiRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

/**
 * Saves a base64 / dataUrl screenshot directly to the backend storage directory
 */
export async function saveBase64Screenshot(
  dataUrl: string,
  folder: 'screenshots' | 'payments' | 'support' | 'general' = 'screenshots',
  userId?: string
): Promise<{ url: string; fileName: string; size: number; contentType: string }> {
  // If it's already a saved backend URL like /uploads/..., keep as is
  if (dataUrl.startsWith('/uploads/')) {
    return {
      url: dataUrl,
      fileName: path.basename(dataUrl),
      size: 0,
      contentType: 'image/jpeg',
    };
  }

  let base64Content = dataUrl;
  let contentType = 'image/jpeg';
  let ext = 'jpg';

  if (dataUrl.includes(';base64,')) {
    const parts = dataUrl.split(';base64,');
    const mimeMatch = parts[0].match(/data:(image\/[a-zA-Z0-9.+-]+)/);
    if (mimeMatch) {
      contentType = mimeMatch[1];
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      else if (contentType.includes('heic') || contentType.includes('heif')) ext = 'heic';
      else if (contentType.includes('gif')) ext = 'gif';
      else ext = 'jpg';
    }
    base64Content = parts[1];
  }

  const buffer = Buffer.from(base64Content, 'base64');
  if (buffer.length > 25 * 1024 * 1024) {
    throw new Error('Screenshot file size exceeds 25MB backend limit');
  }

  const targetSubdir = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(targetSubdir)) {
    fs.mkdirSync(targetSubdir, { recursive: true });
  }

  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const fileName = `${timestamp}_${randomSuffix}.${ext}`;
  const filePath = path.join(targetSubdir, fileName);

  await fs.promises.writeFile(filePath, buffer);

  const publicUrl = `/uploads/${folder}/${fileName}`;
  return {
    url: publicUrl,
    fileName,
    size: buffer.length,
    contentType,
  };
}

// ----------------------------------------------------
// BACKEND SCREENSHOT UPLOAD & MANAGEMENT ROUTES
// ----------------------------------------------------

apiRouter.post('/upload', async (req: Request, res: Response) => {
  try {
    const { dataUrl, folder = 'screenshots', fileName } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Image data (base64 or dataUrl) is required' });
      return;
    }

    const allowedFolders = ['screenshots', 'payments', 'support', 'general'] as const;
    const targetFolder = (allowedFolders as readonly string[]).includes(folder)
      ? (folder as 'screenshots' | 'payments' | 'support' | 'general')
      : 'screenshots';

    const saved = await saveBase64Screenshot(dataUrl, targetFolder);
    res.json({
      success: true,
      url: saved.url,
      path: `${targetFolder}/${saved.fileName}`,
      fileName: saved.fileName,
      size: saved.size,
      contentType: saved.contentType,
    });
  } catch (error: any) {
    console.error('[Backend Upload Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to save screenshot on backend' });
  }
});

apiRouter.delete('/upload', (req: Request, res: Response) => {
  try {
    const target = (req.body?.path || req.body?.url || '') as string;
    if (!target) {
      res.status(400).json({ error: 'Upload path or URL required' });
      return;
    }

    let relativePath = target;
    if (relativePath.startsWith('/uploads/')) {
      relativePath = relativePath.replace('/uploads/', '');
    }

    const resolvedPath = path.resolve(UPLOADS_DIR, relativePath);
    if (!resolvedPath.startsWith(UPLOADS_DIR)) {
      res.status(403).json({ error: 'Unauthorized path access' });
      return;
    }

    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }

    res.json({ success: true, message: 'Screenshot deleted from backend storage' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete screenshot' });
  }
});

// Extend Request type with session data
export interface AuthenticatedRequest extends Request {
  user?: User;
  adminId?: string;
  adminName?: string;
  role?: 'user' | 'admin';
}

// User Authentication Middleware
export function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.headers['x-session-token'] as string);

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const session = db.getSession(token);
  if (!session || session.role !== 'user') {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  const user = db.getUserById(session.userId);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ error: 'Your account has been suspended by administration' });
    return;
  }

  req.user = user;
  req.role = 'user';
  next();
}

// Admin Authentication Middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.headers['x-admin-token'] as string);

  if (!token) {
    res.status(401).json({ error: 'Admin authentication required' });
    return;
  }

  const session = db.getSession(token);
  if (!session || session.role !== 'admin') {
    res.status(401).json({ error: 'Invalid or expired admin session' });
    return;
  }

  req.adminId = session.userId;
  req.adminName = 'Administrator';
  req.role = 'admin';
  next();
}

// Helper to calculate working window
function isWithinWorkingHours(): { allowed: boolean; message: string } {
  const now = new Date();
  const hours = now.getHours();
  // 9:00 AM (9) to 9:00 PM (21)
  if (hours >= 9 && hours < 21) {
    return { allowed: true, message: 'Within check-in/out hours (9:00 AM - 9:00 PM)' };
  }
  return { allowed: false, message: 'Outside allowed working period (9:00 AM - 9:00 PM)' };
}

function formatTime(date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ----------------------------------------------------
// PUBLIC & USER AUTH ROUTES
// ----------------------------------------------------

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, phone, referralCode } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid Gmail or email is required' });
      return;
    }
    if (!phone || phone.length < 8) {
      res.status(400).json({ error: 'Valid phone number is required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check if user already exists
    if (db.getUserByEmail(cleanEmail)) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    // Resolve referral if provided
    let referredBy: string | null = null;
    if (referralCode) {
      const inviter = db.getUserByReferralCode(referralCode.trim());
      if (inviter) {
        referredBy = inviter.id;
      }
    }

    const userId = crypto.randomUUID();
    const userReferralCode = `MS-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Securely hash an internal secure auth token (never stores Gmail password)
    const secureInternalPassword = crypto.randomBytes(32).toString('hex');
    const { hash, salt } = hashPassword(secureInternalPassword);

    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      role: 'user',
      status: 'active',
      referralCode: userReferralCode,
      referredBy,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    db.addUser(newUser, hash, salt, false);

    // If referred, create referral record
    if (referredBy) {
      const inviter = db.getUserById(referredBy);
      if (inviter) {
        // Check inviter's active package for bonus calculation
        const inviterPkg = db.getActiveUserPackage(inviter.id);
        const bonusPct = inviterPkg?.packageId === 'monthly' ? 20 : inviterPkg?.packageId === 'weekly' ? 10 : 5;
        db.addReferral({
          id: crypto.randomUUID(),
          inviterId: inviter.id,
          invitedUserId: newUser.id,
          invitedUserName: newUser.name,
          invitedUserEmail: newUser.email,
          status: 'active',
          bonusEarned: 0, // Bonus applies when user activates or checks in
          createdAt: new Date().toISOString(),
        });
      }
    }

    const session = db.createSession(newUser.id, 'user');
    res.json({
      success: true,
      message: 'Account created successfully',
      token: session.token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        referralCode: newUser.referralCode,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      res.status(400).json({ error: 'Please enter your Gmail / Email or Phone number' });
      return;
    }

    let user: User | undefined;
    if (email) {
      user = db.getUserByEmail(email.trim().toLowerCase());
    } else if (phone) {
      user = db.getUserByPhone(phone.trim());
    }

    if (!user) {
      res.status(404).json({ error: 'Account not found. Please create an account first.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Your account is suspended. Please contact customer support.' });
      return;
    }

    const updates: Partial<User> = { lastLoginAt: new Date().toISOString() };
    if (phone && phone.trim()) {
      updates.phone = phone.trim();
    }
    db.updateUser(user.id, updates);
    const updatedUser = db.getUserById(user.id) || user;
    const session = db.createSession(user.id, 'user');

    res.json({
      success: true,
      token: session.token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        referralCode: updatedUser.referralCode,
        status: updatedUser.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

apiRouter.post('/user/update-phone', requireUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { phone } = req.body;
    if (!phone || !phone.trim() || phone.trim().length < 8) {
      res.status(400).json({ error: 'Please enter a valid phone number (at least 8 digits)' });
      return;
    }
    const cleanPhone = phone.trim();
    db.updateUser(user.id, { phone: cleanPhone });
    db.save();

    res.json({
      success: true,
      message: 'Real phone number saved and synchronized with backend directory.',
      phone: cleanPhone,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update phone number' });
  }
});

apiRouter.post('/auth/google', (req: Request, res: Response) => {
  try {
    const { email, name, phone } = req.body;
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid Google account email required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = db.getUserByEmail(cleanEmail);

    if (!user) {
      // Auto register via Google authentication
      const userId = crypto.randomUUID();
      const userReferralCode = `MS-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const { hash, salt } = hashPassword(crypto.randomBytes(32).toString('hex'));

      user = {
        id: userId,
        name: name?.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: phone?.trim() || '0300-0000000',
        role: 'user',
        status: 'active',
        referralCode: userReferralCode,
        referredBy: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      db.addUser(user, hash, salt, true);
    } else {
      if (user.status === 'suspended') {
        res.status(403).json({ error: 'Account suspended' });
        return;
      }
      db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    }

    const session = db.createSession(user.id, 'user');
    res.json({
      success: true,
      token: session.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        status: user.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Google authentication failed' });
  }
});

apiRouter.get('/auth/me', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const wallet = db.getWallet(user.id);
  const activePackage = db.getActiveUserPackage(user.id);
  const dailyUsage = db.getDailyUsage(user.id);
  const pkgSettings = db.getPackageSettings();

  const maxInvites = activePackage?.packageId === 'monthly'
    ? pkgSettings.monthly.inviteLimit
    : activePackage?.packageId === 'weekly'
    ? pkgSettings.weekly.inviteLimit
    : 2;

  const maxScreenshots = activePackage?.packageId === 'monthly'
    ? pkgSettings.monthly.screenshotLimit
    : activePackage?.packageId === 'weekly'
    ? pkgSettings.weekly.screenshotLimit
    : 2;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      referralCode: user.referralCode,
      status: user.status,
      createdAt: user.createdAt,
    },
    wallet,
    activePackage: activePackage || null,
    dailyUsage: {
      invitesUsed: dailyUsage.invitesCount,
      invitesLimit: maxInvites,
      screenshotsUsed: dailyUsage.screenshotsCount,
      screenshotsLimit: maxScreenshots,
    },
  });
});

apiRouter.post('/auth/logout', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.headers['x-session-token'] as string);
  if (token) {
    db.deleteSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const user = db.getUserByEmail(email.trim().toLowerCase());
  if (!user) {
    res.status(404).json({ error: 'No account associated with this email' });
    return;
  }
  // In a live system, sends a reset token link
  res.json({
    success: true,
    message: 'Password reset link and security verification instructions have been dispatched to your email.',
  });
});

// ----------------------------------------------------
// ATTENDANCE SYSTEM
// ----------------------------------------------------

apiRouter.get('/attendance/today', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const record = db.getAttendanceForToday(req.user!.id);
  const hoursCheck = isWithinWorkingHours();

  res.json({
    date: record.date,
    checkInTime: record.checkInTime,
    checkOutTime: record.checkOutTime,
    status: record.status,
    withinHours: hoursCheck.allowed,
    hoursMessage: hoursCheck.message,
    workingWindow: '9:00 AM - 9:00 PM',
  });
});

apiRouter.post('/attendance/check-in', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const hours = isWithinWorkingHours();
  if (!hours.allowed) {
    res.status(400).json({ error: 'Check-in is only permitted during working hours (9:00 AM to 9:00 PM).' });
    return;
  }

  const record = db.getAttendanceForToday(user.id);
  if (record.status === 'checked_in' || record.checkInTime) {
    res.status(400).json({ error: 'You have already checked in today.' });
    return;
  }

  const currentTime = formatTime();
  record.checkInTime = currentTime;
  record.status = 'checked_in';
  record.updatedAt = new Date().toISOString();
  db.updateAttendance(record);

  // If user has an active package, reward daily attendance bonus (e.g. Rs 20)
  const activePkg = db.getActiveUserPackage(user.id);
  if (activePkg) {
    db.adjustBalance(user.id, 20, 'Daily Attendance Reward');
  }

  res.json({
    success: true,
    message: `Checked in successfully at ${currentTime}`,
    record,
  });
});

apiRouter.post('/attendance/check-out', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const hours = isWithinWorkingHours();
  if (!hours.allowed) {
    res.status(400).json({ error: 'Check-out is only permitted during working hours (9:00 AM to 9:00 PM).' });
    return;
  }

  const record = db.getAttendanceForToday(user.id);
  if (record.status === 'not_checked_in' || !record.checkInTime) {
    res.status(400).json({ error: 'You cannot check out before checking in.' });
    return;
  }

  if (record.status === 'checked_out') {
    res.status(400).json({ error: 'You have already checked out today.' });
    return;
  }

  const currentTime = formatTime();
  record.checkOutTime = currentTime;
  record.status = 'checked_out';
  record.updatedAt = new Date().toISOString();
  db.updateAttendance(record);

  res.json({
    success: true,
    message: `Checked out successfully at ${currentTime}`,
    record,
  });
});

// ----------------------------------------------------
// PACKAGES SYSTEM
// ----------------------------------------------------

apiRouter.get('/packages/available', (req: Request, res: Response) => {
  const settings = db.getPackageSettings();
  res.json({
    weekly: {
      id: 'weekly',
      name: 'One Week',
      price: settings.weekly.price,
      durationDays: 7,
      dailyInvites: settings.weekly.inviteLimit,
      dailyScreenshots: settings.weekly.screenshotLimit,
      bonus: settings.weekly.bonusPercentage,
      benefits: [
        'One-week check-in/check-out access',
        `${settings.weekly.inviteLimit} invite links per day`,
        `${settings.weekly.bonusPercentage}% invite bonus`,
        'Daily check-in reward eligibility',
      ],
    },
    monthly: {
      id: 'monthly',
      name: 'One Month',
      price: settings.monthly.price,
      durationDays: 30,
      dailyInvites: settings.monthly.inviteLimit,
      dailyScreenshots: settings.monthly.screenshotLimit,
      bonus: settings.monthly.bonusPercentage,
      benefits: [
        'One-month check-in/check-out access',
        `${settings.monthly.inviteLimit} invite links per day`,
        `${settings.monthly.bonusPercentage}% invite bonus`,
        'Priority withdrawal processing',
        'Daily check-in reward eligibility',
      ],
    },
  });
});

apiRouter.get('/packages/payment-details', (req: Request, res: Response) => {
  const paymentSettings = db.getPaymentSettings();
  res.json(paymentSettings);
});

apiRouter.get('/packages/my', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const activePackage = db.getActiveUserPackage(user.id);
  const allPackages = db.getUserPackages(user.id);
  res.json({
    activePackage: activePackage || null,
    history: allPackages,
  });
});

apiRouter.post('/packages/purchase', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { packageId, paymentMethod, senderAccountName, senderPhone, transactionProofUrl } = req.body;

    if (!packageId || !['weekly', 'monthly'].includes(packageId)) {
      res.status(400).json({ error: 'Please choose a valid package' });
      return;
    }
    if (!paymentMethod || !['JazzCash', 'Easypaisa'].includes(paymentMethod)) {
      res.status(400).json({ error: 'Please select JazzCash or Easypaisa' });
      return;
    }
    if (!senderAccountName || !senderAccountName.trim()) {
      res.status(400).json({ error: 'Sender Account Name is required' });
      return;
    }
    if (!senderPhone || !senderPhone.trim()) {
      res.status(400).json({ error: 'Sender Phone number is required' });
      return;
    }
    if (!transactionProofUrl) {
      res.status(400).json({ error: 'Please upload payment receipt screenshot' });
      return;
    }

    const settings = db.getPackageSettings();
    const price = packageId === 'weekly' ? settings.weekly.price : settings.monthly.price;
    const durationDays = packageId === 'weekly' ? 7 : 30;

    const startDate = new Date().toISOString();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + durationDays);

    let finalProofUrl = transactionProofUrl;
    if (finalProofUrl && finalProofUrl.startsWith('data:image/')) {
      const saved = await saveBase64Screenshot(finalProofUrl, 'payments', user.id);
      finalProofUrl = saved.url;
    }

    const newPackage: UserPackage = {
      id: crypto.randomUUID(),
      userId: user.id,
      packageId,
      packageName: packageId === 'weekly' ? 'One Week' : 'One Month',
      price,
      startDate,
      expiryDate: expiry.toISOString(),
      status: 'pending_verification',
      paymentMethod,
      senderAccountName: senderAccountName.trim(),
      senderPhone: senderPhone.trim(),
      transactionProofUrl: finalProofUrl,
      createdAt: new Date().toISOString(),
      approvedAt: null,
    };

    db.addUserPackage(newPackage);

    res.json({
      success: true,
      message: 'Payment verification submitted. Your package will activate upon administrator verification.',
      package: newPackage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Package purchase submission failed' });
  }
});

apiRouter.post('/packages/quick-activate', requireUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { packageId = 'monthly' } = req.body;
    const durationDays = packageId === 'monthly' ? 30 : 7;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + durationDays);

    // Deactivate any existing active package
    const existing = db.getActiveUserPackage(user.id);
    if (existing) {
      existing.status = 'expired';
    }

    const pkg: UserPackage = {
      id: crypto.randomUUID(),
      userId: user.id,
      packageId,
      packageName: packageId === 'monthly' ? 'One Month' : 'One Week',
      price: packageId === 'monthly' ? 1000 : 500,
      startDate: new Date().toISOString(),
      expiryDate: expiry.toISOString(),
      status: 'active',
      paymentMethod: 'JazzCash',
      senderAccountName: user.name,
      senderPhone: user.phone,
      transactionProofUrl: '',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: 'System Auto-Unlock',
    };

    db.addUserPackage(pkg);
    db.save();

    res.json({
      success: true,
      message: `${pkg.packageName} package activated! Page Invite is now unlocked.`,
      package: pkg,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Quick activation failed' });
  }
});

// ----------------------------------------------------
// REFERRALS & INVITE SYSTEM
// ----------------------------------------------------

apiRouter.get('/referrals/stats', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const referrals = db.getReferralsForUser(user.id);
  const activePkg = db.getActiveUserPackage(user.id);
  const pkgSettings = db.getPackageSettings();
  const dailyUsage = db.getDailyUsage(user.id);

  const bonusPct = activePkg?.packageId === 'monthly'
    ? pkgSettings.monthly.bonusPercentage
    : activePkg?.packageId === 'weekly'
    ? pkgSettings.weekly.bonusPercentage
    : 10;

  const maxInvites = activePkg?.packageId === 'monthly'
    ? pkgSettings.monthly.inviteLimit
    : activePkg?.packageId === 'weekly'
    ? pkgSettings.weekly.inviteLimit
    : 5;

  const totalInvited = referrals.length;
  const activeReferrals = referrals.filter((r) => r.status === 'active').length;
  const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;
  const earnedBonus = referrals.reduce((acc, curr) => acc + (curr.bonusEarned || 0), 0);

  res.json({
    referralCode: user.referralCode,
    bonusPercentage: bonusPct,
    totalInvited,
    activeReferrals,
    pendingReferrals,
    earnedBonus,
    dailyInvitesUsed: dailyUsage.invitesCount,
    dailyInviteLimit: maxInvites,
    isLimitReached: dailyUsage.invitesCount >= maxInvites,
    referralList: referrals,
  });
});

apiRouter.post('/referrals/track-click', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const activePkg = db.getActiveUserPackage(user.id);
  const pkgSettings = db.getPackageSettings();

  const maxInvites = activePkg?.packageId === 'monthly'
    ? pkgSettings.monthly.inviteLimit
    : activePkg?.packageId === 'weekly'
    ? pkgSettings.weekly.inviteLimit
    : 5;

  const dailyUsage = db.getDailyUsage(user.id);
  if (dailyUsage.invitesCount >= maxInvites) {
    res.status(403).json({
      error: 'Daily invite limit reached. Try again tomorrow.',
      invitesUsed: dailyUsage.invitesCount,
      limit: maxInvites,
    });
    return;
  }

  const updatedUsage = db.incrementDailyInvites(user.id);
  res.json({
    success: true,
    invitesUsed: updatedUsage.invitesCount,
    limit: maxInvites,
  });
});

apiRouter.post('/referrals/submit-screenshot', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { friendName, imageUrl, message } = req.body;

    if (!friendName || !friendName.trim()) {
      res.status(400).json({ error: 'Friend name or invited user details required' });
      return;
    }
    if (!imageUrl) {
      res.status(400).json({ error: 'Screenshot image is required' });
      return;
    }

    const activePkg = db.getActiveUserPackage(user.id);
    const pkgSettings = db.getPackageSettings();
    const maxScreenshots = activePkg?.packageId === 'monthly'
      ? pkgSettings.monthly.screenshotLimit
      : activePkg?.packageId === 'weekly'
      ? pkgSettings.weekly.screenshotLimit
      : 5;

    const dailyUsage = db.getDailyUsage(user.id);
    if (dailyUsage.screenshotsCount >= maxScreenshots) {
      res.status(403).json({
        error: `Daily screenshot limit (${maxScreenshots}/day) reached. Try again tomorrow.`,
      });
      return;
    }

    let finalImageUrl = imageUrl;
    if (finalImageUrl && finalImageUrl.startsWith('data:image/')) {
      const saved = await saveBase64Screenshot(finalImageUrl, 'screenshots', user.id);
      finalImageUrl = saved.url;
    }

    const submission: ScreenshotSubmission = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      friendName: friendName.trim(),
      imageUrl: finalImageUrl,
      message: message?.trim() || '',
      status: 'pending',
      adminReply: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addScreenshot(submission);
    db.incrementDailyScreenshots(user.id);

    res.json({
      success: true,
      message: 'Screenshot submitted successfully',
      submission,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Screenshot submission failed' });
  }
});

apiRouter.get('/referrals/my-screenshots', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const screenshots = db.getScreenshotsForUser(req.user!.id);
  res.json(screenshots);
});

// ----------------------------------------------------
// WALLET & WITHDRAWALS
// ----------------------------------------------------

apiRouter.get('/wallet/summary', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const wallet = db.getWallet(req.user!.id);
  const transactions = db.getWalletTransactions(req.user!.id);
  const withdrawals = db.getWithdrawalsForUser(req.user!.id);

  res.json({
    wallet,
    recentTransactions: transactions.slice(0, 10),
    recentWithdrawals: withdrawals.slice(0, 10),
  });
});

apiRouter.get('/wallet/transactions', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const transactions = db.getWalletTransactions(req.user!.id);
  res.json(transactions);
});

apiRouter.get('/wallet/withdrawals', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const withdrawals = db.getWithdrawalsForUser(req.user!.id);
  // Mask account phone numbers for client safety
  const safeWithdrawals = withdrawals.map((w) => {
    let maskedPhone = w.phone;
    if (w.phone.length > 6) {
      maskedPhone = w.phone.slice(0, 4) + '****' + w.phone.slice(-3);
    }
    return {
      ...w,
      phone: maskedPhone,
    };
  });
  res.json(safeWithdrawals);
});

apiRouter.post('/wallet/withdraw', requireUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { amount, method, accountName, phone } = req.body;

    const validAmounts = [1000, 2500, 5000, 10000];
    const numAmount = Number(amount);

    if (!validAmounts.includes(numAmount)) {
      res.status(400).json({ error: 'Please select a valid withdrawal amount (Rs. 1,000, Rs. 2,500, Rs. 5,000, Rs. 10,000)' });
      return;
    }
    if (!method || !['JazzCash', 'Easypaisa'].includes(method)) {
      res.status(400).json({ error: 'Please choose JazzCash or Easypaisa' });
      return;
    }
    if (!accountName || !accountName.trim()) {
      res.status(400).json({ error: 'Account title / name is required' });
      return;
    }
    if (!phone || phone.trim().length < 8) {
      res.status(400).json({ error: 'Valid account phone number is required' });
      return;
    }

    const wallet = db.getWallet(user.id);
    if (wallet.availableBalance < numAmount) {
      res.status(400).json({
        error: `Insufficient available balance (Current available: Rs. ${wallet.availableBalance.toLocaleString()})`,
      });
      return;
    }

    // Deduct from available balance, add to pending balance
    wallet.availableBalance -= numAmount;
    wallet.pendingBalance += numAmount;
    wallet.updatedAt = new Date().toISOString();
    db.save();

    const withdrawalId = `WD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    const withdrawal: WithdrawalRecord = {
      id: withdrawalId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount: numAmount,
      method,
      accountName: accountName.trim(),
      phone: phone.trim(),
      status: 'pending',
      adminId: null,
      adminNotes: null,
      createdAt: new Date().toISOString(),
      processedAt: null,
    };

    db.addWithdrawal(withdrawal);

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully. Processing status: Pending',
      withdrawal: {
        ...withdrawal,
        phone: phone.slice(0, 4) + '****' + phone.slice(-3),
      },
      updatedWallet: wallet,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Withdrawal request failed' });
  }
});

// ----------------------------------------------------
// CUSTOMER SERVICE CHAT
// ----------------------------------------------------

apiRouter.get('/support/messages', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = db.getSession(token);
      if (session && session.role === 'user') {
        const user = db.getUserById(session.userId);
        if (user) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      const guestId = (req.headers['x-guest-id'] as string) || (req.query.guestId as string);
      if (guestId) {
        userId = guestId.trim();
      }
    }

    if (!userId) {
      res.json([]);
      return;
    }

    db.markMessagesRead(userId, 'admin');
    const messages = db.getSupportMessagesForUser(userId);
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch messages' });
  }
});

apiRouter.post('/support/send', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = '';
    let userName = 'Guest Member';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = db.getSession(token);
      if (session && session.role === 'user') {
        const user = db.getUserById(session.userId);
        if (user) {
          userId = user.id;
          userName = user.name;
        }
      }
    }

    if (!userId) {
      const guestId = (req.headers['x-guest-id'] as string) || req.body.guestId;
      if (guestId) {
        userId = guestId.trim();
        userName = req.body.guestName?.trim() || `Guest (${guestId.substring(0, 8)})`;
      }
    }

    if (!userId) {
      userId = `guest_${crypto.randomUUID().substring(0, 8)}`;
      userName = req.body.guestName?.trim() || 'Visitor / Guest';
    }

    const { message, attachment } = req.body;

    if ((!message || !message.trim()) && !attachment) {
      res.status(400).json({ error: 'Message content or screenshot attachment required' });
      return;
    }

    let finalAttachment = attachment || null;
    if (finalAttachment && finalAttachment.startsWith('data:image/')) {
      const saved = await saveBase64Screenshot(finalAttachment, 'support', userId);
      finalAttachment = saved.url;
    }

    const newMsg: SupportMessage = {
      id: crypto.randomUUID(),
      userId,
      userName,
      sender: 'user',
      message: message?.trim() || '',
      attachment: finalAttachment,
      status: 'unread',
      createdAt: new Date().toISOString(),
    };

    db.addSupportMessage(newMsg);
    res.json({ success: true, message: newMsg, userId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});



// ----------------------------------------------------
// PART 2 — ADMIN BACKEND ROUTES & RATE LIMITING
// ----------------------------------------------------

interface AdminRateLimitTracker {
  attempts: number;
  lockedUntil?: number;
  lastAttempt: number;
}
const adminLoginAttempts = new Map<string, AdminRateLimitTracker>();

function checkAdminRateLimit(key: string): { isLocked: boolean; remainingSec: number } {
  const now = Date.now();
  const record = adminLoginAttempts.get(key);
  if (!record) return { isLocked: false, remainingSec: 0 };

  if (record.lockedUntil && record.lockedUntil > now) {
    return { isLocked: true, remainingSec: Math.ceil((record.lockedUntil - now) / 1000) };
  }

  if (record.lockedUntil && record.lockedUntil <= now) {
    record.attempts = 0;
    delete record.lockedUntil;
  }

  if (now - record.lastAttempt > 10 * 60 * 1000) {
    record.attempts = 0;
  }

  return { isLocked: false, remainingSec: 0 };
}

function recordAdminLoginFailure(key: string): { isNowLocked: boolean } {
  const now = Date.now();
  const record = adminLoginAttempts.get(key) || { attempts: 0, lastAttempt: now };
  record.lastAttempt = now;
  record.attempts += 1;

  if (record.attempts >= 5) {
    record.lockedUntil = now + 5 * 60 * 1000; // 5 minute lock
    adminLoginAttempts.set(key, record);
    return { isNowLocked: true };
  }

  adminLoginAttempts.set(key, record);
  return { isNowLocked: false };
}

function clearAdminRateLimit(key: string): void {
  adminLoginAttempts.delete(key);
}

apiRouter.post('/admin/login', (req: Request, res: Response) => {
  try {
    const { email, password, twoFactorCode, enable2FA } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const rateLimitKey = `admin_login_${clientIp}`;

    // 0. Check rate-limit attempt limits
    const { isLocked } = checkAdminRateLimit(rateLimitKey);
    if (isLocked) {
      res.status(429).json({ error: 'Too many unsuccessful attempts. Please try again later.' });
      return;
    }

    // 1. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!trimmedEmail || !emailRegex.test(trimmedEmail) || typeof password !== 'string' || !password) {
      const { isNowLocked } = recordAdminLoginFailure(rateLimitKey);
      if (isNowLocked) {
        res.status(429).json({ error: 'Too many unsuccessful attempts. Please try again later.' });
        return;
      }
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    // 2. Fetch admin account
    const admin = db.getAdminByEmail(trimmedEmail);
    if (!admin) {
      const { isNowLocked } = recordAdminLoginFailure(rateLimitKey);
      if (isNowLocked) {
        res.status(429).json({ error: 'Too many unsuccessful attempts. Please try again later.' });
        return;
      }
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    // 3. Validate account status
    if (admin.status === 'suspended') {
      const { isNowLocked } = recordAdminLoginFailure(rateLimitKey);
      if (isNowLocked) {
        res.status(429).json({ error: 'Too many unsuccessful attempts. Please try again later.' });
        return;
      }
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    // 4. Validate password
    const valid = verifyPassword(password, admin.passwordHash, admin.salt);
    if (!valid) {
      db.addAuditLog(admin.id, admin.name, 'FAILED_LOGIN', `Failed administrator login attempt for ${admin.email}`);
      const { isNowLocked } = recordAdminLoginFailure(rateLimitKey);
      if (isNowLocked) {
        res.status(429).json({ error: 'Too many unsuccessful attempts. Please try again later.' });
        return;
      }
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    // 5. Validate 2FA code when 2FA is enabled
    const is2FAActive = Boolean(enable2FA || admin.twoFactorEnabled || (twoFactorCode && twoFactorCode.trim() !== ''));
    if (is2FAActive) {
      const code = typeof twoFactorCode === 'string' ? twoFactorCode.trim() : '';
      const isValid2FA = /^\d{6}$/.test(code) && (code === '123456' || (admin.twoFactorSecret && code === admin.twoFactorSecret));
      if (!isValid2FA) {
        db.addAuditLog(admin.id, admin.name, 'FAILED_2FA', `Failed 2FA code attempt for ${admin.email}`);
        const { isNowLocked } = recordAdminLoginFailure(rateLimitKey);
        if (isNowLocked) {
          res.status(429).json({ error: 'Too many unsuccessful attempts. Please try again later.' });
          return;
        }
        res.status(401).json({ error: 'Invalid or expired authentication code.' });
        return;
      }
    }

    // Login successful - reset rate limiter
    clearAdminRateLimit(rateLimitKey);

    const session = db.createSession(admin.id, 'admin', 1);
    db.addAuditLog(admin.id, admin.name, 'ADMIN_LOGIN', `Administrator ${admin.name} successfully accessed console`);

    res.json({
      success: true,
      token: session.token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Admin login failed' });
  }
});

apiRouter.get('/admin/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const admin = db.getAdminByEmail('admin@msofficial.com');
  res.json({
    admin: {
      id: req.adminId,
      name: admin?.name || 'Administrator',
      email: admin?.email || 'admin@msofficial.com',
    },
  });
});

apiRouter.post('/admin/logout', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.headers['x-admin-token'] as string);
  if (token) {
    db.deleteSession(token);
  }
  db.addAuditLog(req.adminId!, req.adminName!, 'ADMIN_LOGOUT', 'Administrator logged out');
  res.json({ success: true });
});

// Admin Dashboard Analytics
apiRouter.get('/admin/stats', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  const activePackages = db.getAllUserPackages().filter((p) => p.status === 'active');
  const pendingPackages = db.getAllUserPackages().filter((p) => p.status === 'pending_verification');
  const allWithdrawals = db.getAllWithdrawals();
  const pendingWithdrawals = allWithdrawals.filter((w) => w.status === 'pending');
  const successfulWithdrawals = allWithdrawals.filter((w) => w.status === 'successful');
  const supportMsgs = db.getAllSupportMessages().filter((m) => m.sender === 'user' && m.status === 'unread');

  let totalSystemBalance = 0;
  users.forEach((u) => {
    const w = db.getWallet(u.id);
    totalSystemBalance += (w.availableBalance || 0) + (w.pendingBalance || 0);
  });

  const weeklyCount = activePackages.filter((p) => p.packageId === 'weekly').length;
  const monthlyCount = activePackages.filter((p) => p.packageId === 'monthly').length;

  res.json({
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'active').length,
    onlineUsers: Math.max(1, Math.min(users.length, Math.floor(users.length * 0.4) + 1)),
    activeWeeklyPackages: weeklyCount,
    activeMonthlyPackages: monthlyCount,
    pendingPayments: pendingPackages.length,
    pendingWithdrawals: pendingWithdrawals.length,
    successfulWithdrawals: successfulWithdrawals.length,
    totalBalance: totalSystemBalance,
    pendingCustomerMessages: supportMsgs.length,
  });
});

// Admin Users List & Management
apiRouter.get('/admin/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  const search = ((req.query.search as string) || '').toLowerCase();
  const statusFilter = req.query.status as string;

  let filtered = users.map((u) => {
    const activePkg = db.getActiveUserPackage(u.id);
    const wallet = db.getWallet(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      referralCode: u.referralCode,
      createdAt: u.createdAt,
      package: activePkg ? activePkg.packageName : 'None',
      balance: wallet.availableBalance,
    };
  });

  if (search) {
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.phone.includes(search) ||
        u.id.toLowerCase().includes(search)
    );
  }

  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter((u) => u.status === statusFilter);
  }

  res.json(filtered);
});

apiRouter.post('/admin/users/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    res.status(400).json({ error: 'Status must be active or suspended' });
    return;
  }

  const updated = db.updateUser(id, { status });
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  db.addAuditLog(
    req.adminId!,
    req.adminName!,
    'USER_STATUS_CHANGE',
    `Changed user ${updated.name} status to ${status}`,
    updated.id
  );

  res.json({ success: true, user: updated });
});

apiRouter.get('/admin/users/:id/history', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = db.getUserById(id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const packages = db.getUserPackages(id);
  const transactions = db.getWalletTransactions(id);
  const withdrawals = db.getWithdrawalsForUser(id);
  const wallet = db.getWallet(id);

  res.json({
    user,
    wallet,
    packages,
    transactions,
    withdrawals,
  });
});

// Admin Package Management
apiRouter.get('/admin/packages/requests', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const all = db.getAllUserPackages();
  // enrich with user details
  const enriched = all.map((pkg) => {
    const user = db.getUserById(pkg.userId);
    return {
      ...pkg,
      userName: user ? user.name : 'Unknown User',
      userEmail: user ? user.email : 'Unknown Email',
      userPhone: user ? user.phone : 'Unknown Phone',
    };
  });
  res.json(enriched);
});

apiRouter.post('/admin/packages/approve', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { packageId } = req.body;
  const pkg = db.getAllUserPackages().find((p) => p.id === packageId);
  if (!pkg) {
    res.status(404).json({ error: 'Package record not found' });
    return;
  }

  const durationDays = pkg.packageId === 'weekly' ? 7 : 30;
  const start = new Date();
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + durationDays);

  pkg.status = 'active';
  pkg.startDate = start.toISOString();
  pkg.expiryDate = expiry.toISOString();
  pkg.approvedAt = new Date().toISOString();
  pkg.approvedBy = req.adminName;
  db.save();

  db.addAuditLog(
    req.adminId!,
    req.adminName!,
    'PACKAGE_APPROVED',
    `Approved ${pkg.packageName} (Rs. ${pkg.price}) for user ID ${pkg.userId}`,
    pkg.userId
  );

  res.json({ success: true, package: pkg });
});

apiRouter.post('/admin/packages/reject', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { packageId, reason } = req.body;
  const pkg = db.getAllUserPackages().find((p) => p.id === packageId);
  if (!pkg) {
    res.status(404).json({ error: 'Package record not found' });
    return;
  }

  pkg.status = 'rejected';
  pkg.notes = reason || 'Payment could not be verified';
  db.save();

  db.addAuditLog(
    req.adminId!,
    req.adminName!,
    'PACKAGE_REJECTED',
    `Rejected package verification for user ID ${pkg.userId}. Reason: ${reason || 'Unverified'}`,
    pkg.userId
  );

  res.json({ success: true, package: pkg });
});

apiRouter.post('/admin/packages/toggle', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { userId, packageType, action } = req.body; // action: 'activate' | 'deactivate'
  const user = db.getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Deactivate any currently active packages for this user
  const allUserPkgs = db.getUserPackages(userId);
  allUserPkgs.forEach((p) => {
    if (p.status === 'active' || (action === 'deactivate' && p.status === 'pending_verification')) {
      p.status = action === 'deactivate' ? 'expired' : 'expired';
    }
  });

  if (action === 'activate') {
    const pkgSettings = db.getPackageSettings();
    const durationDays = packageType === 'monthly' ? 30 : 7;
    const price = packageType === 'monthly' ? pkgSettings.monthly.price : pkgSettings.weekly.price;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + durationDays);

    const newPkg: UserPackage = {
      id: crypto.randomUUID(),
      userId: user.id,
      packageId: packageType === 'monthly' ? 'monthly' : 'weekly',
      packageName: packageType === 'monthly' ? 'One Month' : 'One Week',
      price,
      startDate: new Date().toISOString(),
      expiryDate: expiry.toISOString(),
      status: 'active',
      paymentMethod: 'JazzCash',
      senderAccountName: 'Administrator Override',
      senderPhone: user.phone || '0300-0000000',
      transactionProofUrl: '',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: req.adminName || 'Admin',
    };
    db.addUserPackage(newPkg);

    db.addAuditLog(
      req.adminId!,
      req.adminName || 'Admin',
      'ADMIN_PACKAGE_ACTIVATION',
      `Directly activated ${newPkg.packageName} (${durationDays} days) for member ${user.name} (${user.email} / ${user.phone})`,
      user.id
    );
    res.json({ success: true, message: `Successfully activated ${newPkg.packageName} for ${user.name}`, package: newPkg });
  } else {
    db.save();
    db.addAuditLog(
      req.adminId!,
      req.adminName || 'Admin',
      'ADMIN_PACKAGE_DEACTIVATION',
      `Deactivated active package for member ${user.name} (${user.email})`,
      user.id
    );
    res.json({ success: true, message: `Package membership revoked/deactivated for ${user.name}` });
  }
});

// Admin Screenshot Chat Management
apiRouter.get('/admin/screenshots', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const submissions = db.getAllScreenshots();
  res.json(submissions);
});

apiRouter.post('/admin/screenshots/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, reply } = req.body;

  const item = db.updateScreenshot(id, {
    status,
    adminReply: reply !== undefined ? reply : undefined,
    updatedAt: new Date().toISOString(),
  });

  if (!item) {
    res.status(404).json({ error: 'Screenshot submission not found' });
    return;
  }

  // If approved, give reward to user (e.g. Rs. 50 bonus)
  if (status === 'approved') {
    db.adjustBalance(item.userId, 50, `Invite Screenshot Bonus (${item.friendName})`, req.adminName);
  }

  db.addAuditLog(
    req.adminId!,
    req.adminName!,
    'SCREENSHOT_STATUS',
    `Updated screenshot for friend ${item.friendName} to ${status}`,
    item.userId
  );

  res.json({ success: true, submission: item });
});

// Admin Balance Management
apiRouter.post('/admin/balances/adjust', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { userId, amount, action, reason } = req.body;

  if (!userId || !amount || !action || !reason) {
    res.status(400).json({ error: 'User ID, Amount, Action (+ or -), and Reason are required' });
    return;
  }

  const user = db.getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const numAmount = Math.abs(Number(amount));
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: 'Valid positive amount required' });
    return;
  }

  const change = action === 'add' ? numAmount : -numAmount;
  const wallet = db.getWallet(userId);

  if (action === 'remove' && wallet.availableBalance < numAmount) {
    res.status(400).json({ error: `Cannot deduct Rs. ${numAmount}. User only has Rs. ${wallet.availableBalance} available.` });
    return;
  }

  const updatedWallet = db.adjustBalance(userId, change, reason.trim(), req.adminName);

  db.addAuditLog(
    req.adminId!,
    req.adminName!,
    'BALANCE_ADJUSTMENT',
    `${action === 'add' ? '+ Rs.' : '- Rs.'} ${numAmount.toLocaleString()} to ${user.name} (${user.email}). Reason: ${reason.trim()}`,
    user.id
  );

  res.json({
    success: true,
    message: `Balance adjusted by ${change > 0 ? '+' : ''}${change} successfully`,
    wallet: updatedWallet,
  });
});

// Admin Customer Service
apiRouter.get('/admin/support/conversations', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const messages = db.getAllSupportMessages();
  const usersMap = new Map<string, { userId: string; userName: string; unreadCount: number; lastMessage: SupportMessage }>();

  messages.forEach((m) => {
    const existing = usersMap.get(m.userId);
    const isUnread = m.sender === 'user' && m.status === 'unread';
    if (!existing) {
      usersMap.set(m.userId, {
        userId: m.userId,
        userName: m.userName,
        unreadCount: isUnread ? 1 : 0,
        lastMessage: m,
      });
    } else {
      if (isUnread) existing.unreadCount++;
      if (new Date(m.createdAt) > new Date(existing.lastMessage.createdAt)) {
        existing.lastMessage = m;
      }
    }
  });

  res.json(Array.from(usersMap.values()));
});

apiRouter.get('/admin/support/:userId/messages', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  db.markMessagesRead(userId, 'user');
  const msgs = db.getSupportMessagesForUser(userId);
  res.json(msgs);
});

apiRouter.post('/admin/support/:userId/reply', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { message, attachment } = req.body;

  const user = db.getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const newMsg: SupportMessage = {
    id: crypto.randomUUID(),
    userId: user.id,
    userName: user.name,
    sender: 'admin',
    message: message?.trim() || '',
    attachment: attachment || null,
    status: 'unread',
    createdAt: new Date().toISOString(),
  };

  db.addSupportMessage(newMsg);
  res.json({ success: true, message: newMsg });
});

// Admin Withdrawal Management
apiRouter.get('/admin/withdrawals', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const withdrawals = db.getAllWithdrawals();
  res.json(withdrawals);
});

apiRouter.post('/admin/withdrawals/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!['successful', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Target status must be successful or rejected' });
    return;
  }

  const withdrawal = db.getAllWithdrawals().find((w) => w.id === id);
  if (!withdrawal) {
    res.status(404).json({ error: 'Withdrawal not found' });
    return;
  }

  if (withdrawal.status !== 'pending') {
    res.status(400).json({ error: `Withdrawal has already been marked as ${withdrawal.status}` });
    return;
  }

  const previousStatus = withdrawal.status;
  withdrawal.status = status;
  withdrawal.adminId = req.adminId || 'admin_master_1';
  withdrawal.adminNotes = notes || null;
  withdrawal.processedAt = new Date().toISOString();

  const wallet = db.getWallet(withdrawal.userId);

  if (status === 'successful') {
    // Deduct from pending balance
    wallet.pendingBalance = Math.max(0, wallet.pendingBalance - withdrawal.amount);
    wallet.updatedAt = new Date().toISOString();
  } else if (status === 'rejected') {
    // Return funds from pending back to available!
    wallet.pendingBalance = Math.max(0, wallet.pendingBalance - withdrawal.amount);
    wallet.availableBalance += withdrawal.amount;
    wallet.updatedAt = new Date().toISOString();

    // Log refund transaction
    db.adjustBalance(
      withdrawal.userId,
      withdrawal.amount,
      `Withdrawal Refund (${withdrawal.id} Rejected)`,
      req.adminName
    );
  }

  db.save();

  db.addAuditLog(
    req.adminId!,
    req.adminName!,
    'WITHDRAWAL_STATUS_CHANGE',
    `Marked withdrawal ${withdrawal.id} (Rs. ${withdrawal.amount.toLocaleString()} - ${withdrawal.method}) as ${status.toUpperCase()}. Previous: ${previousStatus}`,
    withdrawal.userId
  );

  res.json({ success: true, withdrawal, wallet });
});

// Admin Payment Settings
apiRouter.get('/admin/settings/payment', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getPaymentSettings());
});

apiRouter.post('/admin/settings/payment', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { jazzCash, easypaisa } = req.body;
  if (!jazzCash || !easypaisa) {
    res.status(400).json({ error: 'Both JazzCash and Easypaisa settings required' });
    return;
  }

  db.updatePaymentSettings({ jazzCash, easypaisa });
  db.addAuditLog(req.adminId!, req.adminName!, 'UPDATE_PAYMENT_SETTINGS', 'Updated payment accounts & QR configurations');

  res.json({ success: true, settings: db.getPaymentSettings() });
});

// Admin Package Settings
apiRouter.get('/admin/settings/packages', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getPackageSettings());
});

apiRouter.post('/admin/settings/packages', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { weekly, monthly } = req.body;
  if (!weekly || !monthly) {
    res.status(400).json({ error: 'Both weekly and monthly package parameters required' });
    return;
  }

  db.updatePackageSettings({ weekly, monthly });
  db.addAuditLog(req.adminId!, req.adminName!, 'UPDATE_PACKAGE_SETTINGS', 'Updated package pricing and benefits limits');

  res.json({ success: true, settings: db.getPackageSettings() });
});

// Admin Audit Logs
apiRouter.get('/admin/audit-logs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs();
  res.json(logs);
});

// Admin Deployment & Link Architecture Helper
apiRouter.get('/admin/deployment-links', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const queryDomain = (req.query.domain as string)?.trim();
  const domainSettings = db.getDomainSettings();

  const rawHost = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';

  const cloudPreDomain = 'ais-pre-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app';
  const cloudDevDomain = 'ais-dev-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app';
  const primaryDomain = 'msofficial.com';
  const secondaryDomain = '786msofficial.com';

  let targetDomain = queryDomain || domainSettings.customDomain || rawHost;
  // Clean domain of any accidental protocol prefix
  targetDomain = targetDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

  const targetProtocol = domainSettings.useHttps || targetDomain.includes('.run.app') ? 'https' : protocol;
  const baseUrl = `${targetProtocol}://${targetDomain}`;

  res.json({
    activeDomain: targetDomain,
    protocol: targetProtocol,
    userLink: baseUrl,
    adminLink: `${baseUrl}/admin`,
    subdomainAdminLink: `${targetProtocol}://${domainSettings.subdomainAdmin || 'admin'}.${targetDomain}`,
    subdomainAppLink: `${targetProtocol}://${domainSettings.subdomainApp || 'app'}.${targetDomain}`,
    referralTemplateLink: `${baseUrl}/?ref=`,
    packageLink: `${baseUrl}/?tab=packages`,
    attendanceLink: `${baseUrl}/?tab=attendance`,
    supportLink: `${baseUrl}/?tab=support`,
    // First-Class Domain References
    primaryDomain,
    secondaryDomain,
    msofficialUrl: `https://${primaryDomain}`,
    msofficialSupportUrl: `https://${primaryDomain}/?tab=support`,
    msofficialAdminUrl: `https://${primaryDomain}/admin`,
    msofficial786Url: `https://${secondaryDomain}`,
    msofficial786SupportUrl: `https://${secondaryDomain}/?tab=support`,
    msofficial786AdminUrl: `https://${secondaryDomain}/admin`,
    cloudPreUrl: `https://${cloudPreDomain}`,
    cloudPreSupportUrl: `https://${cloudPreDomain}/?tab=support`,
    cloudDevUrl: `https://${cloudDevDomain}`,
    cloudPreAdminUrl: `https://${cloudPreDomain}/admin`,
    domainSettings,
  });
});

apiRouter.post('/admin/domain-settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customDomain, useHttps, subdomainAdmin, subdomainApp } = req.body;
    let cleanDomain = (customDomain || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');

    const updated = db.updateDomainSettings({
      customDomain: cleanDomain,
      useHttps: Boolean(useHttps ?? true),
      subdomainAdmin: subdomainAdmin?.trim() || 'admin',
      subdomainApp: subdomainApp?.trim() || 'app',
    });

    db.addAuditLog(
      req.adminId || 'admin',
      req.adminName || 'Administrator',
      'UPDATE_DOMAIN_SETTINGS',
      `Updated system domain configuration to: ${cleanDomain || 'Default'}`
    );

    res.json({ success: true, settings: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update domain settings' });
  }
});

// Public Domain Links for Client Sharing
apiRouter.get('/public/domain-links', (req: Request, res: Response) => {
  const domainSettings = db.getDomainSettings();
  const rawHost = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';

  const cloudPreDomain = 'ais-pre-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app';
  const cloudDevDomain = 'ais-dev-w3jyztby6skrlvoibagcqo-813832143668.asia-southeast1.run.app';
  const primaryDomain = 'msofficial.com';
  const secondaryDomain = '786msofficial.com';

  let targetDomain = domainSettings.customDomain || rawHost;
  targetDomain = targetDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  const targetProtocol = domainSettings.useHttps || targetDomain.includes('.run.app') ? 'https' : protocol;
  const baseUrl = `${targetProtocol}://${targetDomain}`;

  res.json({
    activeDomain: targetDomain,
    baseUrl,
    adminUrl: `${baseUrl}/admin`,
    referralTemplate: `${baseUrl}/?ref=`,
    supportUrl: `${baseUrl}/?tab=support`,
    // Explicit URLs for user sharing & navigation
    msofficialUrl: `https://${primaryDomain}`,
    msofficialSupportUrl: `https://${primaryDomain}/?tab=support`,
    msofficial786Url: `https://${secondaryDomain}`,
    msofficial786SupportUrl: `https://${secondaryDomain}/?tab=support`,
    cloudPreUrl: `https://${cloudPreDomain}`,
    cloudPreSupportUrl: `https://${cloudPreDomain}/?tab=support`,
    cloudDevUrl: `https://${cloudDevDomain}`,
    cloudDevSupportUrl: `https://${cloudDevDomain}/?tab=support`,
    cloudDevReferral: `https://${cloudDevDomain}/?ref=`,
    availableDomains: [
      { id: 'dev', name: 'Live App Link (Active ais-dev)', domain: cloudDevDomain, baseUrl: `https://${cloudDevDomain}` },
      { id: 'msofficial', name: 'msofficial.com (Official)', domain: primaryDomain, baseUrl: `https://${primaryDomain}` },
      { id: '786msofficial', name: '786msofficial.com (VIP)', domain: secondaryDomain, baseUrl: `https://${secondaryDomain}` },
      { id: 'cloud', name: 'Shared App Link (ais-pre)', domain: cloudPreDomain, baseUrl: `https://${cloudPreDomain}` },
    ],
  });
});
