package com.orbital.launcher

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
