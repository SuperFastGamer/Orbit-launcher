package com.orbital.launcher.ui

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

/**
 * TutorialOverlay: Interactive step-by-step hands-on tutorial rendered directly on the canvas.
 * Step 1: Touch and drag outward from center to bloom Ring 1.
 * Step 2: Hover toward Folders to expand Ring 2 sub-spheres and release on a category.
 * Step 3: Drag to Search for instant top search bar and software keyboard.
 * Step 4: Emergency lockdown demonstration and Task focus lock.
 */
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
                // Header with step badge
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

                // Step Indicators & Actions
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
