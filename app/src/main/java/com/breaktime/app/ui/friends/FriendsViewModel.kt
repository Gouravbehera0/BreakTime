package com.breaktime.app.ui.friends

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breaktime.app.data.auth.AuthRepository
import com.breaktime.app.data.friends.ContactReader
import com.breaktime.app.data.friends.FriendRepository
import com.breaktime.app.domain.friends.DiscoveredContact
import com.breaktime.app.domain.friends.FriendRequest
import com.breaktime.app.domain.friends.FriendshipStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * ViewModel for the BreakTime Friends ("Your People") system.
 * Manages phone contact extraction, privacy-preserving matching, and friend requests.
 */
class FriendsViewModel(
    private val friendRepository: FriendRepository,
    private val phoneContactReader: ContactReader,
    private val authRepository: AuthRepository,
    private val initialUserId: String? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow(FriendsUiState())
    val uiState: StateFlow<FriendsUiState> = _uiState.asStateFlow()

    private val currentUserId: String
        get() = initialUserId
            ?: authRepository.getCurrentUser()?.id
            ?: "guest_user"

    init {
        checkInitialPermission()
        observeFriendsAndRequests()
    }

    private fun checkInitialPermission() {
        if (phoneContactReader.hasPermission()) {
            _uiState.update { it.copy(permissionState = ContactPermissionState.GRANTED) }
            scanContacts()
        } else {
            _uiState.update { it.copy(permissionState = ContactPermissionState.NOT_REQUESTED) }
        }
    }

    private fun observeFriendsAndRequests() {
        viewModelScope.launch {
            friendRepository.getConfirmedFriends(currentUserId).collect { friends ->
                _uiState.update { it.copy(confirmedFriends = friends) }
            }
        }

        viewModelScope.launch {
            friendRepository.getPendingRequests(currentUserId).collect { requests ->
                _uiState.update { it.copy(pendingRequests = requests) }
            }
        }

        viewModelScope.launch {
            friendRepository.refresh(currentUserId)
        }
    }

    /**
     * Handles result of Android's runtime READ_CONTACTS permission request.
     */
    fun onPermissionResult(isGranted: Boolean, shouldShowRationale: Boolean = false) {
        if (isGranted) {
            _uiState.update { it.copy(permissionState = ContactPermissionState.GRANTED) }
            scanContacts()
        } else {
            val state = if (shouldShowRationale) {
                ContactPermissionState.DENIED
            } else {
                ContactPermissionState.PERMANENTLY_DENIED
            }
            _uiState.update { it.copy(permissionState = state) }
        }
    }

    /**
     * Reads contacts from the device and initiates privacy-preserving matching.
     */
    fun scanContacts() {
        if (!phoneContactReader.hasPermission()) {
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isMatchingContacts = true, errorMessage = null) }
            try {
                val contacts = phoneContactReader.readContacts()
                val matchResult = friendRepository.matchContacts(contacts, currentUserId)
                matchResult.onSuccess { discovered ->
                    _uiState.update {
                        it.copy(
                            isMatchingContacts = false,
                            discoveredContacts = discovered
                        )
                    }
                }.onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isMatchingContacts = false,
                            errorMessage = error.message ?: "Failed to match contacts."
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isMatchingContacts = false,
                        errorMessage = e.message ?: "Error reading contacts."
                    )
                }
            }
        }
    }

    /**
     * Sends a friend request to a discovered user on BreakTime.
     */
    fun sendFriendRequest(discoveredContact: DiscoveredContact) {
        val targetUserId = discoveredContact.breakTimeUserId ?: return

        // Prevent duplicate request if already pending or friends
        if (discoveredContact.friendshipStatus != FriendshipStatus.NONE) {
            return
        }

        viewModelScope.launch {
            // Optimistically update discovered contact state
            _uiState.update { state ->
                val updated = state.discoveredContacts.map {
                    if (it.id == discoveredContact.id) {
                        it.copy(isProcessing = true)
                    } else it
                }
                state.copy(discoveredContacts = updated)
            }

            val result = friendRepository.sendFriendRequest(targetUserId, currentUserId)
            result.onSuccess {
                _uiState.update { state ->
                    val updated = state.discoveredContacts.map {
                        if (it.id == discoveredContact.id) {
                            it.copy(friendshipStatus = FriendshipStatus.PENDING_SENT, isProcessing = false)
                        } else it
                    }
                    state.copy(
                        discoveredContacts = updated,
                        successMessage = "Friend request sent to ${discoveredContact.displayName}!"
                    )
                }
            }.onFailure { error ->
                _uiState.update { state ->
                    val updated = state.discoveredContacts.map {
                        if (it.id == discoveredContact.id) {
                            it.copy(isProcessing = false)
                        } else it
                    }
                    state.copy(
                        discoveredContacts = updated,
                        errorMessage = error.message ?: "Could not send friend request."
                    )
                }
            }
        }
    }

    /**
     * Accepts a received pending friend request.
     */
    fun acceptFriendRequest(request: FriendRequest) {
        viewModelScope.launch {
            val result = friendRepository.acceptFriendRequest(request.id, currentUserId)
            result.onSuccess {
                _uiState.update {
                    it.copy(successMessage = "You and ${request.otherUserName} are now friends!")
                }
                // Refresh contacts list to reflect new friendship status
                scanContacts()
            }.onFailure { error ->
                _uiState.update {
                    it.copy(errorMessage = error.message ?: "Failed to accept friend request.")
                }
            }
        }
    }

    /**
     * Declines a received pending friend request.
     */
    fun declineFriendRequest(request: FriendRequest) {
        viewModelScope.launch {
            val result = friendRepository.declineFriendRequest(request.id, currentUserId)
            result.onSuccess {
                _uiState.update {
                    it.copy(successMessage = "Request declined.")
                }
                scanContacts()
            }.onFailure { error ->
                _uiState.update {
                    it.copy(errorMessage = error.message ?: "Failed to decline request.")
                }
            }
        }
    }

    /**
     * Cancels an outgoing pending friend request.
     */
    fun cancelFriendRequest(request: FriendRequest) {
        viewModelScope.launch {
            val result = friendRepository.cancelFriendRequest(request.id, currentUserId)
            result.onSuccess {
                _uiState.update {
                    it.copy(successMessage = "Request cancelled.")
                }
                scanContacts()
            }.onFailure { error ->
                _uiState.update {
                    it.copy(errorMessage = error.message ?: "Failed to cancel request.")
                }
            }
        }
    }

    /**
     * Updates the local search filter query.
     */
    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    /**
     * Manually refreshes friends and re-evaluates contact matches.
     */
    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isRefreshing = true) }
            friendRepository.refresh(currentUserId)
            if (phoneContactReader.hasPermission()) {
                scanContacts()
            }
            _uiState.update { it.copy(isRefreshing = false) }
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, successMessage = null) }
    }
}
