import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Folder,
  Search,
  ShieldAlert,
  Phone,
  CheckSquare,
  Settings,
  Users,
  MessageCircle,
  Play,
  Briefcase,
  CreditCard,
  Gamepad2,
  Zap,
} from 'lucide-react';
import {
  HubId,
  LauncherSettings,
  ThemeId,
  AppItem,
  GestureAction,
  GestureTrigger,
} from '../types/launcher';
import { haptics } from '../utils/audio';

interface OrbitalCanvasProps {
  settings: LauncherSettings;
  isEmergencyActive: boolean;
  allApps?: AppItem[];
  onLaunchApp?: (app: AppItem) => void;
  onOpenFolder: (category: string) => void;
  onOpenSearch: () => void;
  onToggleEmergency: () => void;
  onOpenCallsContacts: () => void;
  onOpenCallsDialer: () => void;
  onOpenTasks: () => void;
  onOpenSettings: () => void;
  onLaunchDefaultLauncher?: () => void;
  onStepAchieved?: (step: number) => void;
}

interface HubDefinition {
  id: HubId;
  label: string;
  angleDeg: number; // 0 is East
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const HUBS: HubDefinition[] = [
  { id: 'folders', label: 'App Folders', angleDeg: 0, icon: Folder, accentColor: '#60A5FA' },
  { id: 'search', label: 'Search', angleDeg: 60, icon: Search, accentColor: '#38BDF8' },
  { id: 'emergency', label: 'Emergency', angleDeg: 120, icon: ShieldAlert, accentColor: '#EF4444' },
  { id: 'calls', label: 'Calls', angleDeg: 180, icon: Phone, accentColor: '#34D399' },
  { id: 'tasks', label: 'Tasks', angleDeg: 240, icon: CheckSquare, accentColor: '#A78BFA' },
  { id: 'settings', label: 'Settings', angleDeg: 300, icon: Settings, accentColor: '#F59E0B' },
];

const FOLDER_SUB_NODES = [
  { id: 'social', label: 'Social', icon: MessageCircle, offsetDeg: -40, color: '#38BDF8' },
  { id: 'media', label: 'Media', icon: Play, offsetDeg: -20, color: '#EC4899' },
  { id: 'work', label: 'Work', icon: Briefcase, offsetDeg: 0, color: '#60A5FA' },
  { id: 'finance', label: 'Finance', icon: CreditCard, offsetDeg: 20, color: '#10B981' },
  { id: 'games', label: 'Games', icon: Gamepad2, offsetDeg: 40, color: '#F59E0B' },
];

const CALLS_SUB_NODES = [
  { id: 'contacts', label: 'Contacts', icon: Users, offsetDeg: -22, color: '#60A5FA' },
  { id: 'dialer', label: 'Phone', icon: Phone, offsetDeg: 22, color: '#34D399' },
];

const THEME_STYLES: Record<ThemeId, { centerBg: string; ringLine: string; activeGlow: string }> = {
  obsidian: {
    centerBg: 'bg-white shadow-[0_0_36px_rgba(255,255,255,0.55)]',
    ringLine: 'rgba(255, 255, 255, 0.14)',
    activeGlow: 'rgba(255, 255, 255, 0.35)',
  },
  cyber: {
    centerBg: 'bg-cyan-400 shadow-[0_0_36px_rgba(34,211,238,0.75)]',
    ringLine: 'rgba(34, 211, 238, 0.22)',
    activeGlow: 'rgba(34, 211, 238, 0.5)',
  },
  crimson: {
    centerBg: 'bg-rose-500 shadow-[0_0_36px_rgba(244,63,94,0.75)]',
    ringLine: 'rgba(244, 63, 94, 0.22)',
    activeGlow: 'rgba(244, 63, 94, 0.5)',
  },
  aurora: {
    centerBg: 'bg-emerald-400 shadow-[0_0_36px_rgba(52,211,153,0.75)]',
    ringLine: 'rgba(52, 211, 153, 0.22)',
    activeGlow: 'rgba(52, 211, 153, 0.5)',
  },
  gold: {
    centerBg: 'bg-amber-400 shadow-[0_0_36px_rgba(251,191,36,0.75)]',
    ringLine: 'rgba(251, 191, 36, 0.22)',
    activeGlow: 'rgba(251, 191, 36, 0.5)',
  },
};

export const OrbitalCanvas: React.FC<OrbitalCanvasProps> = ({
  settings,
  isEmergencyActive,
  allApps,
  onLaunchApp,
  onOpenFolder,
  onOpenSearch,
  onToggleEmergency,
  onOpenCallsContacts,
  onOpenCallsDialer,
  onOpenTasks,
  onOpenSettings,
  onLaunchDefaultLauncher,
  onStepAchieved,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Gesture state
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [centerCoord, setCenterCoord] = useState({ x: 0, y: 0 });
  const [currentDistance, setCurrentDistance] = useState(0);
  const [currentAngleDeg, setCurrentAngleDeg] = useState(0);

  // Gesture shortcut tracking refs
  const pointerDownTimeRef = useRef(0);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const lastPointerPosRef = useRef({ x: 0, y: 0 });
  const hasTriggeredGestureRef = useRef(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef(0);

  // Transient HUD feedback when a shortcut executes
  const [gestureHud, setGestureHud] = useState<{
    trigger: string;
    label: string;
  } | null>(null);

  // Spring animation state for bloom with physics-based damping
  const [bloomProgress, setBloomProgress] = useState(0); // 0 to 1
  const bloomVelocity = useRef(0);
  const targetBloom = useRef(0);

  // Active hover states
  const [hoveredHub, setHoveredHub] = useState<HubId | null>(null);
  const [hoveredSubNode, setHoveredSubNode] = useState<string | null>(null);

  const prevHoveredHub = useRef<HubId | null>(null);
  const prevHoveredSubNode = useRef<string | null>(null);

  // Sync haptics settings
  useEffect(() => {
    haptics.setEnabled(settings.hapticsEnabled);
  }, [settings.hapticsEnabled]);

  // Container dimensions for responsive aspect-ratio adaptation
  const [containerDim, setContainerDim] = useState({ width: 400, height: 750 });

  // Recalculate dead center of screen
  const updateCenter = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setContainerDim({ width: rect.width, height: rect.height });
    setCenterCoord({
      x: rect.width / 2,
      y: rect.height / 2,
    });
  }, []);

  useEffect(() => {
    updateCenter();
    window.addEventListener('resize', updateCenter);
    return () => window.removeEventListener('resize', updateCenter);
  }, [updateCenter]);

  // Spring Physics loop (stiffness, damping) with support for animationStyle
  useEffect(() => {
    let animId: number;
    // Map animationStyle to physics stiffness & damping
    const style = settings.animationStyle || 'smooth';
    let k = 0.18 * settings.bloomSpeed; // stiffness
    let d = 0.78; // damping

    if (style === 'snappy') {
      k = 0.32 * settings.bloomSpeed;
      d = 0.84;
    } else if (style === 'bouncy') {
      k = 0.25 * settings.bloomSpeed;
      d = 0.58;
    }

    const step = () => {
      const force = (targetBloom.current - bloomProgress) * k;
      bloomVelocity.current = (bloomVelocity.current + force) * d;
      const nextProgress = bloomProgress + bloomVelocity.current;

      if (Math.abs(nextProgress - targetBloom.current) > 0.0005 || Math.abs(bloomVelocity.current) > 0.0005) {
        setBloomProgress(Math.max(0, Math.min(1.15, nextProgress)));
      } else {
        setBloomProgress(targetBloom.current);
        bloomVelocity.current = 0;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [bloomProgress, settings.bloomSpeed, settings.animationStyle]);

  // Dynamic Screen Boundary & Aspect Ratio Adaptation metrics
  const minDim = Math.min(containerDim.width || 400, containerDim.height || 750);
  const satelliteBallRadius = 26; // px
  const maxRadius = Math.max(120, minDim / 2 - (satelliteBallRadius + 16));

  const baseSpread = Math.min(1.4, Math.max(0.7, (settings.ringRadius || 140) / 140));
  const ring1Radius = 0.35 * maxRadius * baseSpread * bloomProgress;
  const ring2Radius = 0.65 * maxRadius * baseSpread * bloomProgress;
  const ring3Radius = 0.88 * maxRadius * baseSpread * bloomProgress;

  const clampCoord = useCallback(
    (rawX: number, rawY: number, rad: number = satelliteBallRadius) => {
      const pad = rad + 8;
      const w = containerDim.width || 400;
      const h = containerDim.height || 750;
      return {
        x: Math.max(pad, Math.min(w - pad, rawX)),
        y: Math.max(pad, Math.min(h - pad, rawY)),
      };
    },
    [containerDim.width, containerDim.height]
  );

  // Calculate pointer distance & angle relative to center ball
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const dx = x - centerCoord.x;
    const dy = y - centerCoord.y;
    const dist = Math.hypot(dx, dy);
    let angleRad = Math.atan2(dy, dx);
    let deg = (angleRad * 180) / Math.PI;
    if (deg < 0) deg += 360;

    setCurrentDistance(dist);
    setCurrentAngleDeg(deg);

    // Expand Ring 1 as finger drags away from center (dynamic scaling)
    const deadZone = settings.touchDeadzone || 28;
    const ring1Base = 0.35 * maxRadius * baseSpread;
    if (dist > deadZone) {
      targetBloom.current = Math.min(1, (dist - deadZone) / (ring1Base * 0.82));
      if (dist > ring1Base * 0.38) {
        onStepAchieved?.(1); // Tutorial Step 1 complete: drag outward
      }
    } else {
      targetBloom.current = 0;
    }

    // Determine hovered Hub with generous outer drag ceiling (up to maxRadius * 1.6, no premature collapse)
    const triggerRadiusMin = ring1Base * 0.36;
    const triggerRadiusMax = maxRadius * 1.6;

    if (dist >= triggerRadiusMin && dist <= triggerRadiusMax) {
      // Find closest hub by angular distance
      let bestHub: HubId | null = null;
      let minDiff = 360;

      HUBS.forEach((hub) => {
        let diff = Math.abs(deg - hub.angleDeg);
        if (diff > 180) diff = 360 - diff;
        if (diff < minDiff && diff <= 35) {
          minDiff = diff;
          bestHub = hub.id;
        }
      });

      // Deadzone buffer for folders: if already hovering folders or its sub-nodes, keep it active within buffer
      if (!bestHub && hoveredHub === 'folders' && (deg <= 52 || deg >= 308)) {
        bestHub = 'folders';
      }

      setHoveredHub(bestHub);

      // Layer 2: Detect Sub-Nodes when hovering Folders or Calls
      if (bestHub === 'folders') {
        onStepAchieved?.(2); // Tutorial Step 2 in progress
        let bestSub: string | null = null;
        let minSubDist = Infinity;
        const folderDist = Math.max(0.65 * maxRadius, ring1Base + 48);

        FOLDER_SUB_NODES.forEach((sub) => {
          const subRad = ((0 + sub.offsetDeg) * Math.PI) / 180;
          const rawSx = centerCoord.x + folderDist * Math.cos(subRad);
          const rawSy = centerCoord.y + folderDist * Math.sin(subRad);
          const pos = clampCoord(rawSx, rawSy, 24);
          const d = Math.hypot(x - pos.x, y - pos.y);
          if (d < minSubDist) {
            minSubDist = d;
            bestSub = sub.id;
          }
        });

        // Generous touch target area (>= 56px radius tolerance)
        if (minSubDist <= 56 || dist > ring1Base * 0.72) {
          setHoveredSubNode(bestSub || hoveredSubNode || 'social');
        } else {
          setHoveredSubNode(null);
        }
      } else if (bestHub === 'calls') {
        let bestSub: string | null = null;
        let minSubDist = Infinity;
        const callDist = Math.max(0.65 * maxRadius, ring1Base + 44);

        CALLS_SUB_NODES.forEach((sub) => {
          const subRad = ((180 + sub.offsetDeg) * Math.PI) / 180;
          const rawSx = centerCoord.x + callDist * Math.cos(subRad);
          const rawSy = centerCoord.y + callDist * Math.sin(subRad);
          const pos = clampCoord(rawSx, rawSy, 24);
          const d = Math.hypot(x - pos.x, y - pos.y);
          if (d < minSubDist) {
            minSubDist = d;
            bestSub = sub.id;
          }
        });

        if (minSubDist <= 56 || dist > ring1Base * 0.72) {
          setHoveredSubNode(bestSub || hoveredSubNode || 'dialer');
        } else {
          setHoveredSubNode(null);
        }
      } else {
        setHoveredSubNode(null);
      }
    } else {
      setHoveredHub(null);
      setHoveredSubNode(null);
    }
  };

  // Trigger haptic clicks on hover transitions
  useEffect(() => {
    if (hoveredHub !== prevHoveredHub.current) {
      if (hoveredHub) {
        haptics.playSnap();
      }
      prevHoveredHub.current = hoveredHub;
    }
  }, [hoveredHub]);

  useEffect(() => {
    if (hoveredSubNode !== prevHoveredSubNode.current) {
      if (hoveredSubNode) {
        haptics.playTick(1100, 0.015, 0.15);
      }
      prevHoveredSubNode.current = hoveredSubNode;
    }
  }, [hoveredSubNode]);

  // Execute custom shortcut action defined by user in SettingsModal
  const executeGestureAction = (action: GestureAction, triggerName: string) => {
    haptics.playSnap();
    setGestureHud({
      trigger: triggerName,
      label: action.label || action.type,
    });
    setTimeout(() => setGestureHud(null), 2400);

    // If emergency mode is active and action isn't emergency or calls, block it
    if (isEmergencyActive && action.type !== 'toggle_emergency') {
      haptics.playEmergencyAlert();
      return;
    }

    switch (action.type) {
      case 'launch_default_launcher':
        onLaunchDefaultLauncher?.();
        break;
      case 'toggle_emergency':
        onToggleEmergency();
        break;
      case 'launch_app':
        if (action.appId && allApps) {
          const app = allApps.find((a) => a.id === action.appId);
          if (app && onLaunchApp) {
            onLaunchApp(app);
          }
        }
        break;
      case 'open_search':
        onOpenSearch();
        break;
      case 'open_tasks':
        onOpenTasks();
        break;
      case 'open_settings':
        onOpenSettings();
        break;
      case 'open_folder':
        onOpenFolder(action.categoryId || 'social');
        break;
      default:
        break;
    }
  };

  // Touch / Pointer Event Handlers:
  // RESTRICT DRAG DETECTION: ONLY activates when the initial touch starts within the center ball's hit boundary (~48dp/px)!
  // Touches starting on empty screen background MUST be ignored!
  const onPointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const dx = touchX - centerCoord.x;
    const dy = touchY - centerCoord.y;
    const initialDist = Math.hypot(dx, dy);

    // Hit boundary: minimum 48px or center ball radius + 16px buffer
    const centerBallHitBoundary = Math.max(48, settings.centerBallSize / 2 + 16);

    if (initialDist > centerBallHitBoundary) {
      // Touch started on empty background -> IGNORE completely!
      return;
    }

    setIsPointerDown(true);
    haptics.playBloom();

    // Record gesture start state
    pointerDownTimeRef.current = Date.now();
    pointerDownPosRef.current = { x: touchX, y: touchY };
    lastPointerPosRef.current = { x: touchX, y: touchY };
    hasTriggeredGestureRef.current = false;

    // Start Long Press timer (520ms hold without significant displacement)
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      const longPressMapping = settings.gestureMappings?.find((m) => m.trigger === 'long_press');
      if (longPressMapping && longPressMapping.action.type !== 'none') {
        hasTriggeredGestureRef.current = true;
        executeGestureAction(longPressMapping.action, longPressMapping.triggerName);
        targetBloom.current = 0;
        setHoveredHub(null);
        setHoveredSubNode(null);
        setIsPointerDown(false);
      }
    }, 520);

    handlePointerMove(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown) return;
    if (hasTriggeredGestureRef.current) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      lastPointerPosRef.current = { x, y };

      // If finger moves away from center (> 18px), clear long press timer so normal drag continues
      const moveDist = Math.hypot(x - pointerDownPosRef.current.x, y - pointerDownPosRef.current.y);
      if (moveDist > 18 && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    handlePointerMove(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isPointerDown) return;
    setIsPointerDown(false);

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (hasTriggeredGestureRef.current) {
      hasTriggeredGestureRef.current = false;
      targetBloom.current = 0;
      return;
    }

    const duration = Date.now() - pointerDownTimeRef.current;
    let endX = lastPointerPosRef.current.x;
    let endY = lastPointerPosRef.current.y;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      endX = e.clientX - rect.left;
      endY = e.clientY - rect.top;
    }

    const dx = endX - pointerDownPosRef.current.x;
    const dy = endY - pointerDownPosRef.current.y;
    const dist = Math.hypot(dx, dy);

    // 1. Double Tap Recognition on Center Ball (< 22px movement, < 280ms duration)
    if (dist < 22 && duration < 280) {
      const now = Date.now();
      if (now - lastTapTimeRef.current < 320) {
        // Double Tap confirmed!
        lastTapTimeRef.current = 0;
        const doubleTapMapping = settings.gestureMappings?.find((m) => m.trigger === 'double_tap');
        if (doubleTapMapping && doubleTapMapping.action.type !== 'none') {
          targetBloom.current = 0;
          setHoveredHub(null);
          setHoveredSubNode(null);
          executeGestureAction(doubleTapMapping.action, doubleTapMapping.triggerName);
          return;
        }
      } else {
        lastTapTimeRef.current = now;
      }
    }

    // 2. Custom Quick Swipe / Flick Recognition (< 400ms duration and >= 35px distance)
    if (duration < 400 && dist >= 35) {
      let swipeTrigger: GestureTrigger;
      if (Math.abs(dx) > Math.abs(dy)) {
        swipeTrigger = dx > 0 ? 'swipe_right' : 'swipe_left';
      } else {
        swipeTrigger = dy > 0 ? 'swipe_down' : 'swipe_up';
      }

      const swipeMapping = settings.gestureMappings?.find((m) => m.trigger === swipeTrigger);
      if (swipeMapping && swipeMapping.action.type !== 'none') {
        targetBloom.current = 0;
        setHoveredHub(null);
        setHoveredSubNode(null);
        executeGestureAction(swipeMapping.action, swipeMapping.triggerName);
        return;
      }
    }

    // 3. Fallback: Standard Hub Release
    const hub = hoveredHub;
    const sub = hoveredSubNode;

    targetBloom.current = 0;
    setHoveredHub(null);
    setHoveredSubNode(null);

    if (!hub) return;

    // Emergency check: If emergency mode is active, App Folders, Search, Tasks, and Settings are blocked!
    const isEmergencyBlocked = isEmergencyActive && hub !== 'calls' && hub !== 'emergency';

    if (isEmergencyBlocked) {
      haptics.playEmergencyAlert();
      return;
    }

    switch (hub) {
      case 'folders':
        onStepAchieved?.(2);
        onOpenFolder(sub || 'social');
        break;

      case 'search':
        onStepAchieved?.(3);
        onOpenSearch();
        break;

      case 'emergency':
        onStepAchieved?.(4);
        onToggleEmergency();
        break;

      case 'calls':
        if (sub === 'contacts') {
          onOpenCallsContacts();
        } else {
          onOpenCallsDialer();
        }
        break;

      case 'tasks':
        onStepAchieved?.(4);
        onOpenTasks();
        break;

      case 'settings':
        onOpenSettings();
        break;
    }
  };

  const themeStyle = THEME_STYLES[settings.colorTheme] || THEME_STYLES.obsidian;

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative w-full h-full overflow-hidden select-none touch-none cursor-default"
      style={{
        background: isEmergencyActive
          ? 'radial-gradient(circle at center, #1b0c0e 0%, #080304 85%, #020101 100%)'
          : 'radial-gradient(circle at center, #0a0d14 0%, #050608 85%, #020304 100%)',
      }}
    >
      {/* Background Starfield / Minimalist Grid texture */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* EMERGENCY MODE: High-contrast red warning ring and screen edge border */}
      {isEmergencyActive && (
        <>
          {/* Screen Edge Warning Border */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-500 animate-pulse"
            style={{
              boxShadow: `inset 0 0 40px ${settings.emergencyColor}99, inset 0 0 10px ${settings.emergencyColor}`,
              border: `2px solid ${settings.emergencyColor}`,
            }}
          />
          {/* Center Hub Emergency Barrier Halo */}
          <div
            className="absolute rounded-full pointer-events-none animate-ping opacity-25"
            style={{
              left: centerCoord.x,
              top: centerCoord.y,
              width: settings.centerBallSize * 2.2,
              height: settings.centerBallSize * 2.2,
              transform: 'translate(-50%, -50%)',
              border: `2px solid ${settings.emergencyColor}`,
            }}
          />
        </>
      )}

      {/* SVG Canvas for Laser Connective Lines & Orbital Guides */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.8} />
          </linearGradient>
        </defs>

        {/* Orbit Path Guide Ring (Dynamic Ring 1 Radius) */}
        {bloomProgress > 0.05 && (
          <circle
            cx={centerCoord.x}
            cy={centerCoord.y}
            r={ring1Radius}
            fill="none"
            stroke={isEmergencyActive ? settings.emergencyColor : themeStyle.ringLine}
            strokeWidth="1.2"
            strokeDasharray="4 6"
            className="transition-all"
            style={{ opacity: bloomProgress * 0.7 }}
          />
        )}

        {/* Laser connective lines from center to active Ring 1 satellites */}
        {bloomProgress > 0.08 &&
          HUBS.map((hub) => {
            const rad = (hub.angleDeg * Math.PI) / 180;
            const rawHx = centerCoord.x + ring1Radius * Math.cos(rad);
            const rawHy = centerCoord.y + ring1Radius * Math.sin(rad);
            const isHovered = hoveredHub === hub.id;
            const satRadius = isHovered ? 27 : 23;
            const { x: hx, y: hy } = clampCoord(rawHx, rawHy, satRadius);
            const isBlocked = isEmergencyActive && hub.id !== 'calls' && hub.id !== 'emergency';

            return (
              <g key={hub.id}>
                <line
                  x1={centerCoord.x}
                  y1={centerCoord.y}
                  x2={hx}
                  y2={hy}
                  stroke={
                    isBlocked
                      ? 'rgba(239, 68, 68, 0.2)'
                      : isHovered
                      ? hub.accentColor
                      : 'rgba(255, 255, 255, 0.16)'
                  }
                  strokeWidth={isHovered ? 2.5 : 1}
                  strokeDasharray={isHovered ? 'none' : '3 3'}
                  style={{ opacity: bloomProgress }}
                />

                {/* Layer 2 connective lines to sub-nodes */}
                {isHovered && hub.id === 'folders' && (
                  FOLDER_SUB_NODES.map((sub) => {
                    const subRad = ((hub.angleDeg + sub.offsetDeg) * Math.PI) / 180;
                    const folderDist = Math.max(ring2Radius, ring1Radius + 48);
                    const rawSx = centerCoord.x + folderDist * Math.cos(subRad);
                    const rawSy = centerCoord.y + folderDist * Math.sin(subRad);
                    const isSubHovered = hoveredSubNode === sub.id;
                    const subRadius = isSubHovered ? 24 : 21;
                    const { x: sx, y: sy } = clampCoord(rawSx, rawSy, subRadius);

                    return (
                      <line
                        key={sub.id}
                        x1={hx}
                        y1={hy}
                        x2={sx}
                        y2={sy}
                        stroke={isSubHovered ? sub.color : 'rgba(255, 255, 255, 0.3)'}
                        strokeWidth={isSubHovered ? 2.5 : 1}
                      />
                    );
                  })
                )}

                {isHovered && hub.id === 'calls' && (
                  CALLS_SUB_NODES.map((sub) => {
                    const subRad = ((hub.angleDeg + sub.offsetDeg) * Math.PI) / 180;
                    const callDist = Math.max(ring2Radius, ring1Radius + 44);
                    const rawSx = centerCoord.x + callDist * Math.cos(subRad);
                    const rawSy = centerCoord.y + callDist * Math.sin(subRad);
                    const isSubHovered = hoveredSubNode === sub.id;
                    const subRadius = isSubHovered ? 24 : 21;
                    const { x: sx, y: sy } = clampCoord(rawSx, rawSy, subRadius);

                    return (
                      <line
                        key={sub.id}
                        x1={hx}
                        y1={hy}
                        x2={sx}
                        y2={sy}
                        stroke={isSubHovered ? sub.color : 'rgba(255, 255, 255, 0.3)'}
                        strokeWidth={isSubHovered ? 2.5 : 1}
                      />
                    );
                  })
                )}
              </g>
            );
          })}
      </svg>

      {/* FIXED DEAD CENTER ANCHOR BALL */}
      {/* Visual Fix: Rendered as a clean, solid, smooth sphere with NO inner black dot / circle */}
      <div
        className="absolute z-20 transition-transform duration-150 ease-out cursor-grab active:cursor-grabbing"
        style={{
          left: centerCoord.x,
          top: centerCoord.y,
          transform: `translate(-50%, -50%) scale(${isPointerDown ? 1.08 : 1.0})`,
        }}
      >
        {/* Clean, solid, smooth sphere (no inner center circle or black dot) */}
        <div
          className={`rounded-full transition-all duration-300 ${
            isEmergencyActive
              ? 'bg-red-500 shadow-[0_0_38px_rgba(239,68,68,0.95)]'
              : themeStyle.centerBg
          }`}
          style={{
            width: settings.centerBallSize,
            height: settings.centerBallSize,
          }}
        />

        {/* Minimal rest hint pulse (only when idle & not dragging) */}
        {!isPointerDown && bloomProgress < 0.05 && (
          <div className="absolute -inset-3 rounded-full border border-white/20 animate-ping pointer-events-none opacity-30" />
        )}
      </div>

      {/* RING 1: 6 SATELLITE CATEGORY SPHERES (Dynamic & Clamped) */}
      {bloomProgress > 0.04 &&
        HUBS.map((hub) => {
          const rad = (hub.angleDeg * Math.PI) / 180;
          const rawHx = centerCoord.x + ring1Radius * Math.cos(rad);
          const rawHy = centerCoord.y + ring1Radius * Math.sin(rad);
          const isHovered = hoveredHub === hub.id;
          const satRadius = isHovered ? 27 : 23;
          const { x: hx, y: hy } = clampCoord(rawHx, rawHy, satRadius);

          const isBlocked = isEmergencyActive && hub.id !== 'calls' && hub.id !== 'emergency';
          const Icon = hub.icon;

          return (
            <div
              key={hub.id}
              className="absolute z-20 transition-all duration-100 ease-out pointer-events-none"
              style={{
                left: hx,
                top: hy,
                transform: `translate(-50%, -50%) scale(${
                  isHovered ? 1.25 : 1.0
                })`,
                opacity: Math.min(1, bloomProgress * 1.5),
              }}
            >
              {/* Satellite Node Sphere */}
              <div
                className={`relative flex items-center justify-center rounded-full transition-all duration-200 ${
                  isBlocked
                    ? 'bg-slate-900/90 border-2 border-red-500/40 opacity-40 shadow-none'
                    : hub.id === 'emergency'
                    ? isEmergencyActive
                      ? 'bg-red-600 text-white shadow-[0_0_24px_rgba(239,68,68,0.8)] border border-red-400'
                      : 'bg-red-950 text-red-300 border border-red-600/60 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : isHovered
                    ? 'bg-slate-800 text-white shadow-[0_0_24px_rgba(255,255,255,0.4)] border-2 border-white'
                    : 'bg-slate-900/95 text-slate-300 border border-white/20 shadow-lg shadow-black/80'
                }`}
                style={{
                  width: isHovered ? 54 : 46,
                  height: isHovered ? 54 : 46,
                }}
              >
                <Icon className={isHovered ? 'w-6 h-6' : 'w-5 h-5'} />

                {/* Blocked Barrier Overlay Badge for emergency lock */}
                {isBlocked && (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-red-950/70 backdrop-blur-[1px]">
                    <span className="text-[10px] font-mono text-red-400 font-bold">✕</span>
                  </div>
                )}
              </div>

              {/* Satellite Clean Unboxed Label */}
              <div
                className={`absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-center transition-all ${
                  isHovered ? 'opacity-100 scale-105' : 'opacity-80 scale-95'
                }`}
              >
                <span
                  className={`text-[11px] font-medium tracking-tight ${
                    isBlocked
                      ? 'text-red-400/60 line-through'
                      : isHovered
                      ? 'text-white font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  {hub.id === 'emergency' && isEmergencyActive ? 'Exit Emergency' : hub.label}
                </span>
              </div>
            </div>
          );
        })}

      {/* LAYER 2: HUB 1 (APP FOLDERS) SUB-SPHERES WITH ENHANCED HITBOX (>= 56px radius tolerance) */}
      {hoveredHub === 'folders' &&
        bloomProgress > 0.45 &&
        FOLDER_SUB_NODES.map((sub) => {
          const subRad = ((0 + sub.offsetDeg) * Math.PI) / 180;
          const folderDist = Math.max(ring2Radius, ring1Radius + 48);
          const rawSx = centerCoord.x + folderDist * Math.cos(subRad);
          const rawSy = centerCoord.y + folderDist * Math.sin(subRad);
          const isSubHovered = hoveredSubNode === sub.id;
          const subRadius = isSubHovered ? 24 : 21;
          const { x: sx, y: sy } = clampCoord(rawSx, rawSy, subRadius);
          const SubIcon = sub.icon;

          return (
            <div
              key={sub.id}
              className="absolute z-25 pointer-events-none transition-all duration-150"
              style={{
                left: sx,
                top: sy,
                transform: `translate(-50%, -50%) scale(${isSubHovered ? 1.35 : 1.05})`,
                opacity: 1,
              }}
            >
              <div
                className={`flex items-center justify-center rounded-full transition-all ${
                  isSubHovered
                    ? 'bg-blue-600 text-white shadow-[0_0_24px_rgba(59,130,246,0.9)] border-2 border-white'
                    : 'bg-slate-900/95 text-slate-300 border border-white/20'
                }`}
                style={{
                  width: isSubHovered ? 48 : 42,
                  height: isSubHovered ? 48 : 42,
                }}
              >
                <SubIcon className={isSubHovered ? 'w-5 h-5' : 'w-4 h-4'} />
              </div>

              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span
                  className={`text-[10px] tracking-tight ${
                    isSubHovered ? 'text-blue-300 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {sub.label}
                </span>
              </div>
            </div>
          );
        })}

      {/* LAYER 2: HUB 4 (CALLS APP) 2-NODE SPLIT */}
      {hoveredHub === 'calls' &&
        bloomProgress > 0.45 &&
        CALLS_SUB_NODES.map((sub) => {
          const subRad = ((180 + sub.offsetDeg) * Math.PI) / 180;
          const callDist = Math.max(ring2Radius, ring1Radius + 44);
          const rawSx = centerCoord.x + callDist * Math.cos(subRad);
          const rawSy = centerCoord.y + callDist * Math.sin(subRad);
          const isSubHovered = hoveredSubNode === sub.id;
          const subRadius = isSubHovered ? 24 : 21;
          const { x: sx, y: sy } = clampCoord(rawSx, rawSy, subRadius);
          const SubIcon = sub.icon;

          return (
            <div
              key={sub.id}
              className="absolute z-25 pointer-events-none transition-all duration-150"
              style={{
                left: sx,
                top: sy,
                transform: `translate(-50%, -50%) scale(${isSubHovered ? 1.35 : 1.05})`,
                opacity: 1,
              }}
            >
              <div
                className={`flex items-center justify-center rounded-full transition-all ${
                  isSubHovered
                    ? 'bg-emerald-600 text-white shadow-[0_0_24px_rgba(16,185,129,0.9)] border-2 border-white'
                    : 'bg-slate-900/95 text-slate-300 border border-white/20'
                }`}
                style={{
                  width: isSubHovered ? 48 : 42,
                  height: isSubHovered ? 48 : 42,
                }}
              >
                <SubIcon className={isSubHovered ? 'w-5 h-5' : 'w-4 h-4'} />
              </div>

              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span
                  className={`text-[10px] tracking-tight ${
                    isSubHovered ? 'text-emerald-300 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {sub.label}
                </span>
              </div>
            </div>
          );
        })}

      {/* Custom Gesture Shortcut Execution HUD Notification */}
      {gestureHud && (
        <div className="absolute top-14 inset-x-0 flex justify-center pointer-events-none z-30 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-white/20 shadow-2xl backdrop-blur-md">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {gestureHud.trigger}
              </span>
              <span className="text-xs font-semibold text-white">
                {gestureHud.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gesture Instruction (Quiet minimal rest hint) */}
      {!isPointerDown && bloomProgress < 0.05 && (
        <div className="absolute bottom-16 inset-x-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <p className="text-xs font-mono tracking-wider text-slate-400/50 uppercase">
            Touch Center Ball & Drag Outward
          </p>
        </div>
      )}
    </div>
  );
};
