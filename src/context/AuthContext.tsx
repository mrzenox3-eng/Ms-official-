import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Wallet, UserPackage, DailyUsage } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  activePackage: UserPackage | null;
  dailyUsage: DailyUsage | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  login: (params: { email?: string; phone?: string }) => Promise<void>;
  register: (params: { name: string; email: string; phone: string; referralCode?: string }) => Promise<void>;
  googleAuth: (params: { email: string; name?: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [activePackage, setActivePackage] = useState<UserPackage | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('ms_user_token');
    if (!token) {
      setUser(null);
      setWallet(null);
      setActivePackage(null);
      setDailyUsage(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setWallet(data.wallet);
      setActivePackage(data.activePackage);
      setDailyUsage(data.dailyUsage);
    } catch (err) {
      console.warn('Session verification failed, logging out client:', err);
      localStorage.removeItem('ms_user_token');
      setUser(null);
      setWallet(null);
      setActivePackage(null);
      setDailyUsage(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (params: { email?: string; phone?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(params);
      localStorage.setItem('ms_user_token', res.token);
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (params: { name: string; email: string; phone: string; referralCode?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.register(params);
      localStorage.setItem('ms_user_token', res.token);
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const googleAuth = async (params: { email: string; name?: string; phone?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.googleAuth(params);
      localStorage.setItem('ms_user_token', res.token);
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } finally {
      setUser(null);
      setWallet(null);
      setActivePackage(null);
      setDailyUsage(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        activePackage,
        dailyUsage,
        isLoading,
        refreshUser,
        login,
        register,
        googleAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
