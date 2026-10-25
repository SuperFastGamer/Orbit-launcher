package com.orbital.launcher.ui

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

/**
 * OrbitalLauncherScreen: Top-level launcher container orchestrating
 * edge-to-edge canvas physics, tutorial onboarding, and Layer 3 modal overlays.
 */
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
