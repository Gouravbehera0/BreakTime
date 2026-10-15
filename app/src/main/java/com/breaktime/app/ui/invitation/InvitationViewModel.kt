package com.breaktime.app.ui.invitation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breaktime.app.data.activity.ActivityRepository
import com.breaktime.app.data.auth.AuthRepository
import com.breaktime.app.data.contact.ContactRepository
import com.breaktime.app.data.contact.InvitationRepository
import com.breaktime.app.domain.activity.ActivityIconType
import com.breaktime.app.domain.activity.BreakActivity
import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.InvitationResult
import com.breaktime.app.domain.contact.RelationshipType
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * ViewModel governing the Swipe-to-Choose Invitation Dashboard.
 */
class InvitationViewModel(
    private val contactId: String,
    private val contactRepository: ContactRepository,
    private val invitationRepository: InvitationRepository,
    private val activityRepository: ActivityRepository,
    private val authRepository: AuthRepository,
    initialUserId: String? = null
) : ViewModel() {

    private val currentUserId: String = initialUserId
        ?: authRepository.getCurrentUser()?.id
        ?: "current_user"

    private val _uiState = MutableStateFlow(
        InvitationUiState(currentUserId = currentUserId)
    )
    val uiState: StateFlow<InvitationUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        _uiState.update { it.copy(isLoading = true) }

        viewModelScope.launch {
            val contact = contactRepository.getContactById(currentUserId, contactId)
                ?: Contact(
                    id = contactId,
                    name = "Friend",
                    isOnline = false,
                    statusText = "Offline",
                    relationship = RelationshipType.FRIENDS
                )

            activityRepository.getActivitiesForContact(contact).collect { activities ->
                // Default to NIGHT_RIDE index if present, matching the design reference
                val initialIndex = activities.indexOfFirst { it.iconType == ActivityIconType.NIGHT_RIDE }
                    .takeIf { it >= 0 } ?: 0

                _uiState.update { current ->
                    current.copy(
                        contact = contact,
                        activities = activities,
                        selectedIndex = if (current.activities.isEmpty()) initialIndex else current.selectedIndex.coerceIn(0, (activities.size - 1).coerceAtLeast(0)),
                        isLoading = false
                    )
                }
            }
        }
    }

    /**
     * Swiping or selecting an activity updates the carousel index only.
     * It strictly NEVER triggers any notification dispatch.
     */
    fun onIndexChanged(newIndex: Int) {
        val count = _uiState.value.activities.size
        if (count == 0) return
        val normalized = (newIndex % count + count) % count
        _uiState.update { it.copy(selectedIndex = normalized) }
    }

    /**
     * Dispatches an invitation ONLY for the currently selected activity.
     */
    fun sendInvitation() {
        val state = _uiState.value
        val contact = state.contact ?: return
        val activity = state.selectedActivity ?: return

        // Prevent duplicate submissions
        if (state.isSendingInvitation || state.isInvitationSentSuccess) {
            return
        }

        _uiState.update { it.copy(isSendingInvitation = true, toastMessage = null) }

        viewModelScope.launch {
            val result = invitationRepository.sendActivityInvitation(
                contactId = contact.id,
                senderUserId = currentUserId,
                activityId = activity.id,
                activityTitle = activity.title
            )

            when (result) {
                is InvitationResult.Success -> {
                    val recipientName = contact.getVisibleName(currentUserId)
                    _uiState.update {
                        it.copy(
                            isSendingInvitation = false,
                            isInvitationSentSuccess = true,
                            toastMessage = "⚡ Invitation for ${activity.title} sent to $recipientName!"
                        )
                    }
                }
                is InvitationResult.Failure -> {
                    _uiState.update {
                        it.copy(
                            isSendingInvitation = false,
                            toastMessage = result.errorMessage
                        )
                    }
                }
            }
        }
    }

    fun openCustomActivityEditor(activity: BreakActivity? = null) {
        _uiState.update {
            it.copy(
                showCustomActivityEditor = true,
                editingActivity = activity
            )
        }
    }

    fun dismissCustomActivityEditor() {
        _uiState.update {
            it.copy(
                showCustomActivityEditor = false,
                editingActivity = null
            )
        }
    }

    fun saveCustomActivity(title: String, subtitle: String, tags: List<String>) {
        val editing = _uiState.value.editingActivity

        viewModelScope.launch {
            if (editing != null && editing.isCustom && !editing.id.startsWith("act_custom_default")) {
                activityRepository.updateCustomActivity(editing.id, title, subtitle, tags)
                _uiState.update {
                    it.copy(
                        showCustomActivityEditor = false,
                        editingActivity = null,
                        toastMessage = "Activity updated."
                    )
                }
            } else {
                val created = activityRepository.addCustomActivity(title, subtitle, tags)
                _uiState.update {
                    it.copy(
                        showCustomActivityEditor = false,
                        editingActivity = null,
                        toastMessage = "Custom activity added to your options!"
                    )
                }
            }
        }
    }

    fun deleteCustomActivity(id: String) {
        viewModelScope.launch {
            activityRepository.deleteCustomActivity(id)
            _uiState.update {
                it.copy(
                    showCustomActivityEditor = false,
                    editingActivity = null,
                    toastMessage = "Custom activity removed."
                )
            }
        }
    }

    fun clearToast() {
        _uiState.update { it.copy(toastMessage = null) }
    }
}
