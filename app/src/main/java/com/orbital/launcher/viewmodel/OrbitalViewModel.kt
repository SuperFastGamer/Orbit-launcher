package com.orbital.launcher.viewmodel

import android.app.Application
import android.content.Context
import android.content.Intent
import android.provider.Settings
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.orbital.launcher.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlin.math.*

private val Context.dataStore by preferencesDataStore(name = "orbital_prefs")
private val IS_FIRST_LAUNCH = booleanPreferencesKey("is_first_launch")

data class LauncherUiState(
    val isFirstLaunch: Boolean = true,
    val tutorialStep: Int = 1,
    val isEmergencyActive: Boolean = false,
    val isDragging: Boolean = false,
    val dragDistance: Float = 0f,
    val dragAngle: Float = 0f,
    val activeHub: HubType? = null,
    val activeSubCategory: String? = null,
    val activeModal: ActiveModal = ActiveModal.None,
    val searchQuery: String = "",
    val installedApps: List<AppItem> = emptyList(),
    val tasks: List<TaskItem> = emptyList(),
    val focusBlockedApp: AppItem? = null,
    val customCategories: Map<String, String> = emptyMap()
)

sealed interface LauncherEvent {
    data class DragStart(val x: Float, val y: Float) : LauncherEvent
    data class DragMove(val dx: Float, val dy: Float, val currentDistance: Float, val angle: Float) : LauncherEvent
    data object DragEnd : LauncherEvent
    data class LaunchApp(val app: AppItem) : LauncherEvent
    data class ToggleEmergency(val force: Boolean? = null) : LauncherEvent
    data class OpenFolder(val category: String) : LauncherEvent
    data class OpenCalls(val target: String) : LauncherEvent
    data object OpenSearch : LauncherEvent
    data object OpenTasks : LauncherEvent
    data object OpenSettings : LauncherEvent
    data object DismissModal : LauncherEvent
    data class UpdateSearch(val query: String) : LauncherEvent
    data class AddTask(
        val title: String,
        val whitelist: List<String>,
        val startTime: String? = null,
        val endTime: String? = null
    ) : LauncherEvent
    data class UpdateTask(val task: TaskItem) : LauncherEvent
    data class ToggleTaskComplete(val taskId: String) : LauncherEvent
    data class DeleteTask(val taskId: String) : LauncherEvent
    data object ResetMidnight : LauncherEvent
    data class UpdateSettings(val settings: LauncherSettings) : LauncherEvent
    data class ReassignAppCategory(val packageName: String, val newCategory: String) : LauncherEvent
    data class ExecuteGesture(val trigger: GestureTrigger) : LauncherEvent
    data object AdvanceTutorial : LauncherEvent
    data object CompleteTutorial : LauncherEvent
}

class OrbitalViewModel(app: Application) : AndroidViewModel(app) {

    private val _uiState = MutableStateFlow(LauncherUiState())
    val uiState: StateFlow<LauncherUiState> = _uiState.asStateFlow()

    init {
        loadPreferences()
        loadInstalledApps()
        loadTasks()
    }

    private fun loadPreferences() {
        viewModelScope.launch {
            getApplication<Application>().dataStore.data
                .map { prefs -> prefs[IS_FIRST_LAUNCH] ?: true }
                .collect { isFirst ->
                    _uiState.update { it.copy(isFirstLaunch = isFirst) }
                }
        }
    }

    private fun loadInstalledApps() {
        // Query PackageManager for LAUNCHER intent apps (All installed apps with zero restrictions)
        val pm = getApplication<Application>().packageManager
        val intent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val resolved = pm.queryIntentActivities(intent, 0)
        val apps = resolved.map { resolveInfo ->
            val pkg = resolveInfo.activityInfo.packageName
            AppItem(
                id = pkg,
                name = resolveInfo.loadLabel(pm).toString(),
                packageName = pkg,
                category = _uiState.value.customCategories[pkg] ?: categorizePackage(pkg)
            )
        }
        _uiState.update { it.copy(installedApps = apps) }
    }

    private fun loadTasks() {
        _uiState.update {
            it.copy(
                tasks = listOf(
                    TaskItem(
                        id = "1",
                        title = "Quarterly client deliverable doc",
                        completed = false,
                        whitelistedPackageNames = listOf("com.google.android.apps.docs", "com.google.android.keep"),
                        startTime = "09:00",
                        endTime = "11:00"
                    ),
                    TaskItem(
                        id = "2",
                        title = "Code deep focus session",
                        completed = false,
                        whitelistedPackageNames = listOf("com.google.android.apps.docs", "com.google.android.deskclock"),
                        startTime = "13:00",
                        endTime = "15:30"
                    )
                )
            )
        }
    }

    fun onEvent(event: LauncherEvent) {
        when (event) {
            is LauncherEvent.DragStart -> {
                _uiState.update { it.copy(isDragging = true, dragDistance = 0f) }
            }
            is LauncherEvent.DragMove -> {
                val ringThreshold = _uiState.value.settings.touchDeadzone
                val selectedHub = if (event.currentDistance > ringThreshold) {
                    calculateHubFromAngle(event.angle)
                } else null

                // Generous sub-sphere detection with expanded drag ceiling (no premature collapse on outer drag)
                var subCategory: String? = null
                if (selectedHub == HubType.FOLDERS && event.currentDistance > 55f) {
                    subCategory = calculateFolderSubCategory(event.angle)
                } else if (selectedHub == HubType.CALLS && event.currentDistance > 50f) {
                    subCategory = calculateCallsSubNode(event.angle)
                }

                _uiState.update {
                    it.copy(
                        dragDistance = event.currentDistance,
                        dragAngle = event.angle,
                        activeHub = selectedHub,
                        activeSubCategory = subCategory
                    )
                }
            }
            is LauncherEvent.DragEnd -> {
                val state = _uiState.value
                handleNodeRelease(state.activeHub, state.activeSubCategory)
                _uiState.update {
                    it.copy(isDragging = false, dragDistance = 0f, activeHub = null, activeSubCategory = null)
                }
            }
            is LauncherEvent.LaunchApp -> launchAppWithFocusCheck(event.app)
            is LauncherEvent.ToggleEmergency -> {
                val nextState = event.force ?: !_uiState.value.isEmergencyActive
                _uiState.update { it.copy(isEmergencyActive = nextState) }
            }
            is LauncherEvent.DismissModal -> {
                _uiState.update { it.copy(activeModal = ActiveModal.None) }
            }
            is LauncherEvent.UpdateSearch -> {
                _uiState.update { it.copy(searchQuery = event.query) }
            }
            is LauncherEvent.AddTask -> {
                val newTask = TaskItem(
                    id = System.currentTimeMillis().toString(),
                    title = event.title,
                    completed = false,
                    whitelistedPackageNames = event.whitelist,
                    startTime = event.startTime,
                    endTime = event.endTime
                )
                _uiState.update { it.copy(tasks = listOf(newTask) + it.tasks) }
            }
            is LauncherEvent.UpdateTask -> {
                _uiState.update { state ->
                    state.copy(tasks = state.tasks.map { if (it.id == event.task.id) event.task else it })
                }
            }
            is LauncherEvent.ToggleTaskComplete -> {
                _uiState.update { state ->
                    state.copy(
                        tasks = state.tasks.map {
                            if (it.id == event.taskId) it.copy(completed = !it.completed) else it
                        }
                    )
                }
            }
            is LauncherEvent.DeleteTask -> {
                _uiState.update { state ->
                    state.copy(tasks = state.tasks.filter { it.id != event.taskId })
                }
            }
            is LauncherEvent.ResetMidnight -> {
                _uiState.update { state ->
                    state.copy(tasks = state.tasks.filter { !it.completed })
                }
            }
            is LauncherEvent.UpdateSettings -> {
                _uiState.update { it.copy(settings = event.settings) }
            }
            is LauncherEvent.ReassignAppCategory -> {
                _uiState.update { state ->
                    val updatedMap = state.customCategories + (event.packageName to event.newCategory)
                    val updatedApps = state.installedApps.map { app ->
                        if (app.packageName == event.packageName) {
                            app.copy(category = event.newCategory)
                        } else {
                            app
                        }
                    }
                    state.copy(customCategories = updatedMap, installedApps = updatedApps)
                }
            }
            is LauncherEvent.AdvanceTutorial -> {
                val next = _uiState.value.tutorialStep + 1
                if (next > 4) {
                    onEvent(LauncherEvent.CompleteTutorial)
                } else {
                    _uiState.update { it.copy(tutorialStep = next) }
                }
            }
            is LauncherEvent.CompleteTutorial -> {
                viewModelScope.launch {
                    getApplication<Application>().dataStore.edit { it[IS_FIRST_LAUNCH] = false }
                    _uiState.update { it.copy(isFirstLaunch = false) }
                }
            }
            is LauncherEvent.ExecuteGesture -> {
                val mapping = _uiState.value.settings.gestureMappings.find { it.trigger == event.trigger }
                if (mapping != null && mapping.action.type != GestureActionType.NONE) {
                    when (mapping.action.type) {
                        GestureActionType.LAUNCH_DEFAULT_LAUNCHER -> launchDefaultHomeLauncher()
                        GestureActionType.TOGGLE_EMERGENCY -> onEvent(LauncherEvent.ToggleEmergency())
                        GestureActionType.LAUNCH_APP -> {
                            val target = _uiState.value.installedApps.find { it.packageName == mapping.action.targetPackageName }
                            if (target != null) {
                                onEvent(LauncherEvent.LaunchApp(target))
                            }
                        }
                        GestureActionType.OPEN_SEARCH -> onEvent(LauncherEvent.OpenSearch)
                        GestureActionType.OPEN_TASKS -> onEvent(LauncherEvent.OpenTasks)
                        GestureActionType.OPEN_SETTINGS -> onEvent(LauncherEvent.OpenSettings)
                        else -> {}
                    }
                }
            }
            else -> {}
        }
    }

    private fun launchDefaultHomeLauncher() {
        val context = getApplication<Application>()
        try {
            // Intent to launch default home launcher / system home chooser
            val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            val chooserIntent = Intent.createChooser(homeIntent, "Select Home Launcher").apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(chooserIntent)
        } catch (_: Exception) {
            try {
                val settingsIntent = Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(settingsIntent)
            } catch (_: Exception) {}
        }
    }

    private fun handleNodeRelease(hub: HubType?, subCategory: String?) {
        if (hub == null) return
        val isEmergency = _uiState.value.isEmergencyActive

        // Hub 3: Emergency Mode toggle
        if (hub == HubType.EMERGENCY) {
            _uiState.update { it.copy(isEmergencyActive = !it.isEmergencyActive) }
            return
        }

        // Emergency restriction check
        if (isEmergency && hub != HubType.CALLS) {
            _uiState.update { it.copy(activeModal = ActiveModal.EmergencyRestricted(hub.name)) }
            return
        }

        when (hub) {
            HubType.FOLDERS -> {
                val cat = subCategory ?: "social"
                _uiState.update { it.copy(activeModal = ActiveModal.AppFolder(cat)) }
            }
            HubType.SEARCH -> {
                _uiState.update { it.copy(activeModal = ActiveModal.Search) }
            }
            HubType.CALLS -> {
                val target = subCategory ?: "phone"
                _uiState.update { it.copy(activeModal = ActiveModal.CallsSplit(target)) }
            }
            HubType.TASKS -> {
                _uiState.update { it.copy(activeModal = ActiveModal.Tasks) }
            }
            HubType.SETTINGS -> {
                _uiState.update { it.copy(activeModal = ActiveModal.Settings) }
            }
            else -> {}
        }
    }

    private fun launchAppWithFocusCheck(app: AppItem) {
        val activeIncompleteTasks = _uiState.value.tasks.filter { !it.completed }
        val isBaseline = app.isBaseline || _uiState.value.settings.baselineAppIds.contains(app.packageName)
        val isWhitelisted = activeIncompleteTasks.isEmpty() ||
                isBaseline ||
                activeIncompleteTasks.any { it.whitelistedPackageNames.contains(app.packageName) }

        if (!isWhitelisted) {
            _uiState.update { it.copy(focusBlockedApp = app) }
            return
        }

        val context = getApplication<Application>()
        val launchIntent = context.packageManager.getLaunchIntentForPackage(app.packageName)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launchIntent)
        }
    }

    private fun calculateHubFromAngle(angleRad: Float): HubType {
        val deg = Math.toDegrees(angleRad.toDouble()).let { if (it < 0) it + 360 else it }
        val slice = 360f / 6f
        val index = ((deg + slice / 2) % 360 / slice).toInt()
        return HubType.values()[index % HubType.values().size]
    }

    private fun calculateFolderSubCategory(angleRad: Float): String {
        val deg = Math.toDegrees(angleRad.toDouble()).let { if (it < 0) it + 360 else it }
        // Generous angular snap targets corresponding to sub-node angles
        val subNodes = listOf(
            "social" to 321.0,
            "media" to 340.5,
            "work" to 0.0,
            "finance" to 19.5,
            "games" to 39.0
        )
        var closest = "social"
        var minDiff = 360.0
        for ((name, targetDeg) in subNodes) {
            var diff = Math.abs(deg - targetDeg)
            if (diff > 180.0) diff = 360.0 - diff
            if (diff < minDiff) {
                minDiff = diff
                closest = name
            }
        }
        return closest
    }

    private fun calculateCallsSubNode(angleRad: Float): String {
        val deg = Math.toDegrees(angleRad.toDouble()).let { if (it < 0) it + 360 else it }
        return if (deg < 180.0) "contacts" else "phone"
    }

    fun handleBackPress(): Boolean {
        if (_uiState.value.activeModal !is ActiveModal.None) {
            _uiState.update { it.copy(activeModal = ActiveModal.None) }
            return true
        }
        return false
    }

    private fun categorizePackage(pkg: String): String {
        return when {
            pkg.contains("telegram") || pkg.contains("discord") || pkg.contains("whatsapp") -> "social"
            pkg.contains("spotify") || pkg.contains("youtube") || pkg.contains("media") -> "media"
            pkg.contains("bank") || pkg.contains("wallet") || pkg.contains("finance") -> "finance"
            pkg.contains("game") -> "games"
            else -> "work"
        }
    }
}
