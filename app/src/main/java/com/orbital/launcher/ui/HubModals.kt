package com.orbital.launcher.ui

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

/**
 * Hub 2: Top Search Bar Modal with auto-keyboard request and LazyColumn live filtering.
 */
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
                                        text = "${app.category.uppercase()} · ${app.packageName}",
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

/**
 * Hub 5: Tasks & Focus Lock Modal: Task creation, full editing, optional start/end scheduling,
 * and unrestricted searchable app whitelist with live quantity counter.
 */
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
                // Header
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
                    // Quick add trigger
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

                    // Task items list with Edit button
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
                                                text = "${task.startTime ?: "Any"}–${task.endTime ?: "Open"}",
                                                fontSize = 10.sp,
                                                color = Color(0xFFFBBF24)
                                            )
                                        }
                                        Text(
                                            text = "Whitelisted: ${task.whitelistedPackageNames.size} apps",
                                            fontSize = 10.sp,
                                            color = Color(0xFF34D399)
                                        )
                                    }
                                }
                                // Edit button
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
                                // Delete button
                                IconButton(onClick = { onDeleteTask(task.id) }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.Gray, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                } else {
                    // Task Creation & Editing Form
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

                        // Optional Start & End Times
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

                        // Live Whitelist Counter
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Unrestricted App Whitelist", fontSize = 11.sp, color = Color.LightGray)
                            Text("Whitelisted: ${selectedWhitelist.size} apps", fontSize = 11.sp, color = Color(0xFF34D399))
                        }

                        // Searchable Multi-Select Checklist (All installed apps)
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

                // Midnight Reset
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

/**
 * Hub 6: Settings Modal with dedicated "Gestures & Sensitivity" tab and live canvas updates.
 */
/**
 * Hub 6: Settings Modal with dedicated "Gesture Shortcuts", "Gestures & Sensitivity", and live canvas updates.
 */
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

    // Gesture editing state
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
                // Header
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

                // Tab Row including "Gesture Shortcuts"
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

                            // Trigger mappings list
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
                                                        "Launch: ${targetApp?.name ?: action.label ?: action.targetPackageName ?: "App"}"
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
                                            "Map Action for ${editingTrigger?.displayName}",
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
                                                        GestureActionType.LAUNCH_APP -> "Launch ${app?.name ?: "App"}"
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
                                                            id = "g-${trigger.name.lowercase()}",
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
                            Text("Drag Expansion Radius: ${settings.ringRadius.toInt()}dp", fontSize = 12.sp, color = Color.LightGray)
                            Slider(
                                value = settings.ringRadius,
                                onValueChange = { onUpdateSettings(settings.copy(ringRadius = it)) },
                                valueRange = 90f..200f
                            )

                            Text("Touch Deadzone & Sensitivity: ${settings.touchDeadzone.toInt()}dp", fontSize = 12.sp, color = Color.LightGray)
                            Slider(
                                value = settings.touchDeadzone,
                                onValueChange = { onUpdateSettings(settings.copy(touchDeadzone = it)) },
                                valueRange = 15f..48f
                            )

                            Text("Animation Spring Style: ${settings.animationStyle.replaceFirstChar { it.uppercase() }}", fontSize = 12.sp, color = Color.LightGray)
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
                            Text("Center Anchor Diameter: ${settings.centerBallSize.toInt()}px", fontSize = 12.sp, color = Color.LightGray)
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

                                            // Category Pill / Switcher Button
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

                                        // Category Picker Chips (One tap to move)
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
                                        "Whitelisted: ${settings.baselineAppIds.size} apps",
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

/**
 * Hub 1: App Folder modal card
 */
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
