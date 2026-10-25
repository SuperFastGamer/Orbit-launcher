import React from 'react';
import { X, Lock, CheckCircle2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { AppItem, TaskItem, AppCategory } from '../../types/launcher';

interface AppFolderModalProps {
  categoryId: string;
  categories: AppCategory[];
  apps: AppItem[];
  activeTasks: TaskItem[];
  density: 'compact' | 'normal' | 'spacious';
  onLaunchApp: (app: AppItem) => void;
  onDismiss: () => void;
  onSelectCategory: (catId: string) => void;
}

export const AppFolderModal: React.FC<AppFolderModalProps> = ({
  categoryId,
  categories,
  apps,
  activeTasks,
  density,
  onLaunchApp,
  onDismiss,
  onSelectCategory,
}) => {
  const currentCategory = categories.find((c) => c.id === categoryId) || categories[0];
  const categoryApps = apps.filter((app) => app.category === categoryId);

  // Check which apps are currently blocked by active focus tasks
  const incompleteTasks = activeTasks.filter((t) => !t.completed);
  const isFocusLocked = incompleteTasks.length > 0;

  const isAppAllowed = (app: AppItem) => {
    if (!isFocusLocked) return true;
    if (app.isBaseline) return true;
    return incompleteTasks.some((task) => task.whitelistedAppIds.includes(app.id));
  };

  // Helper to resolve dynamic Lucide icons safely
  const renderIcon = (iconName: string, color: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComp = (LucideIcons as any)[iconName] || LucideIcons.AppWindow;
    return <IconComp className="w-5 h-5" style={{ color }} />;
  };

  const gridColsClass =
    density === 'compact' ? 'grid-cols-5 gap-3' : density === 'spacious' ? 'grid-cols-3 gap-6' : 'grid-cols-4 gap-4';

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Centered Modal Card: Tapping inside does NOT dismiss */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900/95 border border-white/15 rounded-3xl p-6 shadow-2xl shadow-black/90 animate-in zoom-in-95 duration-200"
      >
        {/* Header with Category tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {currentCategory.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{currentCategory.description}</p>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category switcher bar */}
        <div className="flex items-center gap-1.5 py-3 overflow-x-auto no-scrollbar border-b border-white/5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                cat.id === categoryId
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        <div className={`grid ${gridColsClass} py-6 max-h-[380px] overflow-y-auto`}>
          {categoryApps.map((app) => {
            const allowed = isAppAllowed(app);

            return (
              <button
                key={app.id}
                onClick={() => onLaunchApp(app)}
                className={`group flex flex-col items-center text-center p-2 rounded-2xl transition-all cursor-pointer ${
                  allowed
                    ? 'hover:bg-white/5 active:scale-95'
                    : 'opacity-50 hover:bg-red-500/10'
                }`}
              >
                <div
                  className={`relative flex items-center justify-center rounded-2xl shadow-md transition-transform group-hover:scale-105 ${
                    density === 'compact' ? 'w-11 h-11' : density === 'spacious' ? 'w-16 h-16' : 'w-13 h-13'
                  } bg-slate-800/90 border border-white/10`}
                >
                  {renderIcon(app.iconName, app.color)}

                  {!allowed && (
                    <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-600 text-white shadow">
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                  )}

                  {allowed && isFocusLocked && (
                    <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-emerald-600 text-white shadow">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                <span className="text-[11px] font-medium text-slate-300 group-hover:text-white mt-2 truncate w-full">
                  {app.name}
                </span>
                <span className="text-[9px] font-mono text-slate-400 truncate w-full">
                  {allowed ? (app.isBaseline ? 'Baseline' : 'Allowed') : 'Focus Locked'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer info: Tap outside to dismiss hint */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{categoryApps.length} apps installed</span>
          <span className="text-slate-400">Tap outside to close</span>
        </div>
      </div>
    </div>
  );
};
