package com.breaktime.app.ui.friends

import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.friends.DiscoveredContact
import com.breaktime.app.domain.friends.FriendRequest

/**
 * State representing the status of device contacts runtime permission.
 */
enum class ContactPermissionState {
    NOT_REQUESTED,
    GRANTED,
    DENIED,
    PERMANENTLY_DENIED
}

/**
 * Immutable UI state for the Friends ("Your People") screen.
 */
data class FriendsUiState(
    val isLoading: Boolean = false,
    val isMatchingContacts: Boolean = false,
    val permissionState: ContactPermissionState = ContactPermissionState.NOT_REQUESTED,
    val confirmedFriends: List<Contact> = emptyList(),
    val pendingRequests: List<FriendRequest> = emptyList(),
    val discoveredContacts: List<DiscoveredContact> = emptyList(),
    val searchQuery: String = "",
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val isRefreshing: Boolean = false
) {
    /** Contacts from address book that are verified BreakTime users */
    val breakTimeUsers: List<DiscoveredContact>
        get() = discoveredContacts.filter { it.isBreakTimeUser }

    /** Contacts from address book that can be invited to BreakTime */
    val inviteableContacts: List<DiscoveredContact>
        get() = discoveredContacts.filter { !it.isBreakTimeUser }

    /** Confirmed friends filtered strictly locally against the current user's friends */
    val filteredFriends: List<Contact>
        get() = if (searchQuery.isBlank()) {
            confirmedFriends
        } else {
            val q = searchQuery.trim().lowercase()
            confirmedFriends.filter { it.name.lowercase().contains(q) }
        }

    /** Count of incoming requests requiring user attention */
    val incomingRequestsCount: Int
        get() = pendingRequests.count { it.isIncoming }
}
