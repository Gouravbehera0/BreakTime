package com.breaktime.app.ui.invitation

import com.breaktime.app.domain.activity.BreakActivity
import com.breaktime.app.domain.contact.Contact

/**
 * State representing the Swipe-to-Choose Invitation Dashboard.
 */
data class InvitationUiState(
    val contact: Contact? = null,
    val activities: List<BreakActivity> = emptyList(),
    val selectedIndex: Int = 0,
    val isLoading: Boolean = true,
    val isSendingInvitation: Boolean = false,
    val isInvitationSentSuccess: Boolean = false,
    val toastMessage: String? = null,
    val showCustomActivityEditor: Boolean = false,
    val editingActivity: BreakActivity? = null,
    val currentUserId: String = "current_user"
) {
    val selectedActivity: BreakActivity?
        get() = activities.getOrNull(selectedIndex)
}
