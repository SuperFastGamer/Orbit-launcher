package com.orbital.launcher.data

/**
 * Hub identifiers representing the 6 primary radial category satellites.
 */
enum class HubType {
    FOLDERS,
    SEARCH,
    EMERGENCY,
    CALLS,
    TASKS,
    SETTINGS
}

/**
 * Representation of an installed Android application.
 */
data class AppItem(
    val id: String,
    val name: String,
    val packageName: String,
    val category: String, // "social", "media", "work", "finance", "games", "system"
    val isBaseline: Boolean = false,
    val isEmergencyAllowed: Boolean = false
)

/**
 * Representation of a task with optional scheduled time window and focus whitelist.
 */
data class TaskItem(
    val id: String,
    val title: String,
    val completed: Boolean = false,
    val whitelistedPackageNames: List<String> = emptyList(),
    val startTime: String? = null, // e.g. "09:00"
    val endTime: String? = null    // e.g. "11:30"
)

/**
 * Modal states for Layer 3 cards and dialogues.
 */
sealed interface ActiveModal {
    data object None : ActiveModal
    data class AppFolder(val category: String) : ActiveModal
    data object Search : ActiveModal
    data class CallsSplit(val target: String) : ActiveModal
    data object Tasks : ActiveModal
    data object Settings : ActiveModal
    data class EmergencyRestricted(val hubName: String) : ActiveModal
}

/**
 * Supported hardware gesture triggers on the center anchor ball.
 */
enum class GestureTrigger(val displayName: String, val description: String) {
    SWIPE_UP("Quick Swipe Up", "Flick upward from center anchor ball"),
    SWIPE_DOWN("Quick Swipe Down", "Flick downward from center anchor ball"),
    SWIPE_LEFT("Quick Swipe Left", "Flick leftward from center anchor ball"),
    SWIPE_RIGHT("Quick Swipe Right", "Flick rightward from center anchor ball"),
    DOUBLE_TAP("Double Tap", "Quick double tap on center anchor ball"),
    LONG_PRESS("Long Press", "Press and hold center anchor ball (500ms)"),
    TRIPLE_TAP("Triple Tap", "Quick triple tap on center anchor ball"),
    TWO_FINGER_TAP("Two-Finger Tap", "Tap with two fingers simultaneously")
}

/**
 * Action types executable by gesture shortcuts.
 */
enum class GestureActionType(val label: String) {
    LAUNCH_DEFAULT_LAUNCHER("Default Phone Launcher"),
    LAUNCH_APP("Launch App"),
    TOGGLE_EMERGENCY("Toggle Emergency Mode"),
    OPEN_SEARCH("Universal Search"),
    OPEN_TASKS("Tasks & Focus Hub"),
    OPEN_SETTINGS("Settings Hub"),
    NONE("Disabled")
}

/**
 * Shortcut action payload.
 */
data class GestureAction(
    val type: GestureActionType,
    val targetPackageName: String? = null,
    val label: String? = null
)

/**
 * User-configurable gesture shortcut mapping.
 */
data class GestureMapping(
    val id: String,
    val trigger: GestureTrigger,
    val action: GestureAction
)

/**
 * Launcher user preferences and physics tuning parameters.
 */
data class LauncherSettings(
    val centerBallSize: Float = 56f,
    val ringRadius: Float = 138f,
    val touchDeadzone: Float = 28f,
    val animationStyle: String = "smooth", // "snappy", "smooth", "bouncy"
    val colorTheme: String = "obsidian",
    val hapticsEnabled: Boolean = true,
    val emergencyStrictness: String = "high",
    val gestureMappings: List<GestureMapping> = listOf(
        GestureMapping("g-up", GestureTrigger.SWIPE_UP, GestureAction(GestureActionType.OPEN_SEARCH, label = "Universal Search")),
        GestureMapping("g-down", GestureTrigger.SWIPE_DOWN, GestureAction(GestureActionType.OPEN_TASKS, label = "Tasks & Focus Hub")),
        GestureMapping("g-left", GestureTrigger.SWIPE_LEFT, GestureAction(GestureActionType.TOGGLE_EMERGENCY, label = "Toggle Emergency Mode")),
        GestureMapping("g-right", GestureTrigger.SWIPE_RIGHT, GestureAction(GestureActionType.LAUNCH_APP, targetPackageName = "com.google.android.GoogleCamera", label = "Camera")),
        GestureMapping("g-dt", GestureTrigger.DOUBLE_TAP, GestureAction(GestureActionType.LAUNCH_DEFAULT_LAUNCHER, label = "Default Phone Launcher")),
        GestureMapping("g-lp", GestureTrigger.LONG_PRESS, GestureAction(GestureActionType.OPEN_SETTINGS, label = "Settings Hub")),
        GestureMapping("g-tt", GestureTrigger.TRIPLE_TAP, GestureAction(GestureActionType.NONE, label = "Disabled")),
        GestureMapping("g-2f", GestureTrigger.TWO_FINGER_TAP, GestureAction(GestureActionType.NONE, label = "Disabled"))
    ),
    // Task & Focus Rules configuration
    val focusStrictness: String = "strict", // "gentle", "strict"
    val baselineAppIds: List<String> = listOf("com.google.android.dialer", "com.google.android.contacts", "com.google.android.apps.messaging", "com.google.android.apps.maps", "com.google.android.deskclock"),
    val reminderIntervalDefault: String = "on_start", // "15m_before", "on_start", "30m_overdue"
    val midnightAutoPurge: Boolean = true,
    val autoFocusOnTaskStart: Boolean = true
)

