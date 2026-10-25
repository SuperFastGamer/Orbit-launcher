import { useState, useEffect } from 'react';
import { Wifi, Battery, ShieldAlert, Sparkles, Code2, Smartphone, Maximize2 } from 'lucide-react';

interface AndroidStatusBarProps {
  isEmergencyActive: boolean;
  colorTheme: string;
  isDeviceFrame: boolean;
  onToggleFrame: () => void;
  onOpenKotlinSource: () => void;
  onRestartTutorial: () => void;
}

export function AndroidStatusBar({
  isEmergencyActive,
  isDeviceFrame,
  onToggleFrame,
  onOpenKotlinSource,
  onRestartTutorial,
}: AndroidStatusBarProps) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 pt-2.5 pb-2 text-xs font-mono tracking-tight pointer-events-auto">
      {/* Left: System Clock & Emergency state */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white/90 text-sm tracking-wide">{timeStr}</span>
        {isEmergencyActive && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-400 font-sans text-[11px] font-medium tracking-normal animate-pulse">
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>Emergency Lockdown</span>
          </div>
        )}
      </div>

      {/* Right: Quick Dev Controls + Battery & Wifi */}
      <div className="flex items-center gap-3">
        {/* Source Code Inspector CTA */}
        <button
          onClick={onOpenKotlinSource}
          title="Inspect Jetpack Compose Kotlin Code"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 font-sans text-[11px] font-medium transition-all shadow-sm border border-white/10 cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Kotlin Source</span>
        </button>

        {/* Tutorial Restart */}
        <button
          onClick={onRestartTutorial}
          title="Interactive Tutorial"
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/15 active:scale-95 text-white/70 hover:text-white font-sans text-[11px] transition-all cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="hidden md:inline">Tutorial</span>
        </button>

        {/* Frame Toggle */}
        <button
          onClick={onToggleFrame}
          title={isDeviceFrame ? 'Switch to Fullscreen Canvas' : 'Switch to Smartphone Frame'}
          className="p-1.5 rounded-md bg-white/5 hover:bg-white/15 active:scale-95 text-white/70 hover:text-white transition-all cursor-pointer"
        >
          {isDeviceFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
        </button>

        {/* System Icons */}
        <div className="flex items-center gap-1.5 text-white/80 pl-1">
          <Wifi className="w-3.5 h-3.5" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-white/70">88%</span>
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
