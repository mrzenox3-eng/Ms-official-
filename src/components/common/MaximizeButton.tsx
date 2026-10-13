import React, { useState } from 'react';
import { Maximize2, Minimize2, Check } from 'lucide-react';
import { useScreen } from '../../context/ScreenContext';

interface MaximizeButtonProps {
  variant?: 'header' | 'floating' | 'chip';
  className?: string;
  showLabel?: boolean;
}

export const MaximizeButton: React.FC<MaximizeButtonProps> = ({
  variant = 'header',
  className = '',
  showLabel = false,
}) => {
  const { isFullscreen, isMaximizedLayout, toggleMaximizeAll } = useScreen();
  const [showToast, setShowToast] = useState(false);

  const isExpanded = isFullscreen || isMaximizedLayout;

  const handleClick = async () => {
    await toggleMaximizeAll();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  if (variant === 'floating') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`fixed bottom-20 right-4 z-40 p-3 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer flex items-center gap-2 group active:scale-95 ${
            isExpanded
              ? 'bg-emerald-600/90 text-white border-emerald-400/50 shadow-emerald-950/80 ring-2 ring-emerald-500/30'
              : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700 hover:border-emerald-500/50 shadow-slate-950/80'
          } ${className}`}
          title={isExpanded ? 'Restore Normal Screen' : 'Maximize Full Adjust on Screen'}
          aria-label={isExpanded ? 'Restore Normal Screen' : 'Maximize Full Adjust on Screen'}
        >
          {isExpanded ? (
            <Minimize2 className="w-5 h-5 transition-transform group-hover:scale-110" />
          ) : (
            <Maximize2 className="w-5 h-5 transition-transform group-hover:scale-110" />
          )}
          {showLabel && (
            <span className="text-xs font-bold tracking-tight">
              {isExpanded ? 'Exit Full Screen' : 'Maximize Screen'}
            </span>
          )}
        </button>

        {/* Minimal Toast Confirmation */}
        {showToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in zoom-in duration-150">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{isExpanded ? 'Screen Fully Adjusted (100% Fit)' : 'Restored Normal Screen'}</span>
          </div>
        )}
      </>
    );
  }

  if (variant === 'chip') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
          isExpanded
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
        } ${className}`}
        title={isExpanded ? 'Restore standard view' : 'Maximize full adjust on screen'}
      >
        {isExpanded ? <Minimize2 className="w-3.5 h-3.5 text-emerald-400" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
        <span>{isExpanded ? 'Exit Fullscreen' : 'Maximize Screen'}</span>
      </button>
    );
  }

  // Default: 'header' variant
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer text-xs relative group active:scale-95 border ${
          isExpanded
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
        } ${className}`}
        title={isExpanded ? 'Exit Full Screen (Restore)' : 'Maximize Full Adjust on Screen (100% Fit)'}
        aria-label={isExpanded ? 'Exit Full Screen' : 'Maximize Full Adjust on Screen'}
      >
        {isExpanded ? (
          <Minimize2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
        ) : (
          <Maximize2 className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 group-hover:scale-110 transition-transform" />
        )}
        {showLabel && (
          <span className="hidden sm:inline font-medium ml-1.5 text-xs">
            {isExpanded ? 'Restore' : 'Maximize'}
          </span>
        )}
      </button>

      {/* Minimal Toast Notification */}
      {showToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in zoom-in duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{isExpanded ? 'Screen Maximized (Full Adjust)' : 'Restored Normal Screen'}</span>
        </div>
      )}
    </>
  );
};
