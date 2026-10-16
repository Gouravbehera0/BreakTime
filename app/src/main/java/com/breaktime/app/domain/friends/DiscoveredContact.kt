package com.breaktime.app.domain.friends

/**
 * Representation of a device contact matched or evaluated against BreakTime users.
 *
 * Privacy guarantee:
 * - Phone numbers are only stored locally on device.
 * - [isBreakTimeUser] is true only if the contact's normalized phone matches a registered user.
 */
data class DiscoveredContact(
    val contact: ContactPerson,
    val isBreakTimeUser: Boolean,
    val breakTimeUserId: String? = null,
    val breakTimeDisplayName: String? = null,
    val breakTimeAvatarUrl: String? = null,
    val friendshipStatus: FriendshipStatus = FriendshipStatus.NONE,
    val isProcessing: Boolean = false
) {
    val id: String
        get() = breakTimeUserId ?: contact.id

    val displayName: String
        get() = if (isBreakTimeUser && !breakTimeDisplayName.isNullOrBlank()) {
            breakTimeDisplayName
        } else {
            contact.displayName
        }

    val avatarUrl: String?
        get() = breakTimeAvatarUrl ?: contact.photoUri
}
