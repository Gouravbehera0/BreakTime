package com.breaktime.app.domain.contact

/**
 * Representation of a connection / contact in BreakTime.
 *
 * Privacy guidelines:
 * - [privateNickname] is only visible to the user who created it ([nicknameCreatorId]).
 * - Private relationships like [RelationshipType.CRUSH] are only visible to their creator ([relationshipCreatorId]).
 */
data class Contact(
    val id: String,
    val name: String,
    val avatarUrl: String? = null,
    val isOnline: Boolean = false,
    val statusText: String = "",
    val relationship: RelationshipType = RelationshipType.FRIENDS,
    val relationshipCreatorId: String? = null,
    val privateNickname: String? = null,
    val nicknameCreatorId: String? = null,
    val isPinned: Boolean = false,
    val lastActiveTimestamp: Long = 0L,
    val phoneNumber: String? = null,
    val bio: String? = null
) {
    /**
     * Resolves the display name according to privacy rules:
     * Private nicknames are only visible to the creator.
     */
    fun getVisibleName(viewerUserId: String?): String {
        return if (!privateNickname.isNullOrBlank() && (nicknameCreatorId == null || nicknameCreatorId == viewerUserId)) {
            privateNickname
        } else {
            name
        }
    }

    /**
     * Resolves the visible relationship tag according to privacy rules:
     * Private relationships (such as CRUSH) must never be visible to the tagged person or third parties.
     */
    fun getVisibleRelationship(viewerUserId: String?): RelationshipType? {
        if (relationship.isPrivateOnly && relationshipCreatorId != null && relationshipCreatorId != viewerUserId) {
            return null
        }
        return relationship
    }
}
