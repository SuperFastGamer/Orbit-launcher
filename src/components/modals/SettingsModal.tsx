import React, { useState } from 'react';
import {
  X,
  Sliders,
  FolderCog,
  ShieldAlert,
  ListFilter,
  Lock,
  Sparkles,
  Palette,
  Volume2,
  Check,
  Plus,
  Trash2,
  Hand,
  Activity,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MousePointerClick,
  Timer,
  Search,
  CheckSquare,
  Settings as SettingsIcon,
  RotateCcw,
  Smartphone,
  Home,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  LauncherSettings,
  ThemeId,
  AppCategory,
  AppItem,
  SpringStyle,
  GestureMapping,
  GestureTrigger,
  GestureAction,
} from '../../types/launcher';
import { DEFAULT_GESTURE_MAPPINGS } from '../../data/defaultTasks';
import { haptics } from '../../utils/audio';

interface SettingsModalProps {
  settings: LauncherSettings;
  categories: AppCategory[];
  apps: AppItem[];
  onUpdateSettings: (newSettings: Partial<LauncherSettings>) => void;
  onUpdateCategories: (newCats: AppCategory[]) => void;
  onReassignCategory?: (appId: string, newCategory: string) => void;
  onRestartTutorial: () => void;
  onDismiss: () => void;
}

type SettingsSection = 'visuals' | 'gestures' | 'shortcuts' | 'folders' | 'emergency' | 'focus' | 'security';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  categories,
  apps,
  onUpdateSettings,
  onUpdateCategories,
  onReassignCategory,
  onRestartTutorial,
  onDismiss,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('shortcuts');

  // Gesture Mapping Editor State
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [selectedActionType, setSelectedActionType] = useState<GestureAction['type']>('launch_app');
  const [selectedAppId, setSelectedAppId] = useState<string>('camera');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('social');
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [baselineSearchQuery, setBaselineSearchQuery] = useState('');
  const [folderAppSearchQuery, setFolderAppSearchQuery] = useState('');
  const [activeFolderPickerAppId, setActiveFolderPickerAppId] = useState<string | null>(null);
  const [gestureTestFeedback, setGestureTestFeedback] = useState<string | null>(null);

  // Gesture Test Pad touch tracking
  const [testTouchStart, setTestTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [lastTapTime, setLastTapTime] = useState<number>(0);

  // Emergency contact edit state
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');

  // Pin change state
  const [pinInput, setPinInput] = useState(settings.securityPin);

  const gestureMappings = settings.gestureMappings || DEFAULT_GESTURE_MAPPINGS;

  const THEMES: { id: ThemeId; name: string; hex: string }[] = [
    { id: 'obsidian', name: 'Obsidian Mono', hex: '#FFFFFF' },
    { id: 'cyber', name: 'Cyber Neon', hex: '#22D3EE' },
    { id: 'crimson', name: 'Crimson Aurora', hex: '#F43F5E' },
    { id: 'aurora', name: 'Emerald Aurora', hex: '#34D399' },
    { id: 'gold', name: 'Solar Gold', hex: '#FBBF24' },
  ];

  const SPRING_STYLES: { id: SpringStyle; name: string; desc: string }[] = [
    { id: 'snappy', name: 'Snappy', desc: 'Tight, rapid, high-stiffness response' },
    { id: 'smooth', name: 'Smooth', desc: 'Fluid, low-bouncy gentle settling' },
    { id: 'bouncy', name: 'Bouncy', desc: 'Tactile spring overshoot & rebound' },
  ];

  const handleOpenGestureEditor = (mapping: GestureMapping) => {
    setEditingMappingId(mapping.id);
    setSelectedActionType(mapping.action.type);
    setSelectedAppId(mapping.action.appId || 'camera');
    setSelectedCategoryId(mapping.action.categoryId || 'social');
    setAppSearchQuery('');
    haptics.playSnap();
  };

  const handleSaveGestureMapping = () => {
    if (!editingMappingId) return;

    let actionLabel = 'Action';
    if (selectedActionType === 'launch_default_launcher') {
      actionLabel = 'Default Phone Launcher';
    } else if (selectedActionType === 'toggle_emergency') {
      actionLabel = 'Toggle Emergency Mode';
    } else if (selectedActionType === 'launch_app') {
      const app = apps.find((a) => a.id === selectedAppId);
      actionLabel = app ? `Launch ${app.name}` : 'Launch App';
    } else if (selectedActionType === 'open_search') {
      actionLabel = 'Universal Search';
    } else if (selectedActionType === 'open_tasks') {
      actionLabel = 'Tasks & Focus Hub';
    } else if (selectedActionType === 'open_settings') {
      actionLabel = 'Settings Hub';
    } else if (selectedActionType === 'open_folder') {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      actionLabel = cat ? `Open ${cat.name}` : 'Open Folder';
    } else {
      actionLabel = 'Disabled';
    }

    const updated = gestureMappings.map((m) => {
      if (m.id === editingMappingId) {
        return {
          ...m,
          action: {
            type: selectedActionType,
            appId: selectedActionType === 'launch_app' ? selectedAppId : undefined,
            categoryId: selectedActionType === 'open_folder' ? selectedCategoryId : undefined,
            label: actionLabel,
          },
        };
      }
      return m;
    });

    onUpdateSettings({ gestureMappings: updated });
    setEditingMappingId(null);
    haptics.playSnap();
  };

  const handleResetGestures = () => {
    onUpdateSettings({ gestureMappings: DEFAULT_GESTURE_MAPPINGS });
    haptics.playSnap();
  };

  const getTriggerIcon = (trigger: GestureTrigger) => {
    switch (trigger) {
      case 'swipe_up':
        return <ArrowUp className="w-4 h-4 text-blue-400" />;
      case 'swipe_down':
        return <ArrowDown className="w-4 h-4 text-emerald-400" />;
      case 'swipe_left':
        return <ArrowLeft className="w-4 h-4 text-rose-400" />;
      case 'swipe_right':
        return <ArrowRight className="w-4 h-4 text-amber-400" />;
      case 'double_tap':
        return <MousePointerClick className="w-4 h-4 text-cyan-400" />;
      case 'long_press':
        return <Timer className="w-4 h-4 text-purple-400" />;
      case 'triple_tap':
        return <MousePointerClick className="w-4 h-4 text-indigo-400" />;
      case 'two_finger_tap':
        return <Hand className="w-4 h-4 text-teal-400" />;
    }
  };

  const renderActionBadge = (action: GestureAction) => {
    switch (action.type) {
      case 'launch_default_launcher':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-medium">
            <Home className="w-3.5 h-3.5 text-amber-400" />
            <span>Default Phone Launcher</span>
          </span>
        );
      case 'toggle_emergency':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Toggle Emergency Mode</span>
          </span>
        );
      case 'launch_app': {
        const targetApp = apps.find((a) => a.id === action.appId);
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-medium">
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <span>Launch: {targetApp?.name || action.label || 'App'}</span>
          </span>
        );
      }
      case 'open_search':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-500/40 text-sky-300 text-xs font-medium">
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span>Universal Search</span>
          </span>
        );
      case 'open_tasks':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-medium">
            <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>Tasks & Focus Hub</span>
          </span>
        );
      case 'open_settings':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-medium">
            <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Settings Hub</span>
          </span>
        );
      case 'open_folder':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-medium">
            <FolderCog className="w-3.5 h-3.5 text-indigo-400" />
            <span>Folder: {action.categoryId}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-white/5 text-slate-400 text-xs">
            Disabled
          </span>
        );
    }
  };

  // Test pad handler
  const handleTestPointerDown = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTestTouchStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: Date.now(),
    });

    // Check double tap
    const now = Date.now();
    if (now - lastTapTime < 320) {
      triggerTestGesture('double_tap');
      setLastTapTime(0);
      return;
    }
    setLastTapTime(now);
  };

  const handleTestPointerUp = (e: React.PointerEvent) => {
    if (!testTouchStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const dx = endX - testTouchStart.x;
    const dy = endY - testTouchStart.y;
    const dist = Math.hypot(dx, dy);
    const duration = Date.now() - testTouchStart.time;

    setTestTouchStart(null);

    // If held still for > 450ms -> long press
    if (dist < 15 && duration > 450) {
      triggerTestGesture('long_press');
      return;
    }

    if (dist > 30) {
      // Swipe direction detection
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) triggerTestGesture('swipe_right');
        else triggerTestGesture('swipe_left');
      } else {
        if (dy > 0) triggerTestGesture('swipe_down');
        else triggerTestGesture('swipe_up');
      }
    }
  };

  const triggerTestGesture = (trigger: GestureTrigger) => {
    const mapping = gestureMappings.find((m) => m.trigger === trigger);
    haptics.playSnap();
    if (mapping && mapping.action.type !== 'none') {
      setGestureTestFeedback(`Triggered ${mapping.triggerName}: ${mapping.action.label || mapping.action.type}`);
    } else {
      setGestureTestFeedback(`Recognized ${trigger} (Unassigned)`);
    }
    setTimeout(() => setGestureTestFeedback(null), 3000);
  };

  const handleAddEmergencyContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    const updated = [
      ...settings.emergencyContacts,
      {
        name: newContactName.trim(),
        number: newContactPhone.trim(),
        relation: newContactRelation.trim() || 'Emergency Contact',
      },
    ];
    onUpdateSettings({ emergencyContacts: updated });
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRelation('');
    haptics.playSnap();
  };

  const handleRemoveContact = (index: number) => {
    const updated = settings.emergencyContacts.filter((_, i) => i !== index);
    onUpdateSettings({ emergencyContacts: updated });
    haptics.playTick();
  };

  const filteredApps = apps.filter(
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
        className="w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl shadow-black/90 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Launcher Preferences</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Custom gesture shortcuts, radial physics, emergency engine, and security guards.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 py-3 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'shortcuts', label: 'Gesture Shortcuts', icon: Sparkles },
            { id: 'gestures', label: 'Physics & Sensitivity', icon: Hand },
            { id: 'visuals', label: 'Visuals & Themes', icon: Sliders },
            { id: 'folders', label: 'App Folders', icon: FolderCog },
            { id: 'emergency', label: 'Emergency Engine', icon: ShieldAlert },
            { id: 'focus', label: 'Task & Focus Rules', icon: ListFilter },
            { id: 'security', label: 'Security & PIN', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptics.playTick();
                  setActiveSection(tab.id as SettingsSection);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Section Content */}
        <div className="py-4 overflow-y-auto flex-1 space-y-6 pr-1">
          {/* SECTION: CUSTOM GESTURE MAPPING SCREEN */}
          {activeSection === 'shortcuts' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Custom Swipe & Gesture Shortcuts</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Map gestures from the center ball to directly launch any app or toggle emergency mode.
                  </p>
                </div>
                <button
                  onClick={handleResetGestures}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                  title="Restore default gesture shortcuts"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              {/* Gesture Mappings Cards List */}
              <div className="space-y-2.5">
                {gestureMappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className="p-3.5 rounded-2xl bg-slate-800/70 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                        {getTriggerIcon(mapping.trigger)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white tracking-wide">
                          {mapping.triggerName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {mapping.triggerDesc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {renderActionBadge(mapping.action)}
                      <button
                        onClick={() => handleOpenGestureEditor(mapping)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer transition-all active:scale-95"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Gesture Test Pad */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Hand className="w-4 h-4 text-emerald-400" />
                    <span>Live Gesture Testing Pad</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Swipe or tap inside to test</span>
                </div>

                <div
                  onPointerDown={handleTestPointerDown}
                  onPointerUp={handleTestPointerUp}
                  className="w-full h-24 rounded-xl border border-dashed border-white/20 bg-slate-950/60 flex flex-col items-center justify-center cursor-pointer select-none touch-none active:bg-blue-950/20 transition-all"
                >
                  {gestureTestFeedback ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-semibold animate-pulse border border-blue-500/40">
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                      <span>{gestureTestFeedback}</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-slate-400 font-medium">
                        Swipe Up, Down, Left, Right or Double-Tap here
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Interactive hardware verification sandbox
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* GESTURE ACTION MAPPING EDITOR MODAL / DRAWER */}
              {editingMappingId && (
                <div className="p-4 rounded-2xl bg-slate-800/95 border-2 border-blue-500/60 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Map Action for</span>
                      <span className="text-blue-400">
                        {gestureMappings.find((m) => m.id === editingMappingId)?.triggerName}
                      </span>
                    </div>
                    <button
                      onClick={() => setEditingMappingId(null)}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Action Type Selection */}
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
                      Select Action Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedActionType('launch_default_launcher')}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                          selectedActionType === 'launch_default_launcher'
                            ? 'bg-amber-600 text-white border-amber-400 shadow'
                            : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-amber-300" />
                          <span>Default Launcher</span>
                        </div>
                        <div className="text-[10px] text-white/70 mt-0.5">Phone native launcher</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedActionType('launch_app')}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                          selectedActionType === 'launch_app'
                            ? 'bg-blue-600 text-white border-blue-400 shadow'
                            : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-blue-300" />
                          <span>Launch App</span>
                        </div>
                        <div className="text-[10px] text-white/70 mt-0.5">Any installed app</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedActionType('toggle_emergency')}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                          selectedActionType === 'toggle_emergency'
                            ? 'bg-red-600 text-white border-red-400 shadow'
                            : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-300" />
                          <span>Emergency Mode</span>
                        </div>
                        <div className="text-[10px] text-white/70 mt-0.5">Instant high-alert toggle</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedActionType('open_search')}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                          selectedActionType === 'open_search'
                            ? 'bg-sky-600 text-white border-sky-400 shadow'
                            : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-sky-300" />
                          <span>Universal Search</span>
                        </div>
                        <div className="text-[10px] text-white/70 mt-0.5">Top slide search bar</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedActionType('open_tasks')}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                          selectedActionType === 'open_tasks'
                            ? 'bg-purple-600 text-white border-purple-400 shadow'
                            : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-purple-300" />
                          <span>Tasks & Focus</span>
                        </div>
                        <div className="text-[10px] text-white/70 mt-0.5">Focus deliverables</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedActionType('open_settings')}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                          selectedActionType === 'open_settings'
                            ? 'bg-amber-600 text-white border-amber-400 shadow'
                            : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <SettingsIcon className="w-3.5 h-3.5 text-amber-300" />
                          <span>Settings</span>
                        </div>
                        <div className="text-[10px] text-white/70 mt-0.5">Launcher controls</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedActionType('none')}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                          selectedActionType === 'none'
                            ? 'bg-slate-700 text-white border-slate-500 shadow'
                            : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5 text-slate-400" />
                          <span>Disable</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">No shortcut action</div>
                      </button>
                    </div>
                  </div>

                  {/* Sub-selector when "Launch App" is selected */}
                  {selectedActionType === 'launch_app' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">
                        Choose Target Application to Launch
                      </label>

                      {/* App search */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={appSearchQuery}
                          onChange={(e) => setAppSearchQuery(e.target.value)}
                          placeholder="Filter installed apps..."
                          className="w-full bg-slate-900 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* App grid list */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {filteredApps.map((app) => {
                          const isSelected = selectedAppId === app.id;
                          return (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => {
                                setSelectedAppId(app.id);
                                haptics.playTick();
                              }}
                              className={`flex items-center gap-2 p-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600/30 border border-blue-400 text-white font-medium'
                                  : 'bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white'
                              }`}
                            >
                              <span
                                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: app.color }}
                              />
                              <span className="truncate flex-1">{app.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Save and Cancel buttons */}
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingMappingId(null)}
                      className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveGestureMapping}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow cursor-pointer transition-all"
                    >
                      Save Shortcut Mapping
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: GESTURES & SENSITIVITY */}
          {activeSection === 'gestures' && (
            <div className="space-y-5">
              {/* Drag Expansion Radius Slider */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-white">Drag Expansion Radius</span>
                  </div>
                  <span className="font-mono text-blue-400 font-semibold">{settings.ringRadius}px</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Adjusts how far satellite hubs and Ring 2 sub-spheres bloom outward from the center.
                </p>
                <input
                  type="range"
                  min="90"
                  max="200"
                  value={settings.ringRadius}
                  onChange={(e) => onUpdateSettings({ ringRadius: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>90px (Tight reach)</span>
                  <span>140px (Standard)</span>
                  <span>200px (Wide spread)</span>
                </div>
              </div>

              {/* Touch Deadzone & Sensitivity Slider */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Hand className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium text-white">Touch Deadzone & Sensitivity</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-semibold">{settings.touchDeadzone || 28}px</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Minimum drag distance required before satellite hubs start blooming from rest state.
                </p>
                <input
                  type="range"
                  min="15"
                  max="48"
                  value={settings.touchDeadzone || 28}
                  onChange={(e) => onUpdateSettings({ touchDeadzone: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>15px (Ultra-sensitive)</span>
                  <span>28px (Balanced)</span>
                  <span>48px (Strict deadzone)</span>
                </div>
              </div>

              {/* Animation Style Selector */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Animation Spring Physics Style</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SPRING_STYLES.map((style) => {
                    const isSelected = (settings.animationStyle || 'smooth') === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => {
                          haptics.playSnap();
                          onUpdateSettings({ animationStyle: style.id });
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs font-semibold">{style.name}</div>
                        <div className="text-[10px] text-white/70 mt-1 leading-tight">{style.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Haptic Vibration Feedback Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-white/5">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Haptic Feedback & Node Snapping</div>
                    <div className="text-[11px] text-slate-400">
                      Vibration clicks when expanding rings and snapping into hubs or sub-spheres
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.hapticsEnabled ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.hapticsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3: VISUALS & PALETTE */}
          {activeSection === 'visuals' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-white flex items-center gap-1.5 mb-2.5">
                  <Palette className="w-4 h-4 text-blue-400" />
                  <span>Color Theme</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {THEMES.map((theme) => {
                    const isSelected = settings.colorTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => {
                          haptics.playSnap();
                          onUpdateSettings({ colorTheme: theme.id });
                        }}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-white text-white shadow-md'
                            : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shadow-sm shrink-0"
                          style={{ backgroundColor: theme.hex }}
                        />
                        <span className="text-xs font-medium">{theme.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-white">Center Anchor Ball Diameter</span>
                  <span className="font-mono text-blue-400">{settings.centerBallSize}px</span>
                </div>
                <input
                  type="range"
                  min="44"
                  max="76"
                  value={settings.centerBallSize}
                  onChange={(e) => onUpdateSettings({ centerBallSize: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onDismiss();
                    onRestartTutorial();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-amber-400 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Re-launch First-Run Interactive Tutorial</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 4: APP FOLDERS MANAGEMENT */}
          {activeSection === 'folders' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white block mb-2">
                  Modal Layout Grid Density
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'normal', 'spacious'] as const).map((density) => (
                    <button
                      key={density}
                      onClick={() => onUpdateSettings({ layoutDensity: density })}
                      className={`p-3 rounded-xl border text-center capitalize text-xs font-medium transition-all cursor-pointer ${
                        settings.layoutDensity === density
                          ? 'bg-blue-600 text-white border-blue-400 shadow'
                          : 'bg-slate-800/80 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>

              {/* App Category Reassignment (Move Apps Between Folders) */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-white block">
                      Reassign Apps to Folders
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Tap a folder pill next to any app to move it into Social, Media, Work, Finance, or Games
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-800/40">
                    {apps.length} apps installed
                  </span>
                </div>

                {/* Filter search bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={folderAppSearchQuery}
                    onChange={(e) => setFolderAppSearchQuery(e.target.value)}
                    placeholder="Search apps to reassign folders..."
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* App list */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {apps
                    .filter(
                      (app) =>
                        !folderAppSearchQuery ||
                        app.name.toLowerCase().includes(folderAppSearchQuery.toLowerCase()) ||
                        app.packageName.toLowerCase().includes(folderAppSearchQuery.toLowerCase())
                    )
                    .map((app) => {
                      const isPickerOpen = activeFolderPickerAppId === app.id;
                      const folderCategories = [
                        { id: 'social', name: 'Social', color: '#EC4899' },
                        { id: 'media', name: 'Media', color: '#8B5CF6' },
                        { id: 'work', name: 'Work', color: '#3B82F6' },
                        { id: 'finance', name: 'Finance', color: '#10B981' },
                        { id: 'games', name: 'Games', color: '#F59E0B' },
                      ];

                      return (
                        <div
                          key={app.id}
                          className="p-2.5 rounded-xl bg-slate-800/70 border border-white/10 flex flex-col gap-2 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: app.color }}
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-white truncate">{app.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{app.packageName}</div>
                              </div>
                            </div>

                            {/* Current Category Pill */}
                            <button
                              type="button"
                              onClick={() =>
                                setActiveFolderPickerAppId(isPickerOpen ? null : app.id)
                              }
                              className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:brightness-110 flex items-center gap-1 shrink-0"
                              style={{
                                backgroundColor:
                                  folderCategories.find((c) => c.id === app.category)?.color || '#64748B',
                              }}
                            >
                              <span>{app.category}</span>
                              <span className="text-[9px] opacity-70">▼</span>
                            </button>
                          </div>

                          {/* Inline Category Switcher Chips */}
                          {isPickerOpen && (
                            <div className="grid grid-cols-5 gap-1 pt-1 border-t border-white/5">
                              {folderCategories.map((cat) => {
                                const isCurrent = app.category === cat.id;
                                return (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                      onReassignCategory?.(app.id, cat.id);
                                      setActiveFolderPickerAppId(null);
                                    }}
                                    className={`py-1 px-1 rounded-lg text-[9px] font-medium text-center transition-all cursor-pointer truncate ${
                                      isCurrent
                                        ? 'bg-sky-400 text-black font-bold shadow'
                                        : 'bg-slate-700/80 text-white/90 hover:bg-slate-600'
                                    }`}
                                  >
                                    {cat.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: EMERGENCY MODE ENGINE */}
          {activeSection === 'emergency' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-white block mb-2">
                  High-Alert Visual Indicator Accent
                </label>
                <div className="flex items-center gap-3">
                  {['#EF4444', '#DC2626', '#F87171', '#FF3B30'].map((color) => (
                    <button
                      key={color}
                      onClick={() => onUpdateSettings({ emergencyColor: color })}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        settings.emergencyColor === color ? 'scale-125 ring-2 ring-white' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {settings.emergencyColor === color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-2">
                  Lockdown Barrier Strictness
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onUpdateSettings({ emergencyStrictness: 'high' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.emergencyStrictness === 'high'
                        ? 'bg-red-950/80 border-red-500/60 text-white'
                        : 'bg-slate-800/60 border-white/5 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-semibold">Standard Emergency</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Blocks folders, search, tasks & settings. Phone & Calls stay open.
                    </div>
                  </button>

                  <button
                    onClick={() => onUpdateSettings({ emergencyStrictness: 'maximum' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.emergencyStrictness === 'maximum'
                        ? 'bg-red-950/80 border-red-500/60 text-white'
                        : 'bg-slate-800/60 border-white/5 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-semibold">Maximum Lockdown</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Absolute silence. Only emergency dispatch & verified primary contacts.
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-2">
                  Designated Emergency Contacts
                </label>
                <div className="space-y-2 mb-3">
                  {settings.emergencyContacts.map((contact, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-white/5"
                    >
                      <div>
                        <div className="text-xs font-medium text-white">{contact.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {contact.relation} · {contact.number}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveContact(i)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddEmergencyContact} className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Contact Name"
                    className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                  />
                  <input
                    type="text"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder="Phone number"
                    className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newContactRelation}
                      onChange={(e) => setNewContactRelation(e.target.value)}
                      placeholder="Relation"
                      className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 w-full"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SECTION 6: TASK & FOCUS RULES */}
          {activeSection === 'focus' && (
            <div className="space-y-4">
              {/* 1. Focus Lock Strictness */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Focus Lock Strictness</div>
                    <div className="text-[11px] text-slate-400">
                      Determine how non-whitelisted apps behave when tasks are incomplete
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                      (settings.focusStrictness || 'strict') === 'strict'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}
                  >
                    {settings.focusStrictness === 'gentle' ? 'Gentle Alert' : 'Strict Lockdown'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ focusStrictness: 'gentle' });
                      haptics.playSnap();
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.focusStrictness === 'gentle'
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-semibold">Gentle Alert</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Displays a gentle reminder banner but allows intentional bypass
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ focusStrictness: 'strict' });
                      haptics.playSnap();
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      (settings.focusStrictness || 'strict') === 'strict'
                        ? 'bg-red-600/20 border-red-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-semibold">Strict Lockdown</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Hard barrier that completely blocks non-whitelisted apps
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Permanent Baseline Whitelist */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Permanent Baseline Whitelist</div>
                    <div className="text-[11px] text-slate-400">
                      Apps permanently exempted from focus restrictions across all tasks
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Whitelisted: {(settings.baselineAppIds || []).length} apps
                  </span>
                </div>

                {/* Search installed apps */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={baselineSearchQuery}
                    onChange={(e) => setBaselineSearchQuery(e.target.value)}
                    placeholder="Search all installed apps..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  {baselineSearchQuery && (
                    <button
                      onClick={() => setBaselineSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Searchable multi-select checklist */}
                <div className="max-h-44 overflow-y-auto space-y-1 pr-1 border border-white/5 rounded-xl p-1 bg-slate-900/50">
                  {apps
                    .filter((app) =>
                      baselineSearchQuery.trim() === ''
                        ? true
                        : app.name.toLowerCase().includes(baselineSearchQuery.toLowerCase()) ||
                          app.category.toLowerCase().includes(baselineSearchQuery.toLowerCase())
                    )
                    .map((app) => {
                      const isWhitelisted = (settings.baselineAppIds || []).includes(app.id);
                      return (
                        <div
                          key={app.id}
                          onClick={() => {
                            const current = settings.baselineAppIds || [];
                            const next = isWhitelisted
                              ? current.filter((id) => id !== app.id)
                              : [...current, app.id];
                            onUpdateSettings({ baselineAppIds: next });
                            haptics.playSnap();
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                            isWhitelisted
                              ? 'bg-blue-600/25 text-white border border-blue-500/40'
                              : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: app.color }} />
                            <span className="font-medium">{app.name}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-mono">{app.category}</span>
                          </div>

                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isWhitelisted
                                ? 'bg-blue-600 border-blue-400 text-white'
                                : 'border-white/20 bg-slate-800'
                            }`}
                          >
                            {isWhitelisted && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 3. Reminder Interval Defaults */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 space-y-2">
                <div className="text-xs font-semibold text-white">Reminder Interval Defaults</div>
                <div className="text-[11px] text-slate-400">
                  Default notification schedule timing for task focus reminders
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: '15m_before', label: '15m Before' },
                    { id: 'on_start', label: 'On Start Time' },
                    { id: '30m_overdue', label: '30m Overdue' },
                  ].map((interval) => {
                    const isSelected = (settings.reminderIntervalDefault || 'on_start') === interval.id;
                    return (
                      <button
                        key={interval.id}
                        type="button"
                        onClick={() => {
                          onUpdateSettings({
                            reminderIntervalDefault: interval.id as LauncherSettings['reminderIntervalDefault'],
                          });
                          haptics.playSnap();
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-400 shadow'
                            : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {interval.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Midnight Auto-Purge & Auto-Focus on Task Start Toggles */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Midnight Auto-Purge</div>
                    <div className="text-[11px] text-slate-400">
                      Automatically archive completed tasks and reset daily ledger at 00:00 midnight
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ midnightAutoPurge: !settings.midnightAutoPurge });
                      haptics.playSnap();
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      settings.midnightAutoPurge !== false ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.midnightAutoPurge !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Auto-Focus on Task Start</div>
                    <div className="text-[11px] text-slate-400">
                      Automatically lock non-whitelisted apps when a scheduled task reaches its start time
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ autoFocusOnTaskStart: !settings.autoFocusOnTaskStart });
                      haptics.playSnap();
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      settings.autoFocusOnTaskStart !== false ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.autoFocusOnTaskStart !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: SECURITY & PRIVACY */}
          {activeSection === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-white/5">
                <div>
                  <div className="text-xs font-semibold text-white">Require PIN for Settings</div>
                  <div className="text-[11px] text-slate-400">
                    Prompt for 4-digit security code before opening preferences
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      pinRequiredForSettings: !settings.pinRequiredForSettings,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.pinRequiredForSettings ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.pinRequiredForSettings ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 space-y-2">
                <label className="text-xs font-semibold text-white block">
                  Security PIN Code (Current: {settings.securityPin})
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="4-digit PIN"
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono tracking-widest w-32 text-center"
                  />
                  <button
                    onClick={() => {
                      if (pinInput.length === 4) {
                        onUpdateSettings({ securityPin: pinInput });
                        haptics.playSnap();
                      }
                    }}
                    disabled={pinInput.length !== 4}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Save PIN
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 shrink-0 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Orbital Launcher v1.2.0</span>
          <button
            onClick={onDismiss}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
