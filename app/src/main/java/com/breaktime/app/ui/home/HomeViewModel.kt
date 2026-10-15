package com.breaktime.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breaktime.app.data.auth.AuthRepository
import com.breaktime.app.data.contact.ContactRepository
import com.breaktime.app.data.contact.InvitationRepository
import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.ContactFilter
import com.breaktime.app.domain.contact.ContactSorting
import com.breaktime.app.domain.contact.InvitationResult
import com.breaktime.app.ui.home.components.DashboardTab
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * ViewModel managing UI state for the BreakTime Home Dashboard.
 */
class HomeViewModel(
    private val contactRepository: ContactRepository,
    private val invitationRepository: InvitationRepository,
    private val authRepository: AuthRepository,
    initialUserId: String? = null,
    initialUserName: String? = null
) : ViewModel() {

    private val currentUserId: String = initialUserId
        ?: authRepository.getCurrentUser()?.id
        ?: "current_user"

    private val currentUserName: String = initialUserName
        ?: authRepository.getCurrentUser()?.fullName
        ?: "User"

    private val _uiState = MutableStateFlow(
        HomeUiState(
            currentUserId = currentUserId,
            userName = currentUserName
        )
    )
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadContacts()
    }

    fun loadContacts() {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }

        viewModelScope.launch {
            contactRepository.getContacts(currentUserId)
                .catch { throwable ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = throwable.message ?: "Failed to load contacts."
                        )
                    }
                }
                .collect { contacts ->
                    updateContacts(contacts)
                }
        }
    }

    private fun updateContacts(contacts: List<Contact>) {
        val allCount = contacts.size
        val onlineCount = contacts.count { it.isOnline }
        val offlineCount = contacts.count { !it.isOnline }
        val pinnedCount = contacts.count { it.isPinned }

        val filteredAndSorted = applyFilterAndSort(
            contacts = contacts,
            filter = _uiState.value.selectedFilter,
            query = _uiState.value.searchQuery
        )

        _uiState.update {
            it.copy(
                allContacts = contacts,
                displayedContacts = filteredAndSorted,
                allCount = allCount,
                onlineCount = onlineCount,
                offlineCount = offlineCount,
                pinnedCount = pinnedCount,
                isLoading = false,
                errorMessage = null
            )
        }
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.update { current ->
            val updated = applyFilterAndSort(current.allContacts, current.selectedFilter, query)
            current.copy(
                searchQuery = query,
                displayedContacts = updated
            )
        }
    }

    fun onFilterSelected(filter: ContactFilter) {
        _uiState.update { current ->
            val updated = applyFilterAndSort(current.allContacts, filter, current.searchQuery)
            current.copy(
                selectedFilter = filter,
                displayedContacts = updated
            )
        }
    }

    fun onTogglePin(contactId: String) {
        viewModelScope.launch {
            contactRepository.togglePin(currentUserId, contactId)
        }
    }

    fun sendInstantInvite(contactId: String) {
        // Prevent duplicate operations if request is in flight or already sent
        val state = _uiState.value
        if (contactId in state.invitingContactIds || contactId in state.invitedContactIds) {
            return
        }

        _uiState.update {
            it.copy(invitingContactIds = it.invitingContactIds + contactId)
        }

        viewModelScope.launch {
            val result = invitationRepository.sendDefaultInvitation(contactId, currentUserId)
            when (result) {
                is InvitationResult.Success -> {
                    val targetContact = _uiState.value.allContacts.firstOrNull { it.id == contactId }
                    val targetName = targetContact?.getVisibleName(currentUserId) ?: "Contact"
                    _uiState.update {
                        it.copy(
                            invitingContactIds = it.invitingContactIds - contactId,
                            invitedContactIds = it.invitedContactIds + contactId,
                            toastMessage = "⚡ Invite sent to $targetName!"
                        )
                    }
                }
                is InvitationResult.Failure -> {
                    _uiState.update {
                        it.copy(
                            invitingContactIds = it.invitingContactIds - contactId,
                            toastMessage = result.errorMessage
                        )
                    }
                }
            }
        }
    }

    fun onContactClicked(contact: Contact) {
        _uiState.update { it.copy(selectedContactForDetails = contact) }
    }

    fun onDismissContactDetails() {
        _uiState.update { it.copy(selectedContactForDetails = null) }
    }

    fun onNavTabSelected(tab: DashboardTab) {
        when (tab) {
            DashboardTab.HOME -> {
                _uiState.update { it.copy(activeTab = tab) }
            }
            DashboardTab.EXPLORE -> {
                _uiState.update {
                    it.copy(toastMessage = "Explore map & live places coming in the next release.")
                }
            }
            DashboardTab.CREATE_BREAK -> {
                _uiState.update {
                    it.copy(toastMessage = "Instant Break broadcast coming in the next release.")
                }
            }
            DashboardTab.CIRCLES -> {
                _uiState.update {
                    it.copy(toastMessage = "Break Circles feature coming in the next release.")
                }
            }
            DashboardTab.PROFILE -> {
                _uiState.update { it.copy(showSignOutDialog = true) }
            }
        }
    }

    fun onNotificationClicked() {
        _uiState.update {
            it.copy(
                hasUnreadNotifications = false,
                toastMessage = "No new break requests at this moment."
            )
        }
    }

    fun onProfileClicked() {
        _uiState.update { it.copy(showSignOutDialog = true) }
    }

    fun onDismissSignOutDialog() {
        _uiState.update { it.copy(showSignOutDialog = false) }
    }

    fun onAddPeopleClicked() {
        _uiState.update {
            it.copy(toastMessage = "Connect address book & QR sync coming soon.")
        }
    }

    fun clearToast() {
        _uiState.update { it.copy(toastMessage = null) }
    }

    private fun applyFilterAndSort(
        contacts: List<Contact>,
        filter: ContactFilter,
        query: String
    ): List<Contact> {
        val filteredByTab = when (filter) {
            ContactFilter.ALL -> contacts
            ContactFilter.ONLINE -> contacts.filter { it.isOnline }
            ContactFilter.OFFLINE -> contacts.filter { !it.isOnline }
            ContactFilter.PINNED -> contacts.filter { it.isPinned }
        }

        val filteredByQuery = if (query.isBlank()) {
            filteredByTab
        } else {
            val trimmed = query.trim().lowercase()
            filteredByTab.filter { contact ->
                contact.getVisibleName(currentUserId).lowercase().contains(trimmed) ||
                        contact.name.lowercase().contains(trimmed) ||
                        contact.relationship.label.lowercase().contains(trimmed)
            }
        }

        return ContactSorting.sortContacts(filteredByQuery, currentUserId)
    }
}
