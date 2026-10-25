package com.orbital.launcher.ui

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
 * Ring 1 (6 category satellite hubs), Ring 2 sub-spheres (Folders & Calls),
 * and dynamic connecting spring laser filaments with low-bouncy spring physics.
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

    // Live spring specification mapped from settings.animationStyle
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
                        // 1. Restrict drag detection: ONLY activates when initial touch starts within center ball hit boundary!
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
            // Compute ring distances dynamically using the container's minimum dimension
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

            // 1. Fixed Dead Center Anchor Ball: Clean, solid, smooth sphere (NO inner black dot / center circle draw call)
            drawCircle(
                color = if (uiState.isEmergencyActive) Color(0xFFEF4444) else Color.White,
                radius = centerRadius,
                center = centerOffset
            )

            // RING 1: 6 Satellite category hubs with dynamic aspect-ratio-adapted spring blooming
            if (bloomProgress.value > 0.05f) {
                // Orbital dashed guide ring for Ring 1
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

                    // Laser connective filament line from center to satellite
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

                    // Satellite Node Circle with coordinate clamping
                    drawCircle(
                        color = hubColor,
                        radius = satRadius * bloomProgress.value,
                        center = satelliteCenter
                    )

                    // 2. Layer 2 & Ring 3 Sub-Spheres (Folders: Social, Media, Work, Finance, Games)
                    // Refactored hit-testing & bloom: generous >= 56dp hit radius, clamped coords
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

                            // Connective filament from Ring 1 satellite to Ring 2 sub-sphere
                            drawLine(
                                color = Color(0xFF38BDF8).copy(alpha = 0.65f),
                                start = satelliteCenter,
                                end = subCenter,
                                strokeWidth = if (isSubHovered) 2.5f else 1.6f
                            )

                            // Generous touch target area (>= 56dp hit radius tolerance)
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

                    // Ring 2 Sub-Spheres (Calls): 2-node split (Contacts & Phone)
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
