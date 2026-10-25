import React from 'react';
import { ArrowLeft, Home, Share2, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { AppItem } from '../../types/launcher';

interface AppLaunchSimModalProps {
  app: AppItem;
  onDismiss: () => void;
}

export const AppLaunchSimModal: React.FC<AppLaunchSimModalProps> = ({
  app,
  onDismiss,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComp = (LucideIcons as any)[app.iconName] || LucideIcons.AppWindow;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-in zoom-in-95 duration-200">
      {/* Native App Top Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onDismiss}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Android Back Intent"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: app.color }}
            >
              <IconComp className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-tight">{app.name}</h1>
              <span className="text-[10px] font-mono text-slate-400">{app.packageName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
            Active Process
          </span>
          <button className="p-2 rounded-full hover:bg-white/10 text-slate-400 cursor-pointer">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* App Body Content View */}
      <div className="flex-1 p-6 overflow-y-auto max-w-2xl mx-auto w-full flex flex-col justify-between">
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-white/10 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: app.color }}
              >
                <IconComp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{app.name}</h2>
                <p className="text-xs text-slate-400">Native Application Executable</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Orbital Launcher successfully resolved the Android Intent{' '}
              <code className="text-blue-400 bg-slate-800 px-1 py-0.5 rounded font-mono">
                android.intent.action.MAIN
              </code>{' '}
              for <code className="text-emerald-400">{app.packageName}</code>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Category Channel
              </span>
              <span className="text-sm font-semibold text-white capitalize">{app.category}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Exemption Status
              </span>
              <span className="text-sm font-semibold text-emerald-400">
                {app.isBaseline ? 'Daily Baseline' : 'Focus Whitelist Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Android Home Bar gesture simulator */}
        <div className="pt-6 pb-2 text-center">
          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-98 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-white/10"
          >
            <Home className="w-4 h-4 text-blue-400" />
            <span>Return to Orbital Launcher Canvas</span>
          </button>
          <div className="w-32 h-1 bg-white/30 rounded-full mx-auto mt-4" />
        </div>
      </div>
    </div>
  );
};
