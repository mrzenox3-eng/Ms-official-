import React, { useState, useEffect } from 'react';
import newAppIcon from '../../assets/images/ms_official_icon_new_1791275507280.jpg';

interface FlashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const FlashScreen: React.FC<FlashScreenProps> = ({
  onComplete,
  durationMs = 1400,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress animation over the duration
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / durationMs) * 100), 100);
      setProgress(pct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 150);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white select-none transition-opacity duration-300 ease-out cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="MS Official Flash Screen"
    >
      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Center Icon & Branding */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* App Icon Container */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/30 to-amber-500/20 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border border-emerald-500/40 shadow-2xl shadow-emerald-950/60 bg-slate-900">
            <img
              src={newAppIcon}
              alt="MS Official New App Icon"
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[0.2em] uppercase text-white font-sans">
          MS OFFICIAL
        </h1>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-medium tracking-[0.16em] uppercase text-slate-400 mt-2">
          Earn. Connect. Grow.
        </p>

        {/* Minimal Progress Bar */}
        <div className="mt-7 w-36 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75 ease-out rounded-full shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="text-[10px] text-slate-600 mt-3 font-mono">
          Tap anywhere to continue
        </span>
      </div>
    </div>
  );
};
