package com.breaktime.app.domain.friends

/**
 * Status of friendship connection between the authenticated user and another user.
 */
enum class FriendshipStatus {
    /** No relationship exists. User can send a friend request. */
    NONE,

    /** Current user sent a friend request; waiting for recipient response. */
    PENDING_SENT,

    /** Current user received a friend request; can accept or decline. */
    PENDING_RECEIVED,

    /** Users are confirmed friends. */
    FRIENDS;

    companion object {
        fun fromString(value: String?): FriendshipStatus {
            return when (value?.lowercase()?.trim()) {
                "friends" -> FRIENDS
                "pending_sent" -> PENDING_SENT
                "pending_received" -> PENDING_RECEIVED
                else -> NONE
            }
        }
    }
}
