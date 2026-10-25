export interface KotlinFile {
  name: string;
  path: string;
  language: string;
  code: string;
  description: string;
}

export const KOTLIN_PROJECT_FILES: KotlinFile[] = [
  {
    name: 'MainActivity.kt',
    path: 'app/src/main/java/com/orbital/launcher/MainActivity.kt',
    language: 'kotlin',
    description: 'Single Activity native Android entry point with edge-to-edge layout, gesture interception, and Compose theme setup.',
    code: `package com.orbital.launcher

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import com.orbital.launcher.ui.OrbitalLauncherScreen
import com.orbital.launcher.ui.theme.OrbitalTheme
import com.orbital.launcher.viewmodel.OrbitalViewModel

/**
 * Orbital Launcher - Ultra-minimalist single-activity native Android launcher.
 * Zero home screen clutter, radial spring gesture physics, and strict focus lock.
 */
class MainActivity : ComponentActivity() {

    private val viewModel: OrbitalViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Enable edge-to-edge display under system navigation and status bars
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContent {
            val uiState by viewModel.uiState.collectAsState()

            OrbitalTheme(colorTheme = uiState.settings.colorTheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    OrbitalLauncherScreen(
                        uiState = uiState,
                        onEvent = viewModel::onEvent
                    )
                }
            }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Intercept back button to dismiss modals smoothly back to clean center ball
        if (!viewModel.handleBackPress()) {
            super.onBackPressed()
        }
    }
}
`,
  },
  {
    name: 'OrbitalLauncherScreen.kt',
    path: 'app/src/main/java/com/orbital/launcher/ui/OrbitalLauncherScreen.kt',
    language: 'kotlin',
    description: 'Top-level screen container coordinating the custom radial canvas, tutorial onboarding, and modal overlays.',
    code: `package com.orbital.launcher.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.orbital.launcher.data.ActiveModal
import com.orbital.launcher.viewmodel.LauncherEvent
import com.orbital.launcher.viewmodel.LauncherUiState

@Composable
fun OrbitalLauncherScreen(
    uiState: LauncherUiState,
    onEvent: (LauncherEvent) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF050608))
            .systemBarsPadding()
    ) {
        // Fullscreen Radial Physics Canvas
        OrbitalCanvas(
            uiState = uiState,
            onEvent = onEvent,
            modifier = Modifier.fillMaxSize()
        )

        // First-Run Interactive Tutorial (Mandatory Onboarding)
        if (uiState.isFirstLaunch) {
            TutorialOverlay(
                uiState = uiState,
                onEvent = onEvent
            )
        }

        // Layer 3 Modals
        when (val modal = uiState.activeModal) {
            is ActiveModal.Search -> {
                TopSearchBarModal(
                    searchQuery = uiState.searchQuery,
                    onQueryChange = { onEvent(LauncherEvent.UpdateSearch(it)) },
                    apps = uiState.installedApps,
                    onLaunch = { onEvent(LauncherEvent.LaunchApp(it)) },
                    onDismiss = { onEvent(LauncherEvent.DismissModal) }
                )
            }
            is ActiveModal.AppFolder -> {
                AppFolderModal(
                    category = modal.category,
                    apps = uiState.installedApps,
                    onLaunch = { onEvent(LauncherEvent.LaunchApp(it)) },
                    onDismiss = { onEvent(LauncherEvent.DismissModal) }
                )
            }
            is ActiveModal.Tasks -> {
                TasksModal(
                    tasks = uiState.tasks,
                    apps = uiState.installedApps,
                    onAddTask = { title, whitelist, start, end ->
                        onEvent(LauncherEvent.AddTask(title, whitelist, start, end))
                    },
                    onUpdateTask = { onEvent(LauncherEvent.UpdateTask(it)) },
                    onToggleTask = { onEvent(LauncherEvent.ToggleTaskComplete(it)) },
                    onDeleteTask = { onEvent(LauncherEvent.DeleteTask(it)) },
                    onResetMidnight = { onEvent(LauncherEvent.ResetMidnight) },
                    onDismiss = { onEvent(LauncherEvent.DismissModal) }
                )
            }
            is ActiveModal.Settings -> {
                SettingsModal(
                    settings = uiState.settings,
                    apps = uiState.installedApps,
                    onUpdateSettings = { onEvent(LauncherEvent.UpdateSettings(it)) },
                    onReassignCategory = { pkg, cat -> onEvent(LauncherEvent.ReassignAppCategory(pkg, cat)) },
                    onDismiss = { onEvent(LauncherEvent.DismissModal) }
                )
            }
            else -> {}
        }
    }
}
`,
  },
  {
    name: 'OrbitalCanvas.kt',
    path: 'app/src/main/java/com/orbital/launcher/ui/OrbitalCanvas.kt',
    language: 'kotlin',
    description: 'Jetpack Compose Canvas implementation with solid center sphere, dynamic aspect-ratio adaptation (minDim/maxRadius), coordinate clamping, and >=56dp sub-sphere targets.',
    code: `package com.orbital.launcher.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.orbital.launcher.data.GestureTrigger
import com.orbital.launcher.data.HubType
import com.orbital.launcher.viewmodel.LauncherEvent
import com.orbital.launcher.viewmodel.LauncherUiState
import kotlin.math.*

/**
 * OrbitalCanvas: Custom Canvas rendering the clean solid center anchor ball,
 * dynamic aspect-ratio adapted Ring 1 (6 category hubs), Ring 2 sub-spheres (>=56dp hit targets),
 * and dynamic connecting spring laser filaments with coordinate boundary clamping.
 */
@Composable
fun OrbitalCanvas(
    uiState: LauncherUiState,
    onEvent: (LauncherEvent) -> Unit,
    modifier: Modifier = Modifier
) {
    val density = LocalDensity.current
    var centerOffset by remember { mutableStateOf(Offset.Zero) }

    // Physics-based spring animation using LowBouncy and MediumLow stiffness
    val bloomProgress = remember { Animatable(0f) }

    val springSpec = remember(uiState.settings.animationStyle) {
        when (uiState.settings.animationStyle) {
            "snappy" -> spring<Float>(
                dampingRatio = Spring.DampingRatioNoBouncy,
                stiffness = Spring.StiffnessMedium
            )
            "bouncy" -> spring<Float>(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessLow
            )
            else -> spring<Float>(
                dampingRatio = Spring.DampingRatioLowBouncy,
                stiffness = Spring.StiffnessMediumLow
            )
        }
    }

    LaunchedEffect(uiState.isDragging, springSpec) {
        bloomProgress.animateTo(
            targetValue = if (uiState.isDragging) 1f else 0f,
            animationSpec = springSpec
        )
    }

    // Hit boundary for center ball activation (~48dp)
    val centerHitBoundaryPx = with(density) {
        max(48.dp.toPx(), (uiState.settings.centerBallSize / 2f) + 16.dp.toPx())
    }

    var isTouchInitiatedInCenter by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(centerHitBoundaryPx) {
                detectTapGestures(
                    onDoubleTap = { offset ->
                        val dx = offset.x - centerOffset.x
                        val dy = offset.y - centerOffset.y
                        val dist = sqrt(dx * dx + dy * dy)
                        if (dist <= centerHitBoundaryPx) {
                            onEvent(LauncherEvent.ExecuteGesture(GestureTrigger.DOUBLE_TAP))
                        }
                    },
                    onLongPress = { offset ->
                        val dx = offset.x - centerOffset.x
                        val dy = offset.y - centerOffset.y
                        val dist = sqrt(dx * dx + dy * dy)
                        if (dist <= centerHitBoundaryPx) {
                            onEvent(LauncherEvent.ExecuteGesture(GestureTrigger.LONG_PRESS))
                        }
                    }
                )
            }
            .pointerInput(centerHitBoundaryPx) {
                detectDragGestures(
                    onDragStart = { offset ->
                        // Restrict drag detection: ONLY activates when initial touch starts within center ball hit boundary!
                        val dx = offset.x - centerOffset.x
                        val dy = offset.y - centerOffset.y
                        val initialDist = sqrt(dx * dx + dy * dy)

                        if (initialDist <= centerHitBoundaryPx) {
                            isTouchInitiatedInCenter = true
                            onEvent(LauncherEvent.DragStart(offset.x, offset.y))
                        } else {
                            isTouchInitiatedInCenter = false
                        }
                    },
                    onDragEnd = {
                        if (isTouchInitiatedInCenter) {
                            isTouchInitiatedInCenter = false
                            onEvent(LauncherEvent.DragEnd)
                        }
                    },
                    onDragCancel = {
                        if (isTouchInitiatedInCenter) {
                            isTouchInitiatedInCenter = false
                            onEvent(LauncherEvent.DragEnd)
                        }
                    },
                    onDrag = { change, _ ->
                        if (!isTouchInitiatedInCenter) return@detectDragGestures

                        change.consume()
                        val current = change.position
                        val dx = current.x - centerOffset.x
                        val dy = current.y - centerOffset.y
                        val dist = sqrt(dx * dx + dy * dy)
                        val angle = atan2(dy, dx)
                        onEvent(LauncherEvent.DragMove(dx, dy, dist, angle))
                    }
                )
            }
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            centerOffset = Offset(size.width / 2f, size.height / 2f)

            // Dynamic Screen Boundary & Aspect Ratio Adaptation
            val minDim = min(size.width, size.height)
            val satelliteBallRadius = 26.dp.toPx()
            val maxRadius = (minDim / 2f) - (satelliteBallRadius + 16.dp.toPx())

            // Scaled ring distances linked to settings.ringRadius with baseSpread
            val baseSpread = (uiState.settings.ringRadius / 140f).coerceIn(0.7f, 1.4f)
            val ring1Radius = (0.35f * maxRadius * baseSpread) * bloomProgress.value
            val ring2Radius = (0.65f * maxRadius * baseSpread) * bloomProgress.value
            val ring3Radius = (0.88f * maxRadius * baseSpread) * bloomProgress.value

            val centerRadius = uiState.settings.centerBallSize / 2f

            // Coordinate clamping helper: strictly within [radius + 8.dp, width - (radius + 8.dp)] and [radius + 8.dp, height - (radius + 8.dp)]
            fun clampSphere(rawX: Float, rawY: Float, radius: Float): Offset {
                val pad = radius + 8.dp.toPx()
                val cx = rawX.coerceIn(pad, size.width - pad)
                val cy = rawY.coerceIn(pad, size.height - pad)
                return Offset(cx, cy)
            }

            // EMERGENCY MODE: Red warning barrier wrap around edge & center hub
            if (uiState.isEmergencyActive) {
                drawCircle(
                    color = Color.Red.copy(alpha = 0.45f),
                    radius = (minDim / 2f) - 8.dp.toPx(),
                    center = centerOffset,
                    style = Stroke(width = 6f)
                )
                drawCircle(
                    color = Color.Red.copy(alpha = 0.85f),
                    radius = centerRadius + 16f,
                    center = centerOffset,
                    style = Stroke(width = 3.5f)
                )
            }

            // Fixed Dead Center Anchor Ball: Clean, solid, smooth sphere (NO inner black dot)
            drawCircle(
                color = if (uiState.isEmergencyActive) Color(0xFFEF4444) else Color.White,
                radius = centerRadius,
                center = centerOffset
            )

            // RING 1: 6 Satellite category hubs with spring blooming
            if (bloomProgress.value > 0.05f) {
                drawCircle(
                    color = if (uiState.isEmergencyActive) Color.Red.copy(alpha = 0.25f) else Color.White.copy(alpha = 0.12f),
                    radius = ring1Radius,
                    center = centerOffset,
                    style = Stroke(
                        width = 1.5f,
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 16f), 0f)
                    )
                )

                val hubs = HubType.values()
                val angleStep = (2 * PI / hubs.size).toFloat()

                hubs.forEachIndexed { index, hub ->
                    val angle = index * angleStep
                    val rawSatX = centerOffset.x + ring1Radius * cos(angle)
                    val rawSatY = centerOffset.y + ring1Radius * sin(angle)
                    val isHovered = uiState.activeHub == hub
                    val satRadius = if (isHovered) 28.dp.toPx() else 22.dp.toPx()
                    val satelliteCenter = clampSphere(rawSatX, rawSatY, satRadius)

                    val isBlocked = uiState.isEmergencyActive && hub != HubType.CALLS && hub != HubType.EMERGENCY

                    // Laser connective filament line
                    drawLine(
                        color = when {
                            isBlocked -> Color.Red.copy(alpha = 0.2f)
                            isHovered -> Color(0xFF60A5FA)
                            else -> Color.White.copy(alpha = 0.16f * bloomProgress.value)
                        },
                        start = centerOffset,
                        end = satelliteCenter,
                        strokeWidth = if (isHovered) 3f else 1.5f
                    )

                    val hubColor = when {
                        isBlocked -> Color.DarkGray.copy(alpha = 0.4f)
                        hub == HubType.EMERGENCY -> Color(0xFFEF4444)
                        isHovered -> Color(0xFF60A5FA)
                        else -> Color(0xFF1E293B)
                    }

                    drawCircle(
                        color = hubColor,
                        radius = satRadius * bloomProgress.value,
                        center = satelliteCenter
                    )

                    // Layer 2 & Ring 3 Sub-Spheres (Folders): Generous >= 56dp hit radius
                    if (hub == HubType.FOLDERS && isHovered && bloomProgress.value > 0.45f) {
                        val folderSubs = listOf("Social", "Media", "Work", "Finance", "Games")
                        val subAngleOffsets = floatArrayOf(-0.68f, -0.34f, 0f, 0.34f, 0.68f)
                        val folderDistance = ring2Radius.coerceAtLeast(ring1Radius + 48.dp.toPx())

                        folderSubs.forEachIndexed { subIdx, subLabel ->
                            val subAngle = angle + subAngleOffsets[subIdx]
                            val rawSubX = centerOffset.x + folderDistance * cos(subAngle)
                            val rawSubY = centerOffset.y + folderDistance * sin(subAngle)
                            val isSubHovered = uiState.activeSubCategory?.equals(subLabel, ignoreCase = true) == true
                            val subVisualRadius = if (isSubHovered) 24.dp.toPx() else 18.dp.toPx()
                            val subCenter = clampSphere(rawSubX, rawSubY, subVisualRadius)

                            drawLine(
                                color = Color(0xFF38BDF8).copy(alpha = 0.65f),
                                start = satelliteCenter,
                                end = subCenter,
                                strokeWidth = if (isSubHovered) 2.5f else 1.6f
                            )

                            drawCircle(
                                color = if (isSubHovered) Color(0xFF38BDF8) else Color(0xFF0F172A),
                                radius = subVisualRadius,
                                center = subCenter
                            )
                            drawCircle(
                                color = if (isSubHovered) Color.White else Color.White.copy(alpha = 0.75f),
                                radius = subVisualRadius,
                                center = subCenter,
                                style = Stroke(width = if (isSubHovered) 2.5f else 1.6f)
                            )
                        }
                    }

                    // Ring 2 Sub-Spheres (Calls): 2-node split
                    if (hub == HubType.CALLS && isHovered && bloomProgress.value > 0.45f) {
                        val callsSubs = listOf("Contacts", "Phone")
                        val callAngleOffsets = floatArrayOf(-0.38f, 0.38f)
                        val callSplitDistance = ring2Radius.coerceAtLeast(ring1Radius + 44.dp.toPx())

                        callsSubs.forEachIndexed { callIdx, callLabel ->
                            val callAngle = angle + callAngleOffsets[callIdx]
                            val rawCallX = centerOffset.x + callSplitDistance * cos(callAngle)
                            val rawCallY = centerOffset.y + callSplitDistance * sin(callAngle)
                            val isCallHovered = uiState.activeSubCategory?.equals(callLabel, ignoreCase = true) == true
                            val callVisualRadius = if (isCallHovered) 24.dp.toPx() else 18.dp.toPx()
                            val callCenter = clampSphere(rawCallX, rawCallY, callVisualRadius)

                            drawLine(
                                color = Color(0xFF34D399).copy(alpha = 0.7f),
                                start = satelliteCenter,
                                end = callCenter,
                                strokeWidth = if (isCallHovered) 2.5f else 1.8f
                            )

                            drawCircle(
                                color = if (isCallHovered) Color(0xFF10B981) else Color(0xFF064E3B),
                                radius = callVisualRadius,
                                center = callCenter
                            )
                            drawCircle(
                                color = Color.White.copy(alpha = 0.9f),
                                radius = callVisualRadius,
                                center = callCenter,
                                style = Stroke(width = 2f)
                            )
                        }
                    }
                }
            }
        }
    }
}
`,
  },
  {
    name: 'OrbitalViewModel.kt',
    path: 'app/src/main/java/com/orbital/launcher/viewmodel/OrbitalViewModel.kt',
    language: 'kotlin',
    description: 'ViewModel with gesture sensitivity parameters, task editing, scheduling, and unrestricted whitelist management.',
    code: `package com.orbital.launcher.viewmodel

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
    val settings: LauncherSettings = LauncherSettings(),
    val customCategories: Map<String, String> = emptyMap(),
    val focusBlockedApp: AppItem? = null
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
        val pm = getApplication<Application>().packageManager
        val intent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val resolved = pm.queryIntentActivities(intent, 0)
        val apps = resolved.map { resolveInfo ->
            AppItem(
                id = resolveInfo.activityInfo.packageName,
                name = resolveInfo.loadLabel(pm).toString(),
                packageName = resolveInfo.activityInfo.packageName,
                category = categorizePackage(resolveInfo.activityInfo.packageName)
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

        if (hub == HubType.EMERGENCY) {
            _uiState.update { it.copy(isEmergencyActive = !it.isEmergencyActive) }
            return
        }

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
`,
  },
  {
    name: 'HubModals.kt',
    path: 'app/src/main/java/com/orbital/launcher/ui/HubModals.kt',
    language: 'kotlin',
    description: 'Jetpack Compose composables with Gestures & Sensitivity tab, TasksModal editing, optional start/end scheduling, and unrestricted whitelist.',
    code: `package com.orbital.launcher.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.orbital.launcher.data.*
import com.orbital.launcher.viewmodel.LauncherEvent

@Composable
fun TopSearchBarModal(
    searchQuery: String,
    onQueryChange: (String) -> Unit,
    apps: List<AppItem>,
    onLaunch: (AppItem) -> Unit,
    onDismiss: () -> Unit
) {
    val focusRequester = remember { FocusRequester() }
    val keyboardController = LocalSoftwareKeyboardController.current

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
        keyboardController?.show()
    }

    val filteredApps = remember(searchQuery, apps) {
        if (searchQuery.isBlank()) apps else {
            apps.filter {
                it.name.contains(searchQuery, ignoreCase = true) ||
                it.packageName.contains(searchQuery, ignoreCase = true) ||
                it.category.contains(searchQuery, ignoreCase = true)
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.85f))
            .clickable { onDismiss() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 48.dp, start = 16.dp, end = 16.dp)
                .clickable(enabled = false) {}
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = onQueryChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .focusRequester(focusRequester),
                placeholder = { Text("Search apps, shortcuts, contacts...", color = Color.Gray) },
                singleLine = true,
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = "Search", tint = Color(0xFF60A5FA))
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { onQueryChange("") }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear", tint = Color.LightGray)
                        }
                    }
                },
                shape = RoundedCornerShape(18.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedContainerColor = Color(0xFF0F172A),
                    unfocusedContainerColor = Color(0xFF0F172A),
                    focusedBorderColor = Color(0xFF38BDF8),
                    unfocusedBorderColor = Color.White.copy(alpha = 0.15f)
                )
            )

            Spacer(modifier = Modifier.height(12.dp))

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 420.dp),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A).copy(alpha = 0.95f))
            ) {
                if (filteredApps.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No matching applications found", color = Color.Gray, fontSize = 13.sp)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        items(filteredApps, key = { it.id }) { app ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onLaunch(app) }
                                    .padding(horizontal = 16.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0xFF1E293B)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        app.name.take(1),
                                        color = Color.White,
                                        style = MaterialTheme.typography.titleMedium
                                    )
                                }
                                Spacer(modifier = Modifier.width(14.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = app.name,
                                        color = Color.White,
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    Text(
                                        text = "\${app.category.uppercase()} · \${app.packageName}",
                                        color = Color.Gray,
                                        fontSize = 11.sp
                                    )
                                }
                                Icon(
                                    Icons.Default.ArrowForward,
                                    contentDescription = "Launch",
                                    tint = Color.Gray,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TasksModal(
    tasks: List<TaskItem>,
    apps: List<AppItem>,
    onAddTask: (String, List<String>, String?, String?) -> Unit,
    onUpdateTask: (TaskItem) -> Unit,
    onToggleTask: (String) -> Unit,
    onDeleteTask: (String) -> Unit,
    onResetMidnight: () -> Unit,
    onDismiss: () -> Unit
) {
    var isEditorOpen by remember { mutableStateOf(false) }
    var editingTaskId by remember { mutableStateOf<String?>(null) }

    var taskTitle by remember { mutableStateOf("") }
    var startTime by remember { mutableStateOf("") }
    var endTime by remember { mutableStateOf("") }
    var selectedWhitelist by remember { mutableStateOf<List<String>>(emptyList()) }
    var appSearchQuery by remember { mutableStateOf("") }

    val filteredApps = remember(appSearchQuery, apps) {
        if (appSearchQuery.isBlank()) apps else {
            apps.filter {
                it.name.contains(appSearchQuery, ignoreCase = true) ||
                it.packageName.contains(appSearchQuery, ignoreCase = true)
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.75f))
            .clickable { onDismiss() },
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .width(380.dp)
                .wrapContentHeight()
                .clickable(enabled = false) {},
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Focus & Task Hub", style = MaterialTheme.typography.titleMedium, color = Color.White)
                        Text("Tasks schedule deliverables and whitelist apps", fontSize = 11.sp, color = Color.Gray)
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.LightGray)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (!isEditorOpen) {
                    Button(
                        onClick = {
                            editingTaskId = null
                            taskTitle = ""
                            startTime = ""
                            endTime = ""
                            selectedWhitelist = listOf("com.google.android.apps.docs", "com.google.android.keep")
                            isEditorOpen = true
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, tint = Color(0xFF60A5FA), modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Create Deliverable with Whitelist", fontSize = 12.sp, color = Color.White)
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 240.dp)
                    ) {
                        items(tasks, key = { it.id }) { task ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFF1E293B).copy(alpha = 0.6f))
                                    .padding(horizontal = 10.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = task.completed,
                                    onCheckedChange = { onToggleTask(task.id) },
                                    colors = CheckboxDefaults.colors(
                                        checkedColor = Color(0xFF10B981),
                                        uncheckedColor = Color.Gray
                                    )
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = task.title,
                                        fontSize = 13.sp,
                                        color = if (task.completed) Color.Gray else Color.White
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        if (task.startTime != null || task.endTime != null) {
                                            Text(
                                                text = "\${task.startTime ?: "Any"}–\${task.endTime ?: "Open"}",
                                                fontSize = 10.sp,
                                                color = Color(0xFFFBBF24)
                                            )
                                        }
                                        Text(
                                            text = "Whitelisted: \${task.whitelistedPackageNames.size} apps",
                                            fontSize = 10.sp,
                                            color = Color(0xFF34D399)
                                        )
                                    }
                                }
                                IconButton(
                                    onClick = {
                                        editingTaskId = task.id
                                        taskTitle = task.title
                                        startTime = task.startTime ?: ""
                                        endTime = task.endTime ?: ""
                                        selectedWhitelist = task.whitelistedPackageNames
                                        isEditorOpen = true
                                    }
                                ) {
                                    Icon(Icons.Default.Edit, contentDescription = "Edit", tint = Color(0xFF60A5FA), modifier = Modifier.size(16.dp))
                                }
                                IconButton(onClick = { onDeleteTask(task.id) }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.Gray, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            if (editingTaskId != null) "Edit Task & Whitelist" else "New Scheduled Task",
                            fontSize = 12.sp,
                            color = Color(0xFF60A5FA)
                        )
                        OutlinedTextField(
                            value = taskTitle,
                            onValueChange = { taskTitle = it },
                            placeholder = { Text("Task deliverable...", fontSize = 12.sp, color = Color.Gray) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp)
                        )

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = startTime,
                                onValueChange = { startTime = it },
                                placeholder = { Text("Start (e.g. 09:00)", fontSize = 11.sp, color = Color.Gray) },
                                modifier = Modifier.weight(1f),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp)
                            )
                            OutlinedTextField(
                                value = endTime,
                                onValueChange = { endTime = it },
                                placeholder = { Text("End (e.g. 11:30)", fontSize = 11.sp, color = Color.Gray) },
                                modifier = Modifier.weight(1f),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp)
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Unrestricted App Whitelist", fontSize = 11.sp, color = Color.LightGray)
                            Text("Whitelisted: \${selectedWhitelist.size} apps", fontSize = 11.sp, color = Color(0xFF34D399))
                        }

                        OutlinedTextField(
                            value = appSearchQuery,
                            onValueChange = { appSearchQuery = it },
                            placeholder = { Text("Filter all apps...", fontSize = 11.sp, color = Color.Gray) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )

                        LazyVerticalGrid(
                            columns = GridCells.Fixed(3),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(110.dp)
                        ) {
                            items(filteredApps) { app ->
                                val isChecked = selectedWhitelist.contains(app.packageName)
                                Row(
                                    modifier = Modifier
                                        .padding(2.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (isChecked) Color(0xFF1E3A8A) else Color(0xFF1E293B))
                                        .clickable {
                                            selectedWhitelist = if (isChecked) {
                                                selectedWhitelist - app.packageName
                                            } else {
                                                selectedWhitelist + app.packageName
                                            }
                                        }
                                        .padding(horizontal = 6.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(app.name, fontSize = 10.sp, color = Color.White, maxLines = 1)
                                }
                            }
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            TextButton(
                                onClick = { isEditorOpen = false },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Cancel", color = Color.Gray, fontSize = 12.sp)
                            }
                            Button(
                                onClick = {
                                    if (taskTitle.isNotBlank()) {
                                        if (editingTaskId != null) {
                                            val existing = tasks.find { it.id == editingTaskId }
                                            if (existing != null) {
                                                onUpdateTask(
                                                    existing.copy(
                                                        title = taskTitle.trim(),
                                                        whitelistedPackageNames = selectedWhitelist,
                                                        startTime = startTime.ifBlank { null },
                                                        endTime = endTime.ifBlank { null }
                                                    )
                                                )
                                            }
                                        } else {
                                            onAddTask(
                                                taskTitle.trim(),
                                                selectedWhitelist,
                                                startTime.ifBlank { null },
                                                endTime.ifBlank { null }
                                            )
                                        }
                                        isEditorOpen = false
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Save Task", fontSize = 12.sp)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Auto-purges at 00:00", fontSize = 10.sp, color = Color.Gray)
                    TextButton(onClick = onResetMidnight) {
                        Text("Midnight Reset", fontSize = 10.sp, color = Color(0xFF38BDF8))
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsModal(
    settings: LauncherSettings,
    apps: List<AppItem> = emptyList(),
    onUpdateSettings: (LauncherSettings) -> Unit,
    onReassignCategory: (String, String) -> Unit = { _, _ -> },
    onDismiss: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Gesture Shortcuts", "Gestures & Sensitivity", "Visuals", "App Folders", "Emergency", "Focus Rules")

    var editingTrigger by remember { mutableStateOf<GestureTrigger?>(null) }
    var selectedActionType by remember { mutableStateOf(GestureActionType.LAUNCH_APP) }
    var selectedPackageName by remember { mutableStateOf("") }
    var appSearchFilter by remember { mutableStateOf("") }
    var baselineSearchFilter by remember { mutableStateOf("") }
    var folderAppSearchFilter by remember { mutableStateOf("") }
    var activeFolderPickerPackage by remember { mutableStateOf<String?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.75f))
            .clickable { onDismiss() },
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .width(420.dp)
                .wrapContentHeight()
                .clickable(enabled = false) {},
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Settings Hub", style = MaterialTheme.typography.titleMedium, color = Color.White)
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.LightGray)
                    }
                }

                ScrollableTabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Color.Transparent,
                    contentColor = Color(0xFF60A5FA),
                    edgePadding = 0.dp
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            text = { Text(title, fontSize = 11.sp) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                when (selectedTab) {
                    // Tab 0: Custom Gesture Mapping Shortcuts Screen
                    0 -> {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Center Ball Swipe & Tap Shortcuts", fontSize = 12.sp, color = Color.White)
                                TextButton(
                                    onClick = {
                                        onUpdateSettings(settings.copy(gestureMappings = LauncherSettings().gestureMappings))
                                    },
                                    contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("Reset Defaults", fontSize = 10.sp, color = Color(0xFF38BDF8))
                                }
                            }

                            LazyColumn(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(max = 240.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(GestureTrigger.values()) { trigger ->
                                    val currentMapping = settings.gestureMappings.find { it.trigger == trigger }
                                    val action = currentMapping?.action ?: GestureAction(GestureActionType.NONE)

                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Color(0xFF1E293B))
                                            .padding(horizontal = 10.dp, vertical = 8.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(trigger.displayName, fontSize = 12.sp, color = Color.White)
                                            Text(
                                                when (action.type) {
                                                    GestureActionType.LAUNCH_DEFAULT_LAUNCHER -> "Default Phone Launcher"
                                                    GestureActionType.LAUNCH_APP -> {
                                                        val targetApp = apps.find { it.packageName == action.targetPackageName }
                                                        "Launch: \${targetApp?.name ?: action.label ?: action.targetPackageName ?: \\"App\\"}"
                                                    }
                                                    GestureActionType.TOGGLE_EMERGENCY -> "Toggle Emergency Mode"
                                                    GestureActionType.OPEN_SEARCH -> "Universal Search"
                                                    GestureActionType.OPEN_TASKS -> "Tasks & Focus Hub"
                                                    GestureActionType.OPEN_SETTINGS -> "Settings Hub"
                                                    GestureActionType.NONE -> "Disabled"
                                                },
                                                fontSize = 10.sp,
                                                color = when (action.type) {
                                                    GestureActionType.LAUNCH_DEFAULT_LAUNCHER -> Color(0xFFF59E0B)
                                                    GestureActionType.TOGGLE_EMERGENCY -> Color(0xFFEF4444)
                                                    GestureActionType.LAUNCH_APP -> Color(0xFF60A5FA)
                                                    else -> Color(0xFF34D399)
                                                }
                                            )
                                        }

                                        Button(
                                            onClick = {
                                                editingTrigger = trigger
                                                selectedActionType = action.type
                                                selectedPackageName = action.targetPackageName ?: (apps.firstOrNull()?.packageName ?: "")
                                            },
                                            shape = RoundedCornerShape(8.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Text("Change", fontSize = 10.sp)
                                        }
                                    }
                                }
                            }

                            // Gesture Action Assignment Dialog / Sub-panel
                            if (editingTrigger != null) {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B).copy(alpha = 0.95f))
                                ) {
                                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Text(
                                            "Map Action for \${editingTrigger?.displayName}",
                                            fontSize = 11.sp,
                                            color = Color.White
                                        )

                                        // Action type selector: 6 Core Actions + Disabled
                                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                val row1 = listOf(
                                                    GestureActionType.LAUNCH_DEFAULT_LAUNCHER to "Default Launcher",
                                                    GestureActionType.LAUNCH_APP to "Launch App",
                                                    GestureActionType.TOGGLE_EMERGENCY to "Emergency"
                                                )
                                                row1.forEach { (type, label) ->
                                                    val isSelected = selectedActionType == type
                                                    Button(
                                                        onClick = { selectedActionType = type },
                                                        colors = ButtonDefaults.buttonColors(
                                                            containerColor = if (isSelected) {
                                                                if (type == GestureActionType.TOGGLE_EMERGENCY) Color(0xFFEF4444)
                                                                else if (type == GestureActionType.LAUNCH_DEFAULT_LAUNCHER) Color(0xFFF59E0B)
                                                                else Color(0xFF2563EB)
                                                            } else Color(0xFF312E81)
                                                        ),
                                                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 4.dp),
                                                        modifier = Modifier.weight(1f),
                                                        shape = RoundedCornerShape(8.dp)
                                                    ) {
                                                        Text(label, fontSize = 9.sp, maxLines = 1)
                                                    }
                                                }
                                            }

                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                val row2 = listOf(
                                                    GestureActionType.OPEN_SEARCH to "Search",
                                                    GestureActionType.OPEN_TASKS to "Tasks",
                                                    GestureActionType.OPEN_SETTINGS to "Settings"
                                                )
                                                row2.forEach { (type, label) ->
                                                    val isSelected = selectedActionType == type
                                                    Button(
                                                        onClick = { selectedActionType = type },
                                                        colors = ButtonDefaults.buttonColors(
                                                            containerColor = if (isSelected) Color(0xFF2563EB) else Color(0xFF312E81)
                                                        ),
                                                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 4.dp),
                                                        modifier = Modifier.weight(1f),
                                                        shape = RoundedCornerShape(8.dp)
                                                    ) {
                                                        Text(label, fontSize = 9.sp, maxLines = 1)
                                                    }
                                                }
                                            }

                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                val isSelected = selectedActionType == GestureActionType.NONE
                                                Button(
                                                    onClick = { selectedActionType = GestureActionType.NONE },
                                                    colors = ButtonDefaults.buttonColors(
                                                        containerColor = if (isSelected) Color(0xFF475569) else Color(0xFF1E293B)
                                                    ),
                                                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 4.dp),
                                                    modifier = Modifier.fillMaxWidth(),
                                                    shape = RoundedCornerShape(8.dp)
                                                ) {
                                                    Text("Disabled (No Action)", fontSize = 9.sp)
                                                }
                                            }
                                        }

                                        // Target App selection list if LAUNCH_APP
                                        if (selectedActionType == GestureActionType.LAUNCH_APP) {
                                            OutlinedTextField(
                                                value = appSearchFilter,
                                                onValueChange = { appSearchFilter = it },
                                                placeholder = { Text("Filter apps...", fontSize = 10.sp, color = Color.Gray) },
                                                modifier = Modifier.fillMaxWidth(),
                                                singleLine = true,
                                                shape = RoundedCornerShape(8.dp)
                                            )

                                            val filteredApps = apps.filter {
                                                it.name.contains(appSearchFilter, ignoreCase = true) ||
                                                it.packageName.contains(appSearchFilter, ignoreCase = true)
                                            }

                                            LazyColumn(modifier = Modifier.height(80.dp)) {
                                                items(filteredApps) { app ->
                                                    val isSelected = selectedPackageName == app.packageName
                                                    Row(
                                                        modifier = Modifier
                                                            .fillMaxWidth()
                                                            .clickable { selectedPackageName = app.packageName }
                                                            .background(if (isSelected) Color(0xFF3730A3) else Color.Transparent)
                                                            .padding(horizontal = 6.dp, vertical = 4.dp),
                                                        horizontalArrangement = Arrangement.SpaceBetween
                                                    ) {
                                                        Text(app.name, fontSize = 10.sp, color = Color.White)
                                                        if (isSelected) {
                                                            Text("Selected", fontSize = 9.sp, color = Color(0xFF38BDF8))
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            TextButton(
                                                onClick = { editingTrigger = null },
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Text("Cancel", fontSize = 11.sp, color = Color.Gray)
                                            }

                                            Button(
                                                onClick = {
                                                    val trigger = editingTrigger ?: return@Button
                                                    val app = apps.find { it.packageName == selectedPackageName }
                                                    val actionLabel = when (selectedActionType) {
                                                        GestureActionType.LAUNCH_DEFAULT_LAUNCHER -> "Default Phone Launcher"
                                                        GestureActionType.LAUNCH_APP -> "Launch \${app?.name ?: \\"App\\"}"
                                                        GestureActionType.TOGGLE_EMERGENCY -> "Toggle Emergency Mode"
                                                        GestureActionType.OPEN_SEARCH -> "Universal Search"
                                                        GestureActionType.OPEN_TASKS -> "Tasks & Focus Hub"
                                                        GestureActionType.OPEN_SETTINGS -> "Settings Hub"
                                                        GestureActionType.NONE -> "Disabled"
                                                    }

                                                    val newAction = GestureAction(
                                                        type = selectedActionType,
                                                        targetPackageName = if (selectedActionType == GestureActionType.LAUNCH_APP) selectedPackageName else null,
                                                        label = actionLabel
                                                    )
                                                    val existing = settings.gestureMappings.find { it.trigger == trigger }
                                                    val updatedMappings = if (existing != null) {
                                                        settings.gestureMappings.map { m ->
                                                            if (m.trigger == trigger) m.copy(action = newAction) else m
                                                        }
                                                    } else {
                                                        settings.gestureMappings + GestureMapping(
                                                            id = "g-\${trigger.name.lowercase()}",
                                                            trigger = trigger,
                                                            action = newAction
                                                        )
                                                    }

                                                    onUpdateSettings(settings.copy(gestureMappings = updatedMappings))
                                                    editingTrigger = null
                                                },
                                                modifier = Modifier.weight(1f),
                                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                                shape = RoundedCornerShape(8.dp)
                                            ) {
                                                Text("Save Shortcut", fontSize = 11.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Tab 1: Gestures & Sensitivity
                    1 -> {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("Drag Expansion Radius: \${settings.ringRadius.toInt()}dp", fontSize = 12.sp, color = Color.LightGray)
                            Slider(
                                value = settings.ringRadius,
                                onValueChange = { onUpdateSettings(settings.copy(ringRadius = it)) },
                                valueRange = 90f..200f
                            )

                            Text("Touch Deadzone & Sensitivity: \${settings.touchDeadzone.toInt()}dp", fontSize = 12.sp, color = Color.LightGray)
                            Slider(
                                value = settings.touchDeadzone,
                                onValueChange = { onUpdateSettings(settings.copy(touchDeadzone = it)) },
                                valueRange = 15f..48f
                            )

                            Text("Animation Spring Style: \${settings.animationStyle.replaceFirstChar { it.uppercase() }}", fontSize = 12.sp, color = Color.LightGray)
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                listOf("snappy", "smooth", "bouncy").forEach { style ->
                                    Button(
                                        onClick = { onUpdateSettings(settings.copy(animationStyle = style)) },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (settings.animationStyle == style) Color(0xFF2563EB) else Color(0xFF1E293B)
                                        ),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                    ) {
                                        Text(style.replaceFirstChar { it.uppercase() }, fontSize = 11.sp)
                                    }
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Haptic Feedback on Snapping", fontSize = 12.sp, color = Color.White)
                                Switch(
                                    checked = settings.hapticsEnabled,
                                    onCheckedChange = { onUpdateSettings(settings.copy(hapticsEnabled = it)) }
                                )
                            }
                        }
                    }

                    // Tab 2: Visuals
                    2 -> {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("Center Anchor Diameter: \${settings.centerBallSize.toInt()}px", fontSize = 12.sp, color = Color.LightGray)
                            Slider(
                                value = settings.centerBallSize,
                                onValueChange = { onUpdateSettings(settings.copy(centerBallSize = it)) },
                                valueRange = 40f..76f
                            )
                        }
                    }

                    // Tab 3: App Folders (Custom Category Reassignment)
                    3 -> {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text("Reassign Apps to Orbital Folders", fontSize = 12.sp, color = Color.White)
                            Text("Move any installed app into Social, Media, Work, Finance, or Games", fontSize = 10.sp, color = Color.Gray)

                            OutlinedTextField(
                                value = folderAppSearchFilter,
                                onValueChange = { folderAppSearchFilter = it },
                                modifier = Modifier.fillMaxWidth(),
                                placeholder = { Text("Search installed apps...", fontSize = 11.sp, color = Color.Gray) },
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White,
                                    focusedContainerColor = Color(0xFF1E293B),
                                    unfocusedContainerColor = Color(0xFF1E293B)
                                )
                            )

                            val filteredFolderApps = apps.filter {
                                folderAppSearchFilter.isBlank() ||
                                it.name.contains(folderAppSearchFilter, ignoreCase = true) ||
                                it.packageName.contains(folderAppSearchFilter, ignoreCase = true)
                            }

                            val folderCategories = listOf(
                                "social" to "Social",
                                "media" to "Media",
                                "work" to "Work",
                                "finance" to "Finance",
                                "games" to "Games"
                            )

                            LazyColumn(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(max = 240.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(filteredFolderApps, key = { it.packageName }) { app ->
                                    val isPickerOpen = activeFolderPickerPackage == app.packageName
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Color(0xFF1E293B))
                                            .padding(10.dp),
                                        verticalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(app.name, fontSize = 12.sp, color = Color.White, maxLines = 1)
                                                Text(app.packageName, fontSize = 9.sp, color = Color.Gray, maxLines = 1)
                                            }

                                            Button(
                                                onClick = {
                                                    activeFolderPickerPackage = if (isPickerOpen) null else app.packageName
                                                },
                                                colors = ButtonDefaults.buttonColors(
                                                    containerColor = when (app.category.lowercase()) {
                                                        "social" -> Color(0xFFEC4899)
                                                        "media" -> Color(0xFF8B5CF6)
                                                        "work" -> Color(0xFF3B82F6)
                                                        "finance" -> Color(0xFF10B981)
                                                        "games" -> Color(0xFFF59E0B)
                                                        else -> Color(0xFF64748B)
                                                    }
                                                ),
                                                shape = RoundedCornerShape(16.dp),
                                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                            ) {
                                                Text(
                                                    text = app.category.replaceFirstChar { it.uppercase() },
                                                    fontSize = 10.sp,
                                                    color = Color.White
                                                )
                                            }
                                        }

                                        if (isPickerOpen) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                folderCategories.forEach { (catId, catLabel) ->
                                                    val isCurrent = app.category.equals(catId, ignoreCase = true)
                                                    Box(
                                                        modifier = Modifier
                                                            .weight(1f)
                                                            .clip(RoundedCornerShape(8.dp))
                                                            .background(
                                                                if (isCurrent) Color(0xFF38BDF8) else Color(0xFF334155)
                                                            )
                                                            .clickable {
                                                                onReassignCategory(app.packageName, catId)
                                                                activeFolderPickerPackage = null
                                                            }
                                                            .padding(vertical = 4.dp),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Text(
                                                            text = catLabel,
                                                            fontSize = 9.sp,
                                                            color = if (isCurrent) Color.Black else Color.White
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Tab 4: Emergency Settings
                    4 -> {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("Emergency Lockdown Strictness", fontSize = 12.sp, color = Color.LightGray)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = { onUpdateSettings(settings.copy(emergencyStrictness = "high")) },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (settings.emergencyStrictness == "high") Color(0xFFEF4444) else Color(0xFF1E293B)
                                    )
                                ) {
                                    Text("High Barrier", fontSize = 11.sp)
                                }
                                Button(
                                    onClick = { onUpdateSettings(settings.copy(emergencyStrictness = "maximum")) },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (settings.emergencyStrictness == "maximum") Color(0xFFEF4444) else Color(0xFF1E293B)
                                    )
                                ) {
                                    Text("Maximum SOS", fontSize = 11.sp)
                                }
                            }
                            Text(
                                "Calls and Phone Dialer are NEVER blocked under any circumstance.",
                                fontSize = 11.sp,
                                color = Color(0xFF34D399)
                            )
                        }
                    }

                    // Tab 5: Task & Focus Rules
                    5 -> {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // 1. Focus Lock Strictness
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("Focus Lock Strictness", fontSize = 12.sp, color = Color.White)
                                Text("Choose how non-whitelisted apps are treated during active tasks", fontSize = 10.sp, color = Color.Gray)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(
                                        onClick = { onUpdateSettings(settings.copy(focusStrictness = "gentle")) },
                                        modifier = Modifier.weight(1f),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (settings.focusStrictness == "gentle") Color(0xFF2563EB) else Color(0xFF1E293B)
                                        ),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text("Gentle Alert", fontSize = 11.sp)
                                    }
                                    Button(
                                        onClick = { onUpdateSettings(settings.copy(focusStrictness = "strict")) },
                                        modifier = Modifier.weight(1f),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (settings.focusStrictness == "strict") Color(0xFFEF4444) else Color(0xFF1E293B)
                                        ),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text("Strict Lockdown", fontSize = 11.sp)
                                    }
                                }
                            }

                            // 2. Permanent Baseline Whitelist
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("Permanent Baseline Whitelist", fontSize = 12.sp, color = Color.White)
                                    Text(
                                        "Whitelisted: \${settings.baselineAppIds.size} apps",
                                        fontSize = 11.sp,
                                        color = Color(0xFF38BDF8)
                                    )
                                }
                                Text("Exempt apps that can always be opened regardless of focus tasks", fontSize = 10.sp, color = Color.Gray)

                                OutlinedTextField(
                                    value = baselineSearchFilter,
                                    onValueChange = { baselineSearchFilter = it },
                                    modifier = Modifier.fillMaxWidth(),
                                    placeholder = { Text("Search installed apps...", fontSize = 11.sp, color = Color.Gray) },
                                    singleLine = true,
                                    shape = RoundedCornerShape(12.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White,
                                        focusedContainerColor = Color(0xFF1E293B),
                                        unfocusedContainerColor = Color(0xFF1E293B)
                                    )
                                )

                                val filteredBaselineApps = apps.filter {
                                    baselineSearchFilter.isBlank() ||
                                    it.name.contains(baselineSearchFilter, ignoreCase = true) ||
                                    it.packageName.contains(baselineSearchFilter, ignoreCase = true)
                                }

                                LazyColumn(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .heightIn(max = 130.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    items(filteredBaselineApps, key = { it.packageName }) { app ->
                                        val isChecked = settings.baselineAppIds.contains(app.packageName)
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(if (isChecked) Color(0xFF1E3A5F) else Color(0xFF1E293B).copy(alpha = 0.5f))
                                                .clickable {
                                                    val newBaseline = if (isChecked) {
                                                        settings.baselineAppIds - app.packageName
                                                    } else {
                                                        settings.baselineAppIds + app.packageName
                                                    }
                                                    onUpdateSettings(settings.copy(baselineAppIds = newBaseline))
                                                }
                                                .padding(horizontal = 8.dp, vertical = 4.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(app.name, fontSize = 11.sp, color = Color.White, maxLines = 1)
                                                Text(app.packageName, fontSize = 9.sp, color = Color.Gray, maxLines = 1)
                                            }
                                            Checkbox(
                                                checked = isChecked,
                                                onCheckedChange = { checked ->
                                                    val newBaseline = if (checked) {
                                                        settings.baselineAppIds + app.packageName
                                                    } else {
                                                        settings.baselineAppIds - app.packageName
                                                    }
                                                    onUpdateSettings(settings.copy(baselineAppIds = newBaseline))
                                                },
                                                colors = CheckboxDefaults.colors(
                                                    checkedColor = Color(0xFF38BDF8),
                                                    uncheckedColor = Color.Gray
                                                )
                                            )
                                        }
                                    }
                                }
                            }

                            // 3. Reminder Interval Defaults
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("Reminder Interval Defaults", fontSize = 12.sp, color = Color.White)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    val intervals = listOf(
                                        "15m_before" to "15m Before",
                                        "on_start" to "On Start",
                                        "30m_overdue" to "30m Overdue"
                                    )
                                    intervals.forEach { (id, label) ->
                                        val isSelected = settings.reminderIntervalDefault == id
                                        Button(
                                            onClick = { onUpdateSettings(settings.copy(reminderIntervalDefault = id)) },
                                            modifier = Modifier.weight(1f),
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = if (isSelected) Color(0xFF38BDF8) else Color(0xFF1E293B)
                                            ),
                                            shape = RoundedCornerShape(10.dp),
                                            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp)
                                        ) {
                                            Text(
                                                label,
                                                fontSize = 10.sp,
                                                color = if (isSelected) Color.Black else Color.White
                                            )
                                        }
                                    }
                                }
                            }

                            // 4. Midnight Auto-Purge & Auto-Focus on Task Start Toggles
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Midnight Auto-Purge", fontSize = 11.sp, color = Color.White)
                                        Text("Clear completed tasks at 00:00 midnight", fontSize = 9.sp, color = Color.Gray)
                                    }
                                    Switch(
                                        checked = settings.midnightAutoPurge,
                                        onCheckedChange = { onUpdateSettings(settings.copy(midnightAutoPurge = it)) },
                                        colors = SwitchDefaults.colors(
                                            checkedThumbColor = Color.White,
                                            checkedTrackColor = Color(0xFF38BDF8)
                                        )
                                    )
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Auto-Focus on Task Start", fontSize = 11.sp, color = Color.White)
                                        Text("Lock non-whitelisted apps when scheduled start arrives", fontSize = 9.sp, color = Color.Gray)
                                    }
                                    Switch(
                                        checked = settings.autoFocusOnTaskStart,
                                        onCheckedChange = { onUpdateSettings(settings.copy(autoFocusOnTaskStart = it)) },
                                        colors = SwitchDefaults.colors(
                                            checkedThumbColor = Color.White,
                                            checkedTrackColor = Color(0xFF38BDF8)
                                        )
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AppFolderModal(
    category: String,
    apps: List<AppItem>,
    onLaunch: (AppItem) -> Unit,
    onDismiss: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.65f))
            .clickable { onDismiss() },
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .width(340.dp)
                .wrapContentHeight()
                .clickable(enabled = false) {},
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = category.replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.LightGray)
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                LazyVerticalGrid(
                    columns = GridCells.Fixed(4),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(apps.filter { it.category == category }) { app ->
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.clickable { onLaunch(app) }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(Color(0xFF1E293B), RoundedCornerShape(14.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(app.name.take(1), color = Color.White)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = app.name,
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.LightGray,
                                maxLines = 1
                            )
                        }
                    }
                }
            }
        }
    }
}
`,
  },
  {
    name: 'TutorialOverlay.kt',
    path: 'app/src/main/java/com/orbital/launcher/ui/TutorialOverlay.kt',
    language: 'kotlin',
    description: 'Jetpack Compose interactive onboarding tutorial guiding through Ring 1 bloom, Ring 2 folders, and Layer 3 emergency/search/tasks.',
    code: `package com.orbital.launcher.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.orbital.launcher.viewmodel.LauncherEvent
import com.orbital.launcher.viewmodel.LauncherUiState

@Composable
fun TutorialOverlay(
    uiState: LauncherUiState,
    onEvent: (LauncherEvent) -> Unit
) {
    if (!uiState.isFirstLaunch) return

    val step = uiState.tutorialStep

    val (title, instruction) = when (step) {
        1 -> "Step 1: Bloom Ring 1" to "Touch and drag outward from the fixed center ball to bloom the 6 satellite category spheres. Releasing to center collapses them."
        2 -> "Step 2: App Folders & Ring 2" to "Drag toward 'App Folders' to bloom Ring 2 sub-spheres (Social, Media, Work, Finance, Games). Release on Social to open its centered card."
        3 -> "Step 3: Universal Search" to "Drag to 'Search' to instantly dissolve all rings and trigger the top search bar + software keyboard."
        else -> "Step 4: Emergency & Focus Tasks" to "Emergency mode wraps the screen in red barriers while keeping Calls open. Tasks enforce per-task focus app whitelists."
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(bottom = 32.dp, start = 16.dp, end = 16.dp),
        contentAlignment = Alignment.BottomCenter
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A).copy(alpha = 0.95f))
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(22.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF2563EB)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(text = "$step", color = Color.White, fontSize = 11.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Interactive Tutorial · Step $step of 4",
                            color = Color(0xFF60A5FA),
                            fontSize = 11.sp
                        )
                    }

                    TextButton(
                        onClick = { onEvent(LauncherEvent.CompleteTutorial) },
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Text("Skip", color = Color.Gray, fontSize = 11.sp)
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))
                Text(text = title, style = MaterialTheme.typography.titleMedium, color = Color.White)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = instruction, color = Color.LightGray, fontSize = 12.sp, lineHeight = 16.sp)

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        (1..4).forEach { s ->
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when {
                                            s == step -> Color(0xFF38BDF8)
                                            s < step -> Color(0xFF1E3A8A)
                                            else -> Color.DarkGray
                                        }
                                    )
                            )
                        }
                    }

                    if (step < 4) {
                        Button(
                            onClick = { onEvent(LauncherEvent.AdvanceTutorial) },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                        ) {
                            Text("Next Step", fontSize = 12.sp)
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(14.dp))
                        }
                    } else {
                        Button(
                            onClick = { onEvent(LauncherEvent.CompleteTutorial) },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                        ) {
                            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Enter Live Launcher", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
`,
  },
  {
    name: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Android Manifest declaring HOME launcher intent category and required permissions.',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Orbital"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.OrbitalLauncher">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:clearTaskOnLaunch="true"
            android:stateNotNeeded="true"
            android:windowSoftInputMode="adjustPan">
            
            <!-- Standard Android Launcher Intent Filters -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.HOME" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>

    </application>
</manifest>
`,
  },
  {
    name: 'build.gradle.kts',
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'Modern Gradle build script configured with Jetpack Compose BOM and DataStore.',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace = "com.orbital.launcher"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.orbital.launcher"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.6")
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
`,
  },
  {
    name: 'LauncherModels.kt',
    path: 'app/src/main/java/com/orbital/launcher/data/LauncherModels.kt',
    language: 'kotlin',
    description: 'Kotlin data layer defining GestureMapping, GestureTrigger, GestureAction, TaskItem, and LauncherSettings.',
    code: `package com.orbital.launcher.data

enum class HubType {
    FOLDERS, SEARCH, EMERGENCY, CALLS, TASKS, SETTINGS
}

data class AppItem(
    val id: String,
    val name: String,
    val packageName: String,
    val category: String,
    val isBaseline: Boolean = false,
    val isEmergencyAllowed: Boolean = false
)

data class TaskItem(
    val id: String,
    val title: String,
    val completed: Boolean = false,
    val whitelistedPackageNames: List<String> = emptyList(),
    val startTime: String? = null,
    val endTime: String? = null
)

sealed interface ActiveModal {
    data object None : ActiveModal
    data class AppFolder(val category: String) : ActiveModal
    data object Search : ActiveModal
    data class CallsSplit(val target: String) : ActiveModal
    data object Tasks : ActiveModal
    data object Settings : ActiveModal
    data class EmergencyRestricted(val hubName: String) : ActiveModal
}

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

enum class GestureActionType(val label: String) {
    LAUNCH_DEFAULT_LAUNCHER("Default Phone Launcher"),
    LAUNCH_APP("Launch App"),
    TOGGLE_EMERGENCY("Toggle Emergency Mode"),
    OPEN_SEARCH("Universal Search"),
    OPEN_TASKS("Tasks & Focus Hub"),
    OPEN_SETTINGS("Settings Hub"),
    NONE("Disabled")
}

data class GestureAction(
    val type: GestureActionType,
    val targetPackageName: String? = null,
    val label: String? = null
)

data class GestureMapping(
    val id: String,
    val trigger: GestureTrigger,
    val action: GestureAction
)

data class LauncherSettings(
    val centerBallSize: Float = 56f,
    val ringRadius: Float = 138f,
    val touchDeadzone: Float = 28f,
    val animationStyle: String = "smooth",
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
    val focusStrictness: String = "strict",
    val baselineAppIds: List<String> = listOf("com.google.android.dialer", "com.google.android.contacts", "com.google.android.apps.messaging", "com.google.android.apps.maps", "com.google.android.deskclock"),
    val reminderIntervalDefault: String = "on_start",
    val midnightAutoPurge: Boolean = true,
    val autoFocusOnTaskStart: Boolean = true
)

`,
  },
];
