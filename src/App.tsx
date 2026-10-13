/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ScreenProvider } from './context/ScreenContext';
import { ThemeModal } from './components/common/ThemeModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { UserApp } from './components/user/UserApp';
import { UserAuthModal } from './components/user/UserAuthModal';
import { AdminApp } from './components/admin/AdminApp';
import { FlashScreen } from './components/common/FlashScreen';
import { DedicatedSupportPortal } from './components/user/DedicatedSupportPortal';
const UserRoot: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-500 font-mono">
        Loading MS Official...
      </div>
    );
  }

  if (!user) {
    return <UserAuthModal isEmbedded={true} />;
  }

  return <UserApp />;
};

export default function App() {
  const [isSupportOnlyRoute, setIsSupportOnlyRoute] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    return params.get('tab') === 'support' || params.get('view') === 'support' || path === '/support';
  });

  // When visiting support directly (?tab=support), skip the flash screen for instant access
  const [showFlash, setShowFlash] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    const isSupport = params.get('tab') === 'support' || params.get('view') === 'support' || path === '/support';
    return !isSupport;
  });

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    const path = window.location.pathname;
    const host = window.location.hostname;
    return path.startsWith('/admin') || host.startsWith('admin.');
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const host = window.location.hostname;
      const params = new URLSearchParams(window.location.search);
      const isSupport = params.get('tab') === 'support' || params.get('view') === 'support' || path === '/support';

      setIsSupportOnlyRoute(isSupport);
      setIsAdminRoute(path.startsWith('/admin') || host.startsWith('admin.'));
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleBackToMainApp = () => {
    setIsSupportOnlyRoute(false);
    window.history.pushState({}, '', '/');
  };

  const handleNavigateFromSupport = (tab: any) => {
    setIsSupportOnlyRoute(false);
    window.history.pushState({}, '', `/?tab=${tab}`);
  };

  return (
    <ThemeProvider>
      <ScreenProvider>
        {showFlash && <FlashScreen onComplete={() => setShowFlash(false)} />}
        <ThemeModal />

        {/* When visiting ?tab=support, open ONLY the Dedicated Support Portal */}
        {isSupportOnlyRoute ? (
          <AuthProvider>
            <DedicatedSupportPortal
              onBackToApp={handleBackToMainApp}
              onNavigateTab={handleNavigateFromSupport}
            />
          </AuthProvider>
        ) : isAdminRoute ? (
          <AdminAuthProvider>
            <AdminApp />
          </AdminAuthProvider>
        ) : (
          <AuthProvider>
            <UserRoot />
          </AuthProvider>
        )}
      </ScreenProvider>
    </ThemeProvider>
  );
}
