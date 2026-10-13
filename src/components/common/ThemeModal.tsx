import React from 'react';
import { useTheme, THEME_OPTIONS, Theme } from '../../context/ThemeContext';
import { Palette, Check, X, Sparkles } from 'lucide-react';

export const ThemeModal: React.FC = () => {
  const { theme, setTheme, isThemePickerOpen, closeThemePicker } = useTheme();

  if (!isThemePickerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={closeThemePicker}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Appearance Suite</span>
                <span className="text-[10px] text-slate-500 font-mono">· 5 Themes</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Select Visual Theme</h3>
            </div>
          </div>

          <button
            onClick={closeThemePicker}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close theme picker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme List */}
        <div className="space-y-2.5">
          {THEME_OPTIONS.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                }}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer group ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Swatch Preview Pill */}
                  <div
                    className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner shrink-0"
                    style={{ backgroundColor: opt.canvasColor }}
                  >
                    <div
                      className="w-5 h-5 rounded-lg border border-white/20 shadow-sm"
                      style={{ backgroundColor: opt.cardColor }}
                    />
                    <div
                      className="w-2 h-2 rounded-full absolute bottom-1 right-1"
                      style={{ backgroundColor: opt.accentColor }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {opt.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                      {opt.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center pl-2">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-800 group-hover:border-slate-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Instant live preview & persistent
          </span>
          <button
            onClick={closeThemePicker}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
