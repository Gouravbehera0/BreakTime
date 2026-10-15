package com.breaktime.app.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.breaktime.app.domain.activity.ActivityIconType
import com.breaktime.app.domain.activity.BreakActivity
import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.RelationshipType
import com.breaktime.app.ui.components.AmbientBackground
import com.breaktime.app.ui.invitation.components.ActivityLabel
import com.breaktime.app.ui.invitation.components.CircularGlassActivitySelector
import com.breaktime.app.ui.invitation.components.CustomActivityEditorSheet
import com.breaktime.app.ui.invitation.components.RecipientHeader
import com.breaktime.app.ui.invitation.components.SendInvitationButton
import com.breaktime.app.ui.invitation.components.SwipeIndicator
import com.breaktime.app.ui.theme.BreakTimeTheme

/**
 * The Swipe-to-Choose Invitation Dashboard.
 *
 * Implements:
 * - Large circular glassmorphic activity selector as the visual centerpiece.
 * - Horizontal swipe gestures with depth blur and smooth animated transitions.
 * - Consent-respecting activity sequencing based on recipient relationship.
 * - Strict one-tap SEND INVITATION dispatch without notifications during swipe.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvitationScreen(
    viewModel: InvitationViewModel,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.toastMessage) {
        uiState.toastMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearToast()
        }
    }

    InvitationScreenContent(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onNavigateBack = onNavigateBack,
        onIndexChanged = viewModel::onIndexChanged,
        onSendInvitation = viewModel::sendInvitation,
        onOpenCustomEditor = { viewModel.openCustomActivityEditor(uiState.selectedActivity) },
        onDismissCustomEditor = viewModel::dismissCustomActivityEditor,
        onSaveCustomActivity = viewModel::saveCustomActivity,
        onDeleteCustomActivity = viewModel::deleteCustomActivity,
        modifier = modifier
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvitationScreenContent(
    uiState: InvitationUiState,
    snackbarHostState: SnackbarHostState,
    onNavigateBack: () -> Unit,
    onIndexChanged: (Int) -> Unit,
    onSendInvitation: () -> Unit,
    onOpenCustomEditor: () -> Unit,
    onDismissCustomEditor: () -> Unit,
    onSaveCustomActivity: (title: String, subtitle: String, tags: List<String>) -> Unit,
    onDeleteCustomActivity: (id: String) -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()

    AmbientBackground(modifier = modifier) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
                    .navigationBarsPadding()
                    .verticalScroll(scrollState)
                    .padding(bottom = 20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                // 1. TOP HEADER & RECIPIENT CARD
                uiState.contact?.let { contact ->
                    RecipientHeader(
                        contact = contact,
                        currentUserId = uiState.currentUserId,
                        onNavigateBack = onNavigateBack
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // 2. LARGE CIRCULAR GLASS ACTIVITY SELECTOR (Visual Focal Point)
                CircularGlassActivitySelector(
                    activities = uiState.activities,
                    selectedIndex = uiState.selectedIndex,
                    onIndexChanged = onIndexChanged
                )

                Spacer(modifier = Modifier.height(12.dp))

                // 3. CAROUSEL DOT INDICATOR
                SwipeIndicator(
                    totalCount = uiState.activities.size,
                    selectedIndex = uiState.selectedIndex
                )

                Spacer(modifier = Modifier.height(14.dp))

                // 4. ACTIVITY NAME, SUBTITLE & METADATA TAGS
                uiState.selectedActivity?.let { activity ->
                    ActivityLabel(
                        activity = activity,
                        onEditCustomActivity = onOpenCustomEditor,
                        modifier = Modifier.padding(horizontal = 24.dp)
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                // 5. SEND INVITATION BUTTON
                uiState.selectedActivity?.let { activity ->
                    SendInvitationButton(
                        activityTitle = activity.title,
                        isLoading = uiState.isSendingInvitation,
                        isSuccess = uiState.isInvitationSentSuccess,
                        onSendClick = onSendInvitation,
                        modifier = Modifier.padding(horizontal = 24.dp)
                    )
                }
            }

            // Snackbar Host
            SnackbarHost(
                hostState = snackbarHostState,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(bottom = 80.dp)
            )
        }

        // Custom Activity Editor Modal Sheet
        if (uiState.showCustomActivityEditor) {
            CustomActivityEditorSheet(
                existingActivity = uiState.editingActivity,
                onSave = onSaveCustomActivity,
                onDelete = onDeleteCustomActivity,
                onDismiss = onDismissCustomEditor
            )
        }
    }
}

@Preview(name = "Invitation Screen Preview", showBackground = true)
@Composable
private fun InvitationScreenPreview() {
    BreakTimeTheme {
        val sampleContact = Contact(
            id = "1",
            name = "Aisha Sen",
            privateNickname = "My Moon 💜",
            isOnline = true,
            statusText = "Usually active",
            relationship = RelationshipType.LOVER
        )
        val sampleActivities = listOf(
            BreakActivity(
                id = "act_chai",
                title = "EVENING CHAI",
                subtitle = "Warm cups and slow talks.",
                iconType = ActivityIconType.EVENING_CHAI,
                emoji = "☕"
            ),
            BreakActivity(
                id = "act_night_ride",
                title = "NIGHT RIDE",
                subtitle = "Let's escape the routine.",
                iconType = ActivityIconType.NIGHT_RIDE,
                emoji = "🏍️"
            ),
            BreakActivity(
                id = "act_shopping",
                title = "SHOPPING",
                subtitle = "Retail therapy and good company.",
                iconType = ActivityIconType.SHOPPING,
                emoji = "🛍️"
            )
        )

        InvitationScreenContent(
            uiState = InvitationUiState(
                contact = sampleContact,
                activities = sampleActivities,
                selectedIndex = 1,
                isLoading = false
            ),
            snackbarHostState = remember { SnackbarHostState() },
            onNavigateBack = {},
            onIndexChanged = {},
            onSendInvitation = {},
            onOpenCustomEditor = {},
            onDismissCustomEditor = {},
            onSaveCustomActivity = { _, _, _ -> },
            onDeleteCustomActivity = {}
        )
    }
}
