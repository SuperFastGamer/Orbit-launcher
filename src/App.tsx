import { useState, useEffect, useCallback } from 'react';
import {
  AppCategory,
  AppItem,
  TaskItem,
  LauncherSettings,
  TutorialState,
  ActiveModal,
} from './types/launcher';
import { APP_CATEGORIES, INITIAL_APPS, DEFAULT_CONTACTS } from './data/defaultApps';
import { INITIAL_TASKS, DEFAULT_SETTINGS } from './data/defaultTasks';
import { OrbitalCanvas } from './components/OrbitalCanvas';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { DeviceFrame } from './components/DeviceFrame';
import { InteractiveTutorial } from './components/InteractiveTutorial';
import { AppFolderModal } from './components/modals/AppFolderModal';
import { SearchModal } from './components/modals/SearchModal';
import { CallsModal } from './components/modals/CallsModal';
import { TasksModal } from './components/modals/TasksModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { FocusBlockedModal } from './components/modals/FocusBlockedModal';
import { SecurityPinModal } from './components/modals/SecurityPinModal';
import { AppLaunchSimModal } from './components/modals/AppLaunchSimModal';
import { KotlinSourceViewerModal } from './components/modals/KotlinSourceViewerModal';
import { haptics } from './utils/audio';

const STORAGE_KEY_FIRST_LAUNCH = 'orbital_is_first_launch';
const STORAGE_KEY_SETTINGS = 'orbital_settings';
const STORAGE_KEY_TASKS = 'orbital_tasks';
const STORAGE_KEY_APPS = 'orbital_apps';
const STORAGE_KEY_CATEGORIES = 'orbital_categories';

export default function App() {
  // 1. First-Run Interactive Tutorial Check
  const [tutorial, setTutorial] = useState<TutorialState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_FIRST_LAUNCH);
    const isFirstLaunch = stored === null ? true : stored === 'true';
    return {
      isActive: isFirstLaunch,
      currentStep: 1,
      completedSteps: [],
    };
  });

  // 2. Settings state
  const [settings, setSettings] = useState<LauncherSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // 3. Apps & Categories state
  const [categories, setCategories] = useState<AppCategory[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      return stored ? JSON.parse(stored) : APP_CATEGORIES;
    } catch {
      return APP_CATEGORIES;
    }
  });

  const [apps, setApps] = useState<AppItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_APPS);
      return stored ? JSON.parse(stored) : INITIAL_APPS;
    } catch {
      return INITIAL_APPS;
    }
  });

  // 4. Tasks state
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TASKS);
      return stored ? JSON.parse(stored) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  // 5. Emergency Mode Active Flag
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  // 6. Active Modal State
  const [activeModal, setActiveModal] = useState<ActiveModal>({ type: 'none' });

  // 7. Device Frame View (Mobile mockup vs Fullscreen Canvas)
  const [isDeviceFrame, setIsDeviceFrame] = useState(true);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  // Complete tutorial and transition to live home screen directly
  const finishTutorial = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_FIRST_LAUNCH, 'false');
    setTutorial({
      isActive: false,
      currentStep: 1,
      completedSteps: [1, 2, 3, 4],
    });
    haptics.playSnap();
  }, []);

  const advanceTutorial = useCallback(() => {
    setTutorial((prev) => {
      const nextStep = (prev.currentStep + 1) as 1 | 2 | 3 | 4;
      if (prev.currentStep >= 4) {
        finishTutorial();
        return prev;
      }
      haptics.playSnap();
      return {
        ...prev,
        currentStep: nextStep,
        completedSteps: [...prev.completedSteps, prev.currentStep],
      };
    });
  }, [finishTutorial]);

  const restartTutorial = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_FIRST_LAUNCH, 'true');
    setTutorial({
      isActive: true,
      currentStep: 1,
      completedSteps: [],
    });
    setActiveModal({ type: 'none' });
    setIsEmergencyActive(false);
    haptics.playSnap();
  }, []);

  // Handle tutorial step achieved during canvas interaction
  const handleStepAchieved = useCallback(
    (step: number) => {
      if (!tutorial.isActive) return;
      if (step === tutorial.currentStep) {
        if (step < 4) {
          advanceTutorial();
        }
      }
    },
    [tutorial, advanceTutorial]
  );

  // Focus lock verification before launching any app
  const handleLaunchApp = useCallback(
    (app: AppItem) => {
      const incompleteTasks = tasks.filter((t) => !t.completed);
      const isWhitelisted =
        incompleteTasks.length === 0 ||
        app.isBaseline ||
        incompleteTasks.some((t) => t.whitelistedAppIds.includes(app.id));

      if (!isWhitelisted) {
        haptics.playEmergencyAlert();
        setActiveModal({
          type: 'focus_blocked',
          app,
          blockingTasks: incompleteTasks.map((t) => t.title),
        });
        return;
      }

      haptics.playBloom();
      setActiveModal({ type: 'app_launch_sim', app });
    },
    [tasks]
  );

  // Emergency Mode toggle with symmetrical gesture
  const handleToggleEmergency = useCallback(() => {
    setIsEmergencyActive((prev) => {
      const next = !prev;
      if (next) {
        haptics.playEmergencyAlert();
      } else {
        haptics.playSnap();
      }
      return next;
    });
  }, []);

  // Open Settings with optional PIN prompt
  const handleOpenSettings = useCallback(() => {
    if (settings.pinRequiredForSettings) {
      setActiveModal({ type: 'security_pin_check', targetAction: 'settings' });
    } else {
      setActiveModal({ type: 'settings' });
    }
  }, [settings.pinRequiredForSettings]);

  // Task actions
  const handleAddTask = (
    title: string,
    timers: number[],
    whitelistedAppIds: string[],
    startTime?: string,
    endTime?: string
  ) => {
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title,
      completed: false,
      createdAt: Date.now(),
      timers,
      whitelistedAppIds,
      startTime,
      endTime,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: TaskItem) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? Date.now() : undefined,
            }
          : t
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleResetMidnight = () => {
    // Purge completed tasks as per requirements
    setTasks((prev) => prev.filter((t) => !t.completed));
    haptics.playSnap();
  };

  const handleReassignCategory = (appId: string, newCategory: string) => {
    setApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, category: newCategory } : app))
    );
    haptics.playSnap();
  };

  return (
    <DeviceFrame isDeviceFrame={isDeviceFrame}>
      {/* System Status Bar */}
      <AndroidStatusBar
        isEmergencyActive={isEmergencyActive}
        colorTheme={settings.colorTheme}
        isDeviceFrame={isDeviceFrame}
        onToggleFrame={() => setIsDeviceFrame((prev) => !prev)}
        onOpenKotlinSource={() => setActiveModal({ type: 'kotlin_source_viewer' })}
        onRestartTutorial={restartTutorial}
      />

      {/* Fullscreen Radial Physics Canvas */}
      <OrbitalCanvas
        settings={settings}
        isEmergencyActive={isEmergencyActive}
        allApps={apps}
        onLaunchApp={handleLaunchApp}
        onOpenFolder={(cat) => setActiveModal({ type: 'app_folder', categoryId: cat })}
        onOpenSearch={() => setActiveModal({ type: 'search' })}
        onToggleEmergency={handleToggleEmergency}
        onOpenCallsContacts={() => setActiveModal({ type: 'calls_contacts' })}
        onOpenCallsDialer={() => setActiveModal({ type: 'calls_dialer' })}
        onOpenTasks={() => setActiveModal({ type: 'tasks' })}
        onOpenSettings={handleOpenSettings}
        onLaunchDefaultLauncher={() => {
          setActiveModal({
            type: 'app_launch_sim',
            app: {
              id: 'system_launcher',
              name: 'Android System Launcher',
              packageName: 'com.android.launcher3',
              category: 'system',
              color: '#3B82F6',
              iconName: 'Home',
              isBaseline: true,
              isEmergencyAllowed: true,
            },
          });
        }}
        onStepAchieved={handleStepAchieved}
      />

      {/* First-Run Interactive Tutorial (Mandatory Onboarding) */}
      <InteractiveTutorial
        tutorial={tutorial}
        onNextStep={advanceTutorial}
        onSkipTutorial={finishTutorial}
        currentStepProgress={`Step ${tutorial.currentStep} / 4`}
      />

      {/* LAYER 3 MODALS */}

      {/* 1. App Folders Modal */}
      {activeModal.type === 'app_folder' && (
        <AppFolderModal
          categoryId={activeModal.categoryId}
          categories={categories}
          apps={apps}
          activeTasks={tasks}
          density={settings.layoutDensity}
          onLaunchApp={handleLaunchApp}
          onDismiss={() => setActiveModal({ type: 'none' })}
          onSelectCategory={(catId) =>
            setActiveModal({ type: 'app_folder', categoryId: catId })
          }
        />
      )}

      {/* 2. Top Search Bar Modal with Keyboard */}
      {activeModal.type === 'search' && (
        <SearchModal
          apps={apps}
          onLaunchApp={handleLaunchApp}
          onDismiss={() => setActiveModal({ type: 'none' })}
        />
      )}

      {/* 3. Calls App Split (Dialer / Contacts) */}
      {(activeModal.type === 'calls_contacts' || activeModal.type === 'calls_dialer') && (
        <CallsModal
          initialTab={activeModal.type === 'calls_contacts' ? 'contacts' : 'dialer'}
          emergencyContacts={settings.emergencyContacts || DEFAULT_CONTACTS}
          onDismiss={() => setActiveModal({ type: 'none' })}
        />
      )}

      {/* 4. Tasks Hub Modal */}
      {activeModal.type === 'tasks' && (
        <TasksModal
          tasks={tasks}
          allApps={apps}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onResetMidnight={handleResetMidnight}
          onDismiss={() => setActiveModal({ type: 'none' })}
        />
      )}

      {/* 5. Settings Hub Modal */}
      {activeModal.type === 'settings' && (
        <SettingsModal
          settings={settings}
          categories={categories}
          apps={apps}
          onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
          onUpdateCategories={setCategories}
          onReassignCategory={handleReassignCategory}
          onRestartTutorial={restartTutorial}
          onDismiss={() => setActiveModal({ type: 'none' })}
        />
      )}

      {/* 6. Focus Lock Barrier Modal */}
      {activeModal.type === 'focus_blocked' && (
        <FocusBlockedModal
          app={activeModal.app}
          blockingTasks={activeModal.blockingTasks}
          onOpenTasks={() => setActiveModal({ type: 'tasks' })}
          onDismiss={() => setActiveModal({ type: 'none' })}
        />
      )}

      {/* 7. Security PIN Verification */}
      {activeModal.type === 'security_pin_check' && (
        <SecurityPinModal
          correctPin={settings.securityPin}
          onSuccess={() => setActiveModal({ type: 'settings' })}
          onDismiss={() => setActiveModal({ type: 'none' })}
        />
      )}

      {/* 8. Native App Launch Simulation */}
      {activeModal.type === 'app_launch_sim' && (
        <AppLaunchSimModal
          app={activeModal.app}
          onDismiss={() => setActiveModal({ type: 'none' })}
        />
      )}

      {/* 9. Android Jetpack Compose Kotlin Source Viewer */}
      {activeModal.type === 'kotlin_source_viewer' && (
        <KotlinSourceViewerModal onDismiss={() => setActiveModal({ type: 'none' })} />
      )}
    </DeviceFrame>
  );
}
