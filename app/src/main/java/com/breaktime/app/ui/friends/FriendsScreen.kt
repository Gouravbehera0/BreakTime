package com.breaktime.app.ui.friends

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Contacts
import androidx.compose.material.icons.rounded.People
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.friends.components.ContactDiscoveryCard
import com.breaktime.app.ui.friends.components.FriendCard
import com.breaktime.app.ui.friends.components.InviteShareHelper
import com.breaktime.app.ui.friends.components.PendingRequestCard
import com.breaktime.app.ui.friends.components.PrePermissionDialog

@Composable
fun FriendsScreen(
    viewModel: FriendsViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToInvitation: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }
    var showPrePermissionDialog by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        viewModel.onPermissionResult(isGranted)
    }

    // Show notifications from ViewModel
    LaunchedEffect(uiState.errorMessage, uiState.successMessage) {
        uiState.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessages()
        }
        uiState.successMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessages()
        }
    }

    if (showPrePermissionDialog) {
        PrePermissionDialog(
            onDismiss = { showPrePermissionDialog = false },
            onConfirm = {
                showPrePermissionDialog = false
                permissionLauncher.launch(Manifest.permission.READ_CONTACTS)
            }
        )
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = Color(0xFF17171C),
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // 1. TOP HEADER
            FriendsTopHeader(
                onNavigateBack = onNavigateBack,
                onRefresh = viewModel::refresh,
                isRefreshing = uiState.isRefreshing
            )

            Spacer(modifier = Modifier.height(16.dp))

            // 2. LOCAL SEARCH FILTER (Filters only confirmed friends)
            if (uiState.confirmedFriends.isNotEmpty()) {
                FriendsSearchBar(
                    query = uiState.searchQuery,
                    onQueryChange = viewModel::onSearchQueryChanged
                )
                Spacer(modifier = Modifier.height(16.dp))
            }

            // 3. MAIN SCROLLABLE CONTENT
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                contentPadding = PaddingValues(bottom = 32.dp)
            ) {
                // ================= SECTION 1: YOUR FRIENDS =================
                item {
                    SectionHeader(
                        title = "Your Friends",
                        count = uiState.filteredFriends.size
                    )
                }

                if (uiState.filteredFriends.isNotEmpty()) {
                    items(
                        items = uiState.filteredFriends,
                        key = { "friend_${it.id}" }
                    ) { friend ->
                        FriendCard(
                            friend = friend,
                            onInviteToBreak = onNavigateToInvitation
                        )
                    }
                } else if (uiState.searchQuery.isNotBlank()) {
                    item {
                        EmptyStateMessage(message = "No friends match '${uiState.searchQuery}'")
                    }
                } else {
                    item {
                        EmptyFriendsCard()
                    }
                }

                // ================= SECTION 2: PENDING REQUESTS =================
                if (uiState.pendingRequests.isNotEmpty()) {
                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        SectionHeader(
                            title = "Pending Requests",
                            count = uiState.pendingRequests.size
                        )
                    }

                    items(
                        items = uiState.pendingRequests,
                        key = { "request_${it.id}" }
                    ) { request ->
                        PendingRequestCard(
                            request = request,
                            onAccept = { viewModel.acceptFriendRequest(request) },
                            onDecline = { viewModel.declineFriendRequest(request) },
                            onCancel = { viewModel.cancelFriendRequest(request) }
                        )
                    }
                }

                // ================= SECTION 3: FIND FRIENDS FROM CONTACTS =================
                item {
                    Spacer(modifier = Modifier.height(12.dp))
                    SectionHeader(
                        title = "Find Friends from Contacts",
                        count = null
                    )
                }

                when (uiState.permissionState) {
                    ContactPermissionState.NOT_REQUESTED -> {
                        item {
                            PermissionPromptCard(
                                title = "Sync Contacts to Find Friends",
                                description = "See which of your phone contacts are already on BreakTime. We never share your contact list.",
                                buttonText = "Find Contacts",
                                onClick = { showPrePermissionDialog = true }
                            )
                        }
                    }

                    ContactPermissionState.DENIED -> {
                        item {
                            PermissionPromptCard(
                                title = "Contacts Permission Needed",
                                description = "BreakTime only connects you with real friends from your contacts. Please allow contacts access.",
                                buttonText = "Allow Contacts",
                                onClick = { permissionLauncher.launch(Manifest.permission.READ_CONTACTS) }
                            )
                        }
                    }

                    ContactPermissionState.PERMANENTLY_DENIED -> {
                        item {
                            PermissionPromptCard(
                                title = "Permission Required in Settings",
                                description = "Contacts access was denied. Please enable Contacts in Android Settings to find friends.",
                                buttonText = "Open Settings",
                                onClick = {
                                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                                        data = Uri.fromParts("package", context.packageName, null)
                                    }
                                    context.startActivity(intent)
                                }
                            )
                        }
                    }

                    ContactPermissionState.GRANTED -> {
                        if (uiState.isMatchingContacts) {
                            item {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(Color(0xFF202027))
                                        .padding(24.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        CircularProgressIndicator(
                                            color = Color(0xFFB45CFF),
                                            modifier = Modifier.size(28.dp),
                                            strokeWidth = 3.dp
                                        )
                                        Spacer(modifier = Modifier.height(12.dp))
                                        Text(
                                            text = "Matching contacts with BreakTime...",
                                            fontSize = 13.sp,
                                            color = Color(0xFFA5A0B5)
                                        )
                                    }
                                }
                            }
                        } else {
                            // Sub-section: On BreakTime
                            val onBreakTime = uiState.breakTimeUsers
                            if (onBreakTime.isNotEmpty()) {
                                item {
                                    Text(
                                        text = "On BreakTime",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFF86EFAC),
                                        modifier = Modifier.padding(start = 4.dp, top = 4.dp)
                                    )
                                }

                                items(
                                    items = onBreakTime,
                                    key = { "discovered_${it.id}" }
                                ) { discovered ->
                                    ContactDiscoveryCard(
                                        discovered = discovered,
                                        onAddFriend = viewModel::sendFriendRequest,
                                        onInvite = { contact ->
                                            InviteShareHelper.shareInvite(context, contact.displayName)
                                        }
                                    )
                                }
                            }

                            // Sub-section: Inviteable Contacts
                            val inviteable = uiState.inviteableContacts
                            if (inviteable.isNotEmpty()) {
                                item {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "Invite to BreakTime",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFFA5A0B5),
                                        modifier = Modifier.padding(start = 4.dp, top = 4.dp)
                                    )
                                }

                                items(
                                    items = inviteable.take(25), // Show top contacts for smooth scrolling
                                    key = { "invite_${it.contact.id}" }
                                ) { discovered ->
                                    ContactDiscoveryCard(
                                        discovered = discovered,
                                        onAddFriend = {},
                                        onInvite = { contact ->
                                            InviteShareHelper.shareInvite(context, contact.displayName)
                                        }
                                    )
                                }
                            } else if (onBreakTime.isEmpty()) {
                                item {
                                    EmptyStateMessage(message = "No contacts found on device.")
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
private fun FriendsTopHeader(
    onNavigateBack: () -> Unit,
    onRefresh: () -> Unit,
    isRefreshing: Boolean
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(
            onClick = onNavigateBack,
            modifier = Modifier
                .size(42.dp)
                .clip(CircleShape)
                .background(Color(0xFF202027))
                .border(1.dp, Color(0x14FFFFFF), CircleShape)
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                contentDescription = "Back",
                tint = Color(0xFFF5F3FA)
            )
        }

        Spacer(modifier = Modifier.width(14.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "Your People",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFF5F3FA)
            )
            Text(
                text = "Your friends, one tap away.",
                fontSize = 12.sp,
                color = Color(0xFFA5A0B5)
            )
        }

        IconButton(
            onClick = onRefresh,
            enabled = !isRefreshing,
            modifier = Modifier
                .size(42.dp)
                .clip(CircleShape)
                .background(Color(0xFF202027))
                .border(1.dp, Color(0x14FFFFFF), CircleShape)
        ) {
            if (isRefreshing) {
                CircularProgressIndicator(
                    color = Color(0xFFB45CFF),
                    modifier = Modifier.size(18.dp),
                    strokeWidth = 2.dp
                )
            } else {
                Icon(
                    imageVector = Icons.Rounded.Refresh,
                    contentDescription = "Refresh",
                    tint = Color(0xFFB45CFF)
                )
            }
        }
    }
}

@Composable
private fun FriendsSearchBar(
    query: String,
    onQueryChange: (String) -> Unit
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        placeholder = {
            Text("Filter your friends...", color = Color(0xFFA5A0B5), fontSize = 13.sp)
        },
        leadingIcon = {
            Icon(
                imageVector = Icons.Rounded.Search,
                contentDescription = null,
                tint = Color(0xFFA5A0B5),
                modifier = Modifier.size(18.dp)
            )
        },
        trailingIcon = {
            if (query.isNotEmpty()) {
                IconButton(onClick = { onQueryChange("") }) {
                    Icon(
                        imageVector = Icons.Rounded.Close,
                        contentDescription = "Clear",
                        tint = Color(0xFFA5A0B5),
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        },
        singleLine = true,
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = Color(0xFF202027),
            unfocusedContainerColor = Color(0xFF202027),
            focusedBorderColor = Color(0x33B45CFF),
            unfocusedBorderColor = Color(0x14FFFFFF),
            focusedTextColor = Color(0xFFF5F3FA),
            unfocusedTextColor = Color(0xFFF5F3FA)
        ),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier
            .fillMaxWidth()
            .height(50.dp)
    )
}

@Composable
private fun SectionHeader(
    title: String,
    count: Int?
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = title,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFF5F3FA)
        )

        if (count != null) {
            Spacer(modifier = Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color(0x24B45CFF))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(
                    text = count.toString(),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFB45CFF)
                )
            }
        }
    }
}

@Composable
private fun EmptyFriendsCard() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF202027))
            .border(1.dp, Color(0x14FFFFFF), RoundedCornerShape(16.dp))
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = Icons.Rounded.People,
                contentDescription = null,
                tint = Color(0x40B45CFF),
                modifier = Modifier.size(40.dp)
            )
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = "No BreakTime friends yet",
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFFF5F3FA)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Find friends from your contacts below to start taking breaks together!",
                fontSize = 12.sp,
                color = Color(0xFFA5A0B5),
                textAlign = TextAlign.Center,
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
private fun PermissionPromptCard(
    title: String,
    description: String,
    buttonText: String,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFF202027))
            .border(
                1.dp,
                Brush.verticalGradient(listOf(Color(0x33B45CFF), Color(0x14FFFFFF))),
                RoundedCornerShape(18.dp)
            )
            .padding(18.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(
                imageVector = Icons.Rounded.Contacts,
                contentDescription = null,
                tint = Color(0xFFB45CFF),
                modifier = Modifier.size(36.dp)
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFF5F3FA),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = description,
                fontSize = 12.sp,
                color = Color(0xFFA5A0B5),
                textAlign = TextAlign.Center,
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.height(14.dp))

            Button(
                onClick = onClick,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        Brush.horizontalGradient(
                            listOf(Color(0xFFB45CFF), Color(0xFF8B5CF6))
                        )
                    )
                    .height(40.dp)
            ) {
                Text(
                    text = buttonText,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
            }
        }
    }
}

@Composable
private fun EmptyStateMessage(message: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = message,
            fontSize = 12.sp,
            color = Color(0xFFA5A0B5),
            textAlign = TextAlign.Center
        )
    }
}
