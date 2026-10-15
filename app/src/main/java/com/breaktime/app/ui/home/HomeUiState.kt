package com.breaktime.app.ui.home

import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.ContactFilter
import com.breaktime.app.ui.home.components.DashboardTab

/**
 * State representing the Home Dashboard UI.
 */
data class HomeUiState(
    val allContacts: List<Contact> = emptyList(),
    val displayedContacts: List<Contact> = emptyList(),
    val selectedFilter: ContactFilter = ContactFilter.ALL,
    val searchQuery: String = "",
    val allCount: Int = 0,
    val onlineCount: Int = 0,
    val offlineCount: Int = 0,
    val pinnedCount: Int = 0,
    val isLoading: Boolean = true,
    val errorMessage: String? = null,
    val currentUserId: String = "current_user",
    val userName: String = "User",
    val invitingContactIds: Set<String> = emptySet(),
    val invitedContactIds: Set<String> = emptySet(),
    val toastMessage: String? = null,
    val selectedContactForDetails: Contact? = null,
    val activeTab: DashboardTab = DashboardTab.HOME,
    val hasUnreadNotifications: Boolean = true,
    val showSignOutDialog: Boolean = false
)
