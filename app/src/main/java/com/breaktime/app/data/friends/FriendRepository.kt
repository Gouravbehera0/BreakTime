package com.breaktime.app.data.friends

import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.friends.ContactPerson
import com.breaktime.app.domain.friends.DiscoveredContact
import com.breaktime.app.domain.friends.FriendRequest
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for managing contact-based friends and friend requests.
 */
interface FriendRepository {

    /**
     * Flow of confirmed friends for the given user.
     */
    fun getConfirmedFriends(currentUserId: String): Flow<List<Contact>>

    /**
     * Flow of pending incoming and outgoing friend requests.
     */
    fun getPendingRequests(currentUserId: String): Flow<List<FriendRequest>>

    /**
     * Matches a list of phone contacts against registered BreakTime users.
     * Guaranteed to use privacy-preserving matching (RPC) and returns discovered contacts.
     */
    suspend fun matchContacts(
        contacts: List<ContactPerson>,
        currentUserId: String
    ): Result<List<DiscoveredContact>>

    /**
     * Sends a friend request to a registered BreakTime user.
     */
    suspend fun sendFriendRequest(
        recipientUserId: String,
        currentUserId: String
    ): Result<FriendRequest>

    /**
     * Accepts a received pending friend request.
     */
    suspend fun acceptFriendRequest(
        requestId: String,
        currentUserId: String
    ): Result<Unit>

    /**
     * Declines a received pending friend request.
     */
    suspend fun declineFriendRequest(
        requestId: String,
        currentUserId: String
    ): Result<Unit>

    /**
     * Cancels a sent pending friend request.
     */
    suspend fun cancelFriendRequest(
        requestId: String,
        currentUserId: String
    ): Result<Unit>

    /**
     * Refreshes friends and pending requests from the backend.
     */
    suspend fun refresh(currentUserId: String): Result<Unit>
}
