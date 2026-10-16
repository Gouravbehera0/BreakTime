package com.breaktime.app.ui.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.GroupOff
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.SearchOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.ContactFilter
import com.breaktime.app.domain.contact.RelationshipType
import com.breaktime.app.ui.components.AmbientBackground
import com.breaktime.app.ui.components.NeomorphicCard
import com.breaktime.app.ui.components.PrimaryGradientButton
import com.breaktime.app.ui.home.components.BreakTimeHeader
import com.breaktime.app.ui.home.components.ContactCard
import com.breaktime.app.ui.home.components.ContactDetailsBottomSheet
import com.breaktime.app.ui.home.components.ContactSearchAndFilterBar
import com.breaktime.app.ui.home.components.DashboardTab
import com.breaktime.app.ui.home.components.FloatingGlassNavigationBar
import com.breaktime.app.ui.home.components.YourPeopleHeader
import com.breaktime.app.ui.theme.BreakTimeTheme
import com.breaktime.app.ui.theme.DarkShadow
import com.breaktime.app.ui.theme.ErrorColor
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryText

/**
 * The authenticated BreakTime Home Dashboard screen.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onSignOut: () -> Unit,
    onNavigateToInvitation: ((String) -> Unit)? = null,
    onNavigateToFriends: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.toastMessage) {
        uiState.toastMessage?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.clearToast()
        }
    }

    HomeScreenContent(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onSearchQueryChange = viewModel::onSearchQueryChanged,
        onFilterSelected = viewModel::onFilterSelected,
        onTogglePin = viewModel::onTogglePin,
        onInviteContact = viewModel::sendInstantInvite,
        onContactClicked = viewModel::onContactClicked,
        onDismissContactDetails = viewModel::onDismissContactDetails,
        onNavigateToInvitation = onNavigateToInvitation,
        onTabSelected = { tab ->
            if (tab == DashboardTab.CIRCLES && onNavigateToFriends != null) {
                onNavigateToFriends()
            } else {
                viewModel.onNavTabSelected(tab)
            }
        },
        onNotificationClick = viewModel::onNotificationClicked,
        onProfileClick = viewModel::onProfileClicked,
        onAddPeopleClick = {
            if (onNavigateToFriends != null) {
                onNavigateToFriends()
            } else {
                viewModel.onAddPeopleClicked()
            }
        },
        onDismissSignOutDialog = viewModel::onDismissSignOutDialog,
        onConfirmSignOut = onSignOut,
        onRetryLoad = viewModel::loadContacts,
        modifier = modifier
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreenContent(
    uiState: HomeUiState,
    snackbarHostState: SnackbarHostState,
    onSearchQueryChange: (String) -> Unit,
    onFilterSelected: (ContactFilter) -> Unit,
    onTogglePin: (String) -> Unit,
    onInviteContact: (String) -> Unit,
    onContactClicked: (Contact) -> Unit,
    onDismissContactDetails: () -> Unit,
    onNavigateToInvitation: ((String) -> Unit)? = null,
    onTabSelected: (com.breaktime.app.ui.home.components.DashboardTab) -> Unit,
    onNotificationClick: () -> Unit,
    onProfileClick: () -> Unit,
    onAddPeopleClick: () -> Unit,
    onDismissSignOutDialog: () -> Unit,
    onConfirmSignOut: () -> Unit,
    onRetryLoad: () -> Unit,
    modifier: Modifier = Modifier
) {
    AmbientBackground(modifier = modifier) {
        Box(
            modifier = Modifier.fillMaxSize()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
            ) {
                // 1. Top Brand Header
                BreakTimeHeader(
                    onNotificationClick = onNotificationClick,
                    onProfileClick = onProfileClick,
                    hasUnreadNotifications = uiState.hasUnreadNotifications,
                    userName = uiState.userName
                )

                Spacer(modifier = Modifier.height(6.dp))

                // 2. Search & Filter Bar
                ContactSearchAndFilterBar(
                    searchQuery = uiState.searchQuery,
                    onSearchQueryChange = onSearchQueryChange,
                    selectedFilter = uiState.selectedFilter,
                    onFilterSelected = onFilterSelected,
                    allCount = uiState.allCount,
                    onlineCount = uiState.onlineCount,
                    offlineCount = uiState.offlineCount,
                    pinnedCount = uiState.pinnedCount,
                    onFilterSettingsClick = onAddPeopleClick
                )

                Spacer(modifier = Modifier.height(14.dp))

                // 3. "YOUR PEOPLE" Section Header
                YourPeopleHeader(
                    onAddPeopleClick = onAddPeopleClick
                )

                Spacer(modifier = Modifier.height(8.dp))

                // 4. Contact Cards List / Loading / Empty / Error States
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                ) {
                    when {
                        // A. Loading State
                        uiState.isLoading && uiState.allContacts.isEmpty() -> {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    CircularProgressIndicator(
                                        color = PrimaryAccent,
                                        modifier = Modifier.size(36.dp),
                                        strokeWidth = 3.dp
                                    )
                                    Spacer(modifier = Modifier.height(14.dp))
                                    Text(
                                        text = "Connecting to your circle...",
                                        color = SecondaryText,
                                        fontSize = 13.sp
                                    )
                                }
                            }
                        }

                        // B. Error State
                        uiState.errorMessage != null && uiState.allContacts.isEmpty() -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                NeomorphicCard(
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        modifier = Modifier.padding(24.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Text(
                                            text = "Unable to load your people",
                                            color = ErrorColor,
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            text = uiState.errorMessage,
                                            color = SecondaryText,
                                            fontSize = 13.sp,
                                            textAlign = TextAlign.Center
                                        )
                                        Spacer(modifier = Modifier.height(18.dp))
                                        PrimaryGradientButton(
                                            text = "Retry",
                                            showArrow = false,
                                            onClick = onRetryLoad
                                        )
                                    }
                                }
                            }
                        }

                        // C. Empty Search / Filter State
                        uiState.displayedContacts.isEmpty() -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(horizontal = 32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(
                                        imageVector = if (uiState.searchQuery.isNotEmpty()) Icons.Outlined.SearchOff else Icons.Outlined.GroupOff,
                                        contentDescription = null,
                                        tint = SecondaryText.copy(alpha = 0.6f),
                                        modifier = Modifier.size(48.dp)
                                    )
                                    Spacer(modifier = Modifier.height(14.dp))
                                    Text(
                                        text = if (uiState.searchQuery.isNotEmpty()) {
                                            "No people matching \"${uiState.searchQuery}\""
                                        } else {
                                            "No ${uiState.selectedFilter.displayName.lowercase()} contacts right now"
                                        },
                                        color = PrimaryText,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        textAlign = TextAlign.Center
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "Try adjusting your search or filter tags above.",
                                        color = SecondaryText,
                                        fontSize = 13.sp,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }

                        // D. Contact List
                        else -> {
                            LazyColumn(
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(
                                    start = 20.dp,
                                    end = 20.dp,
                                    top = 4.dp,
                                    // Generous bottom padding so floating bottom bar never obscures cards
                                    bottom = 100.dp
                                ),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                items(
                                    items = uiState.displayedContacts,
                                    key = { it.id }
                                ) { contact ->
                                    ContactCard(
                                        contact = contact,
                                        currentUserId = uiState.currentUserId,
                                        isInviting = contact.id in uiState.invitingContactIds,
                                        isInvited = contact.id in uiState.invitedContactIds,
                                        onInvite = { onInviteContact(contact.id) },
                                        onTogglePin = { onTogglePin(contact.id) },
                                        onCardClick = {
                                            if (onNavigateToInvitation != null) {
                                                onNavigateToInvitation(contact.id)
                                            } else {
                                                onContactClicked(contact)
                                            }
                                        },
                                        onMoreOptionsClick = { onContactClicked(contact) }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 5. Floating Glass Bottom Navigation Bar
            FloatingGlassNavigationBar(
                currentTab = uiState.activeTab,
                onTabSelected = onTabSelected,
                modifier = Modifier.align(Alignment.BottomCenter)
            )

            // 6. Snackbar Host for feedback
            SnackbarHost(
                hostState = snackbarHostState,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(bottom = 85.dp)
            )
        }

        // 7. Contact Details Bottom Sheet
        if (uiState.selectedContactForDetails != null) {
            ContactDetailsBottomSheet(
                contact = uiState.selectedContactForDetails,
                currentUserId = uiState.currentUserId,
                isInviting = uiState.selectedContactForDetails.id in uiState.invitingContactIds,
                isInvited = uiState.selectedContactForDetails.id in uiState.invitedContactIds,
                onInvite = { onInviteContact(uiState.selectedContactForDetails.id) },
                onTogglePin = { onTogglePin(uiState.selectedContactForDetails.id) },
                onDismiss = onDismissContactDetails,
                onChooseActivityInvite = onNavigateToInvitation?.let { nav ->
                    { nav(uiState.selectedContactForDetails.id) }
                }
            )
        }

        // 8. Sign Out Confirmation Dialog
        if (uiState.showSignOutDialog) {
            AlertDialog(
                onDismissRequest = onDismissSignOutDialog,
                title = {
                    Text(
                        text = "Sign Out",
                        color = PrimaryText,
                        fontWeight = FontWeight.Bold
                    )
                },
                text = {
                    Text(
                        text = "Are you sure you want to pause your session and sign out of BreakTime?",
                        color = SecondaryText,
                        fontSize = 14.sp
                    )
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            onDismissSignOutDialog()
                            onConfirmSignOut()
                        }
                    ) {
                        Text(
                            text = "Sign Out",
                            color = PrimaryAccent,
                            fontWeight = FontWeight.Bold
                        )
                    }
                },
                dismissButton = {
                    TextButton(onClick = onDismissSignOutDialog) {
                        Text(
                            text = "Cancel",
                            color = SecondaryText
                        )
                    }
                },
                containerColor = RaisedCardSurface
            )
        }
    }
}

@Preview(name = "Home Screen Content Preview", showBackground = true)
@Composable
private fun HomeScreenContentPreview() {
    BreakTimeTheme {
        val sampleContacts = listOf(
            Contact(
                id = "1",
                name = "Aisha Sen",
                privateNickname = "My Moon 💜",
                isOnline = true,
                statusText = "Active now",
                relationship = RelationshipType.LOVER,
                isPinned = true
            ),
            Contact(
                id = "2",
                name = "Rahul Sharma 😎",
                isOnline = true,
                statusText = "Active 5m ago",
                relationship = RelationshipType.BESTFRIENDS,
                isPinned = true
            ),
            Contact(
                id = "3",
                name = "Aryan Verma 🏍️",
                isOnline = true,
                statusText = "Active 12m ago",
                relationship = RelationshipType.FRIENDS,
                isPinned = false
            ),
            Contact(
                id = "4",
                name = "Rohan Malhotra 🐺",
                isOnline = false,
                statusText = "Last seen 2h ago",
                relationship = RelationshipType.BHAI,
                isPinned = true
            )
        )

        val state = HomeUiState(
            allContacts = sampleContacts,
            displayedContacts = sampleContacts,
            allCount = 12,
            onlineCount = 5,
            offlineCount = 7,
            pinnedCount = 3,
            isLoading = false
        )

        HomeScreenContent(
            uiState = state,
            snackbarHostState = remember { SnackbarHostState() },
            onSearchQueryChange = {},
            onFilterSelected = {},
            onTogglePin = {},
            onInviteContact = {},
            onContactClicked = {},
            onDismissContactDetails = {},
            onTabSelected = {},
            onNotificationClick = {},
            onProfileClick = {},
            onAddPeopleClick = {},
            onDismissSignOutDialog = {},
            onConfirmSignOut = {},
            onRetryLoad = {}
        )
    }
}
