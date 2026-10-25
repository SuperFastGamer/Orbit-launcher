import { TaskItem, LauncherSettings } from '../types/launcher';

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Review quarterly client deliverable doc',
    completed: false,
    createdAt: Date.now() - 3600000,
    timers: [15, 30, 45],
    whitelistedAppIds: ['docs', 'files', 'notes', 'calculator', 'calendar'],
    startTime: '09:00',
    endTime: '11:00',
  },
  {
    id: 'task-2',
    title: 'Deep Focus Coding Session (No Distractions)',
    completed: false,
    createdAt: Date.now() - 7200000,
    timers: [25, 50],
    whitelistedAppIds: ['docs', 'notes', 'clock'],
    startTime: '13:00',
    endTime: '15:30',
  },
  {
    id: 'task-3',
    title: 'Daily financial ledger balance',
    completed: true,
    createdAt: Date.now() - 14400000,
    completedAt: Date.now() - 7000000,
    timers: [20],
    whitelistedAppIds: ['revolut', 'calculator'],
  },
];

export const DEFAULT_GESTURE_MAPPINGS: import('../types/launcher').GestureMapping[] = [
  {
    id: 'g-up',
    trigger: 'swipe_up',
    triggerName: 'Quick Swipe Up',
    triggerDesc: 'Flick upward from center ball (towards top)',
    action: { type: 'open_search', label: 'Universal Search' },
  },
  {
    id: 'g-down',
    trigger: 'swipe_down',
    triggerName: 'Quick Swipe Down',
    triggerDesc: 'Flick downward from center ball (towards bottom)',
    action: { type: 'open_tasks', label: 'Tasks & Focus Hub' },
  },
  {
    id: 'g-left',
    trigger: 'swipe_left',
    triggerName: 'Quick Swipe Left',
    triggerDesc: 'Flick leftward from center ball',
    action: { type: 'toggle_emergency', label: 'Toggle Emergency Mode' },
  },
  {
    id: 'g-right',
    trigger: 'swipe_right',
    triggerName: 'Quick Swipe Right',
    triggerDesc: 'Flick rightward from center ball',
    action: { type: 'launch_app', appId: 'camera', label: 'Launch Camera' },
  },
  {
    id: 'g-double-tap',
    trigger: 'double_tap',
    triggerName: 'Double Tap Center',
    triggerDesc: 'Quick double-tap on center anchor ball',
    action: { type: 'launch_default_launcher', label: 'Default Phone Launcher' },
  },
  {
    id: 'g-long-press',
    trigger: 'long_press',
    triggerName: 'Long Press Center',
    triggerDesc: 'Press and hold center anchor ball (500ms)',
    action: { type: 'open_settings', label: 'Open Settings Hub' },
  },
  {
    id: 'g-triple-tap',
    trigger: 'triple_tap',
    triggerName: 'Triple Tap Center',
    triggerDesc: 'Quick triple-tap on center anchor ball',
    action: { type: 'none', label: 'Disabled' },
  },
  {
    id: 'g-two-finger-tap',
    trigger: 'two_finger_tap',
    triggerName: 'Two-Finger Tap',
    triggerDesc: 'Tap with two fingers simultaneously',
    action: { type: 'none', label: 'Disabled' },
  },
];

export const DEFAULT_SETTINGS: LauncherSettings = {
  centerBallSize: 56, // px
  ringRadius: 138, // px
  colorTheme: 'obsidian',
  bloomSpeed: 1.0,
  hapticsEnabled: true,
  touchDeadzone: 28, // px
  animationStyle: 'smooth',
  layoutDensity: 'normal',
  emergencyColor: '#EF4444',
  emergencyStrictness: 'high',
  emergencyContacts: [
    { name: 'Dr. Sarah Evans', number: '+1 (555) 234-5678', relation: 'Medical' },
    { name: 'Mom Direct', number: '+1 (555) 987-6543', relation: 'Family' },
    { name: 'Alex Johnson', number: '+1 (555) 345-6789', relation: 'Primary Contact' },
  ],
  baselineAppIds: ['phone', 'contacts', 'messages', 'clock', 'maps'],
  securityPin: '1234',
  pinRequiredForSettings: false,
  pinRequiredForHidden: true,
  gestureMappings: DEFAULT_GESTURE_MAPPINGS,
  focusStrictness: 'strict',
  reminderIntervalDefault: 'on_start',
  midnightAutoPurge: true,
  autoFocusOnTaskStart: true,
};
