import React from 'react';
import { ShieldAlert, ArrowLeft, CheckCircle } from 'lucide-react';
import { AppItem } from '../../types/launcher';

interface FocusBlockedModalProps {
  app: AppItem;
  blockingTasks: string[];
  onOpenTasks: () => void;
  onDismiss: () => void;
}

export const FocusBlockedModal: React.FC<FocusBlockedModalProps> = ({
  app,
  blockingTasks,
  onOpenTasks,
  onDismiss,
}) => {
  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl shadow-red-950/40 text-center animate-in zoom-in-95 duration-200"
      >
        <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto mb-4 text-red-400">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h3 className="text-base font-semibold text-white tracking-tight">Focus Lock Active</h3>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          <span className="font-semibold text-white">{app.name}</span> is not on your allowed focus whitelist for currently active deliverables.
        </p>

        {blockingTasks.length > 0 && (
          <div className="mt-4 p-3 rounded-2xl bg-slate-800/80 border border-white/10 text-left">
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Active Locking Task:
            </span>
            <div className="text-xs font-medium text-amber-300 truncate">
              {blockingTasks[0]}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-6">
          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Deep Work</span>
          </button>

          <button
            onClick={() => {
              onDismiss();
              onOpenTasks();
            }}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Tasks & Lift Lock</span>
          </button>
        </div>
      </div>
    </div>
  );
};
