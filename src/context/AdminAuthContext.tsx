import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

interface AdminInfo {
  id: string;
  name: string;
  email: string;
}

interface AdminAuthContextType {
  admin: AdminInfo | null;
  isLoading: boolean;
  login: (params: { email: string; password: string; twoFactorCode?: string; enable2FA?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // When the user opens the Backend URL, NEVER open the admin dashboard directly.
  // Always require entering credentials on the centered professional login screen.
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const refreshAdmin = useCallback(async () => {
    const token = sessionStorage.getItem('ms_admin_session_token') || localStorage.getItem('ms_admin_token');
    if (!token) {
      setAdmin(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getAdminMe();
      setAdmin(data.admin);
    } catch (err) {
      console.warn('Admin session invalid:', err);
      sessionStorage.removeItem('ms_admin_session_token');
      localStorage.removeItem('ms_admin_token');
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (params: { email: string; password: string; twoFactorCode?: string; enable2FA?: boolean }) => {
    setIsLoading(true);
    try {
      const res = await api.adminLogin(params);
      sessionStorage.setItem('ms_admin_session_token', res.token);
      localStorage.setItem('ms_admin_token', res.token);
      setAdmin(res.admin);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.adminLogout();
    } catch {
      // ignore
    } finally {
      sessionStorage.removeItem('ms_admin_session_token');
      localStorage.removeItem('ms_admin_token');
      setAdmin(null);
      setIsLoading(false);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isLoading,
        login,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return context;
};
