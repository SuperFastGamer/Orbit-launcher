import React from 'react';
import { ArrowRight, Check, ShieldAlert, Sparkles, X } from 'lucide-react';
import { TutorialState } from '../types/launcher';

interface InteractiveTutorialProps {
  tutorial: TutorialState;
  onNextStep: () => void;
  onSkipTutorial: () => void;
  currentStepProgress: string;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  tutorial,
  onNextStep,
  onSkipTutorial,
}) => {
  if (!tutorial.isActive) return null;

  const stepDetails = [
    {
      step: 1,
      title: 'Touch & Drag Outward',
      instruction: 'Press and drag outward from the fixed white center ball to smoothly bloom Ring 1 (6 satellite hubs). Notice how returning to center collapses them.',
      highlight: 'Center Ball → Ring 1',
    },
    {
      step: 2,
      title: 'App Folders & Layer 2/3',
      instruction: 'Drag towards the "Folders" hub on the right. Notice how it blooms Ring 2 sub-spheres (Social, Media, Work, Finance, Games). Release on Social to open its center card.',
      highlight: 'Hover Folders → Release Social',
    },
    {
      step: 3,
      title: 'Instant Universal Search',
      instruction: 'Drag outward into the "Search" hub (top-right). All radial rings dissolve instantly, and the top search bar slides down with instant software keyboard readiness.',
      highlight: 'Drag to Search',
    },
    {
      step: 4,
      title: 'Emergency Lockdown & Focus Tasks',
      instruction: 'Emergency Mode wraps the screen in a red barrier and locks non-essential hubs, but Calls & Dialer are NEVER blocked. Repeating the drag lifts it immediately. Tasks lock out non-whitelisted apps until completed.',
      highlight: 'Emergency Lockdown & Tasks Whitelist',
    },
  ];

  const current = stepDetails[tutorial.currentStep - 1] || stepDetails[0];

  return (
    <div className="absolute inset-x-0 bottom-8 z-40 flex justify-center pointer-events-none px-4">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl shadow-black/80 pointer-events-auto transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-xs font-semibold">
              {tutorial.currentStep}
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">
              Interactive Tutorial · Step {tutorial.currentStep} of 4
            </span>
          </div>
          <button
            onClick={onSkipTutorial}
            className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <span>Skip Tour</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-2.5">
          <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
            {tutorial.currentStep === 4 ? (
              <ShieldAlert className="w-4 h-4 text-red-400 inline" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400 inline" />
            )}
            {current.title}
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {current.instruction}
          </p>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-1">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-all ${
                  s === tutorial.currentStep
                    ? 'bg-blue-400 scale-125'
                    : s < tutorial.currentStep
                    ? 'bg-blue-600'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {tutorial.currentStep < 4 ? (
              <button
                onClick={onNextStep}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow cursor-pointer active:scale-95"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onSkipTutorial}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Enter Live Launcher</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
