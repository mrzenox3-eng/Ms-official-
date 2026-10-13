import React, { createContext, useContext, useState, useEffect } from 'react';

interface ScreenContextType {
  isFullscreen: boolean;
  isMaximizedLayout: boolean;
  toggleFullscreen: () => Promise<void>;
  toggleMaximizedLayout: () => void;
  toggleMaximizeAll: () => Promise<void>;
}

const ScreenContext = createContext<ScreenContextType | undefined>(undefined);

export const ScreenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return Boolean(typeof document !== 'undefined' && document.fullscreenElement);
  });

  const [isMaximizedLayout, setIsMaximizedLayout] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('ms_screen_maximized');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (active) {
        setIsMaximizedLayout(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
        setIsFullscreen(true);
        setIsMaximizedLayout(true);
        try {
          localStorage.setItem('ms_screen_maximized', 'true');
        } catch {}
      } else {
        const doc = document as any;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Native fullscreen request notice:', err);
      // Fallback: toggle full maximized responsive layout
      toggleMaximizedLayout();
    }
  };

  const toggleMaximizedLayout = () => {
    setIsMaximizedLayout((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ms_screen_maximized', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  const toggleMaximizeAll = async () => {
    // If not in fullscreen, request native fullscreen and expand layout
    if (!isFullscreen) {
      await toggleFullscreen();
      setIsMaximizedLayout(true);
    } else {
      await toggleFullscreen();
      setIsMaximizedLayout(false);
    }
  };

  return (
    <ScreenContext.Provider
      value={{
        isFullscreen,
        isMaximizedLayout,
        toggleFullscreen,
        toggleMaximizedLayout,
        toggleMaximizeAll,
      }}
    >
      {children}
    </ScreenContext.Provider>
  );
};

export const useScreen = (): ScreenContextType => {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error('useScreen must be used within a ScreenProvider');
  }
  return context;
};
