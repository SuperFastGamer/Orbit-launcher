export type HubId = 'folders' | 'search' | 'emergency' | 'calls' | 'tasks' | 'settings';

export interface AppCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface AppItem {
  id: string;
  name: string;
  packageName: string;
  category: string; // 'social' | 'media' | 'work' | 'finance' | 'games' | 'system'
  iconName: string;
  color: string;
  isBaseline?: boolean;
  isEmergencyAllowed?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  timers: number[]; // e.g. [15, 30, 45] minutes
  whitelistedAppIds: string[]; // only these apps can be opened while task is incomplete
  startTime?: string; // Optional start time (e.g. "09:00")
  endTime?: string; // Optional end time (e.g. "11:30")
}

export type ThemeId = 'obsidian' | 'cyber' | 'crimson' | 'aurora' | 'gold';
export type SpringStyle = 'snappy' | 'smooth' | 'bouncy';

export type GestureTrigger =
  | 'swipe_up'
  | 'swipe_down'
  | 'swipe_left'
  | 'swipe_right'
  | 'double_tap'
  | 'long_press'
  | 'triple_tap'
  | 'two_finger_tap';

export type GestureActionType =
  | 'launch_default_launcher'
  | 'launch_app'
  | 'toggle_emergency'
  | 'open_search'
  | 'open_tasks'
  | 'open_settings'
  | 'open_folder'
  | 'quick_dial'
  | 'none';

export interface GestureAction {
  type: GestureActionType;
  appId?: string; // target app id for launch_app
  categoryId?: string; // target folder category id
  contactNumber?: string;
  label?: string;
}

export interface GestureMapping {
  id: string;
  trigger: GestureTrigger;
  triggerName: string;
  triggerDesc: string;
  action: GestureAction;
}

export interface LauncherSettings {
  centerBallSize: number; // in px: 44 - 76
  ringRadius: number; // in px: 90 - 200
  colorTheme: ThemeId;
  bloomSpeed: number; // 0.8 - 1.5
  hapticsEnabled: boolean;
  touchDeadzone: number; // in px: 15 - 48 (sensitivity)
  animationStyle: SpringStyle;
  layoutDensity: 'compact' | 'normal' | 'spacious';
  emergencyColor: string; // hex code
  emergencyStrictness: 'high' | 'maximum';
  emergencyContacts: { name: string; number: string; relation: string }[];
  baselineAppIds: string[];
  securityPin: string;
  pinRequiredForSettings: boolean;
  pinRequiredForHidden: boolean;
  gestureMappings: GestureMapping[];
  // Task & Focus Rules configuration
  focusStrictness: 'gentle' | 'strict';
  reminderIntervalDefault: '15m_before' | 'on_start' | '30m_overdue';
  midnightAutoPurge: boolean;
  autoFocusOnTaskStart: boolean;
}

export interface TutorialState {
  isActive: boolean;
  currentStep: 1 | 2 | 3 | 4;
  completedSteps: number[];
}

export type ActiveModal = 
  | { type: 'none' }
  | { type: 'app_folder'; categoryId: string }
  | { type: 'search' }
  | { type: 'tasks' }
  | { type: 'settings' }
  | { type: 'calls_contacts' }
  | { type: 'calls_dialer' }
  | { type: 'security_pin_check'; targetAction: 'settings' }
  | { type: 'app_launch_sim'; app: AppItem }
  | { type: 'focus_blocked'; app: AppItem; blockingTasks: string[] }
  | { type: 'emergency_blocked'; hubName: string }
  | { type: 'kotlin_source_viewer' };
