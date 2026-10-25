import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  ShieldCheck,
  RotateCcw,
  Edit3,
  Search,
  Check,
  Calendar,
} from 'lucide-react';
import { TaskItem, AppItem } from '../../types/launcher';
import { haptics } from '../../utils/audio';

interface TasksModalProps {
  tasks: TaskItem[];
  allApps: AppItem[];
  onAddTask: (
    title: string,
    timers: number[],
    whitelistedAppIds: string[],
    startTime?: string,
    endTime?: string
  ) => void;
  onUpdateTask: (task: TaskItem) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onResetMidnight: () => void;
  onDismiss: () => void;
}

export const TasksModal: React.FC<TasksModalProps> = ({
  tasks,
  allApps,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onResetMidnight,
  onDismiss,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedTimers, setSelectedTimers] = useState<number[]>([15, 30]);
  const [selectedWhitelist, setSelectedWhitelist] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [appSearchQuery, setAppSearchQuery] = useState('');

  const incompleteCount = tasks.filter((t) => !t.completed).length;

  const openCreateForm = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setSelectedTimers([15, 30]);
    setSelectedWhitelist(['docs', 'notes', 'calculator']);
    setStartTime('');
    setEndTime('');
    setAppSearchQuery('');
    setIsEditorOpen(true);
    haptics.playTick();
  };

  const openEditForm = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setSelectedTimers(task.timers || [15, 30]);
    setSelectedWhitelist(task.whitelistedAppIds || []);
    setStartTime(task.startTime || '');
    setEndTime(task.endTime || '');
    setAppSearchQuery('');
    setIsEditorOpen(true);
    haptics.playSnap();
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (editingTaskId) {
      const existing = tasks.find((t) => t.id === editingTaskId);
      if (existing) {
        onUpdateTask({
          ...existing,
          title: taskTitle.trim(),
          timers: selectedTimers,
          whitelistedAppIds: selectedWhitelist,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
        });
      }
    } else {
      onAddTask(
        taskTitle.trim(),
        selectedTimers,
        selectedWhitelist,
        startTime || undefined,
        endTime || undefined
      );
    }

    haptics.playSnap();
    setIsEditorOpen(false);
    setEditingTaskId(null);
  };

  const toggleTimerOption = (mins: number) => {
    haptics.playTick();
    if (selectedTimers.includes(mins)) {
      if (selectedTimers.length > 1) {
        setSelectedTimers(selectedTimers.filter((m) => m !== mins));
      }
    } else {
      if (selectedTimers.length < 3) {
        setSelectedTimers([...selectedTimers, mins].sort((a, b) => a - b));
      }
    }
  };

  const toggleAppWhitelist = (appId: string) => {
    haptics.playTick();
    if (selectedWhitelist.includes(appId)) {
      setSelectedWhitelist(selectedWhitelist.filter((id) => id !== appId));
    } else {
      setSelectedWhitelist([...selectedWhitelist, appId]);
    }
  };

  const selectAllFilteredApps = (appIds: string[]) => {
    haptics.playSnap();
    const merged = Array.from(new Set([...selectedWhitelist, ...appIds]));
    setSelectedWhitelist(merged);
  };

  const clearWhitelist = () => {
    haptics.playTick();
    setSelectedWhitelist([]);
  };

  // Filter apps across complete installed catalog with NO restrictions
  const filteredApps = allApps.filter(
    (app) =>
      app.name.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(appSearchQuery.toLowerCase())
  );

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl shadow-black/90 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white tracking-tight">Focus & Task Hub</h2>
              {incompleteCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono">
                  {incompleteCount} Active Focus Lock
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                  All Clear (Barriers Lifted)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Task scheduling with unrestricted app whitelist filtering.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task List or Create/Edit Form */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4 pr-1">
          {!isEditorOpen ? (
            <>
              {/* Add New Task Button */}
              <button
                onClick={openCreateForm}
                className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-xs font-medium transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Create New Task with App Whitelist & Schedule</span>
              </button>

              {/* Task Items List */}
              <div className="space-y-2.5">
                {tasks.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs font-mono">
                    No active focus tasks. Tap above to add one.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start justify-between p-3.5 rounded-2xl border transition-all ${
                        task.completed
                          ? 'bg-slate-950/60 border-white/5 opacity-60'
                          : 'bg-slate-800/70 border-white/15 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
                        <button
                          onClick={() => {
                            haptics.playSnap();
                            onToggleTask(task.id);
                          }}
                          className="mt-0.5 text-slate-400 hover:text-white cursor-pointer shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400 hover:text-blue-400" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium leading-snug break-words ${
                              task.completed ? 'line-through text-slate-500' : 'text-white'
                            }`}
                          >
                            {task.title}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono text-slate-400">
                            {/* Optional schedule times badge */}
                            {(task.startTime || task.endTime) && (
                              <span className="flex items-center gap-1 text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                <Calendar className="w-3 h-3 text-amber-400" />
                                <span>
                                  {task.startTime || 'Anytime'} – {task.endTime || 'Open'}
                                </span>
                              </span>
                            )}

                            {task.timers && task.timers.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-400" />
                                <span>Timers: {task.timers.join('m, ')}m</span>
                              </span>
                            )}

                            <span>·</span>
                            <span className="flex items-center gap-1 text-emerald-400">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>Whitelisted: {task.whitelistedAppIds?.length || 0} apps</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Edit and Delete Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditForm(task)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                          title="Edit task & schedule"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            haptics.playTick();
                            onDeleteTask(task.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* FULL TASK CREATION & EDITING FORM */
            <form onSubmit={handleSaveTask} className="p-4 rounded-2xl bg-slate-800/90 border border-white/15 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="text-xs font-semibold text-white">
                  {editingTaskId ? 'Edit Deliverable & Whitelist' : 'New Deliverable Configuration'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Task Title Input */}
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Deliverable Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g., Code review client integration"
                  autoFocus
                  className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Optional Start & End Times (Scheduling) */}
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Optional Schedule (Start & End Times)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5">
                    <span className="text-[10px] font-mono text-slate-400">Start:</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-transparent text-white text-xs font-mono focus:outline-none w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5">
                    <span className="text-[10px] font-mono text-slate-400">End:</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="bg-transparent text-white text-xs font-mono focus:outline-none w-full"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>Leave blank if unscheduled.</span>
                  {(startTime || endTime) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartTime('');
                        setEndTime('');
                      }}
                      className="text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Clear times
                    </button>
                  )}
                </div>
              </div>

              {/* Multi-Timer Reminders: 2 to 3 interval alert reminders */}
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1.5">
                  Interval Reminders (Select 2–3)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[15, 25, 30, 45, 60, 90].map((mins) => {
                    const active = selectedTimers.includes(mins);
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => toggleTimerOption(mins)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UNRESTRICTED APP WHITELIST: Searchable Multi-Select Checklist */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-mono uppercase text-slate-400">
                      Unrestricted App Whitelist
                    </label>
                    {/* Live quantity counter */}
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-semibold">
                      Whitelisted: {selectedWhitelist.length} apps
                    </span>
                  </div>

                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => selectAllFilteredApps(filteredApps.map((a) => a.id))}
                      className="text-blue-400 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearWhitelist}
                      className="text-slate-400 hover:text-white hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* App Search Bar */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    placeholder="Search any installed app to whitelist..."
                    className="w-full bg-slate-900 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  {appSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAppSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Multi-Select App Checklist (All installed apps) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {filteredApps.map((app) => {
                    const isChecked = selectedWhitelist.includes(app.id);
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => toggleAppWhitelist(app.id)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] truncate transition-all text-left cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-600/25 border border-emerald-500/60 text-emerald-200'
                            : 'bg-slate-900/70 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-white/20 bg-slate-800'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate flex-1">{app.name}</span>
                        {app.isBaseline && (
                          <span className="text-[9px] font-mono text-slate-500 shrink-0">base</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Any app not whitelisted here will be blocked by the focus barrier until deliverable is checked off.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!taskTitle.trim()}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow transition-all cursor-pointer"
                >
                  {editingTaskId ? 'Save Deliverable Changes' : 'Arm Focus Barrier'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer: Midnight Reset Simulator */}
        <div className="pt-3 border-t border-white/10 shrink-0 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Auto-purges completed tasks at 00:00</span>
          </div>

          <button
            onClick={() => {
              haptics.playTick();
              onResetMidnight();
            }}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Simulate Midnight Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
