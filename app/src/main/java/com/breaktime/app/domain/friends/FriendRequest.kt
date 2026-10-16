package com.breaktime.app.domain.friends

/**
 * Representation of a pending or processed friend request.
 */
data class FriendRequest(
    val id: String,
    val requesterId: String,
    val recipientId: String,
    val otherUserId: String,
    val otherUserName: String,
    val otherUserAvatarUrl: String? = null,
    val otherUserPhone: String? = null,
    val isIncoming: Boolean,
    val status: String = "pending",
    val createdAt: Long = System.currentTimeMillis()
)
