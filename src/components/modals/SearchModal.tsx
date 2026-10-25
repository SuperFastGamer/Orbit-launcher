import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, ArrowRight, CornerDownLeft, Delete } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { AppItem } from '../../types/launcher';
import { haptics } from '../../utils/audio';

interface SearchModalProps {
  apps: AppItem[];
  onLaunchApp: (app: AppItem) => void;
  onDismiss: () => void;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const SearchModal: React.FC<SearchModalProps> = ({
  apps,
  onLaunchApp,
  onDismiss,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Automatically request focus immediately upon mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(query.toLowerCase()) ||
      app.packageName.toLowerCase().includes(query.toLowerCase()) ||
      app.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleVirtualKeyPress = (char: string) => {
    haptics.playTick(750, 0.012, 0.08);
    setQuery((prev) => prev + char.toLowerCase());
    inputRef.current?.focus();
  };

  const handleVirtualBackspace = () => {
    haptics.playTick(500, 0.012, 0.08);
    setQuery((prev) => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  const handleVirtualSpace = () => {
    haptics.playTick(600, 0.012, 0.08);
    setQuery((prev) => prev + ' ');
    inputRef.current?.focus();
  };

  // Helper to render icon
  const renderIcon = (iconName: string, color: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComp = (LucideIcons as any)[iconName] || LucideIcons.AppWindow;
    return <IconComp className="w-5 h-5" style={{ color }} />;
  };

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/85 backdrop-blur-xl animate-in fade-in duration-150"
    >
      {/* Top Search Bar (slides down at very top of screen) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl mx-auto pt-10 px-4 animate-in slide-in-from-top-6 duration-200"
      >
        <div className="relative flex items-center bg-slate-900 border border-white/20 rounded-2xl shadow-2xl px-4 py-3">
          <SearchIcon className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredApps.length > 0) {
                onLaunchApp(filteredApps[0]);
              } else if (e.key === 'Escape') {
                onDismiss();
              }
            }}
            placeholder="Search apps, actions, contacts..."
            className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-base font-normal tracking-wide"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white mr-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <button
            onClick={onDismiss}
            className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Live Filter Results */}
        <div className="mt-3 max-h-[320px] overflow-y-auto rounded-2xl bg-slate-900/80 border border-white/10 divide-y divide-white/5">
          {filteredApps.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No matching applications found for &quot;{query}&quot;
            </div>
          ) : (
            filteredApps.map((app, index) => (
              <button
                key={app.id}
                onClick={() => onLaunchApp(app)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors text-left cursor-pointer ${
                  index === 0 ? 'bg-white/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 shadow-sm shrink-0">
                    {renderIcon(app.iconName, app.color)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <span>{app.name}</span>
                      {index === 0 && (
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          Best match
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {app.packageName} · <span className="capitalize">{app.category}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Simulated Android Software Keyboard at bottom */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl mx-auto pb-6 px-3 animate-in slide-in-from-bottom-8 duration-200"
      >
        <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-2.5 shadow-2xl backdrop-blur-md">
          {/* Key rows */}
          <div className="flex flex-col gap-1.5">
            {/* Row 1 */}
            <div className="flex justify-center gap-1">
              {KEYBOARD_ROWS[0].map((k) => (
                <button
                  key={k}
                  onClick={() => handleVirtualKeyPress(k)}
                  className="flex-1 max-w-[42px] h-11 bg-slate-800/90 hover:bg-slate-700 active:bg-blue-600 rounded-lg text-white font-mono text-sm font-medium shadow-sm flex items-center justify-center transition-all cursor-pointer"
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Row 2 */}
            <div className="flex justify-center gap-1 px-3">
              {KEYBOARD_ROWS[1].map((k) => (
                <button
                  key={k}
                  onClick={() => handleVirtualKeyPress(k)}
                  className="flex-1 max-w-[42px] h-11 bg-slate-800/90 hover:bg-slate-700 active:bg-blue-600 rounded-lg text-white font-mono text-sm font-medium shadow-sm flex items-center justify-center transition-all cursor-pointer"
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Row 3 with Backspace */}
            <div className="flex justify-center items-center gap-1">
              <button
                onClick={() => setQuery('')}
                className="w-12 h-11 bg-slate-800/60 hover:bg-slate-700 rounded-lg text-slate-400 font-mono text-xs flex items-center justify-center cursor-pointer"
              >
                Clear
              </button>
              <div className="flex flex-1 justify-center gap-1">
                {KEYBOARD_ROWS[2].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleVirtualKeyPress(k)}
                    className="flex-1 max-w-[42px] h-11 bg-slate-800/90 hover:bg-slate-700 active:bg-blue-600 rounded-lg text-white font-mono text-sm font-medium shadow-sm flex items-center justify-center transition-all cursor-pointer"
                  >
                    {k}
                  </button>
                ))}
              </div>
              <button
                onClick={handleVirtualBackspace}
                className="w-12 h-11 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-200 flex items-center justify-center cursor-pointer active:bg-red-900/50"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Row: Spacebar & Go */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleVirtualSpace}
                className="flex-1 h-11 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-slate-400 font-mono text-xs flex items-center justify-center cursor-pointer shadow-sm"
              >
                space
              </button>
              <button
                onClick={() => {
                  if (filteredApps.length > 0) onLaunchApp(filteredApps[0]);
                }}
                className="w-20 h-11 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shadow cursor-pointer"
              >
                <span>Launch</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
