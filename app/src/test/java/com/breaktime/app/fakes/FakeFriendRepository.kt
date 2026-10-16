package com.breaktime.app.fakes

import com.breaktime.app.data.friends.FriendRepository
import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.RelationshipType
import com.breaktime.app.domain.friends.ContactPerson
import com.breaktime.app.domain.friends.DiscoveredContact
import com.breaktime.app.domain.friends.FriendRequest
import com.breaktime.app.domain.friends.FriendshipStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import java.util.UUID

class FakeFriendRepository : FriendRepository {

    var shouldFail: Boolean = false
    var failureMessage: String = "Simulated network failure"

    val registeredBreakTimePhones = mutableSetOf<String>()

    private val _friendsFlow = MutableStateFlow<List<Contact>>(emptyList())
    private val _pendingRequestsFlow = MutableStateFlow<List<FriendRequest>>(emptyList())

    fun setInitialFriends(friends: List<Contact>) {
        _friendsFlow.value = friends
    }

    fun setInitialRequests(requests: List<FriendRequest>) {
        _pendingRequestsFlow.value = requests
    }

    override fun getConfirmedFriends(currentUserId: String): Flow<List<Contact>> =
        _friendsFlow.asStateFlow()

    override fun getPendingRequests(currentUserId: String): Flow<List<FriendRequest>> =
        _pendingRequestsFlow.asStateFlow()

    override suspend fun matchContacts(
        contacts: List<ContactPerson>,
        currentUserId: String
    ): Result<List<DiscoveredContact>> {
        if (shouldFail) {
            return Result.failure(RuntimeException(failureMessage))
        }

        val discovered = contacts.map { person ->
            val isRegistered = person.phoneNumbers.any { registeredBreakTimePhones.contains(it) }
            if (isRegistered) {
                // Check if already friends or pending
                val isFriend = _friendsFlow.value.any { it.id == "bt_${person.id}" }
                val isPendingSent = _pendingRequestsFlow.value.any { it.recipientId == "bt_${person.id}" && it.requesterId == currentUserId }
                val isPendingReceived = _pendingRequestsFlow.value.any { it.requesterId == "bt_${person.id}" && it.recipientId == currentUserId }

                val status = when {
                    isFriend -> FriendshipStatus.FRIENDS
                    isPendingSent -> FriendshipStatus.PENDING_SENT
                    isPendingReceived -> FriendshipStatus.PENDING_RECEIVED
                    else -> FriendshipStatus.NONE
                }

                DiscoveredContact(
                    contact = person,
                    isBreakTimeUser = true,
                    breakTimeUserId = "bt_${person.id}",
                    breakTimeDisplayName = person.displayName,
                    friendshipStatus = status
                )
            } else {
                DiscoveredContact(
                    contact = person,
                    isBreakTimeUser = false,
                    friendshipStatus = FriendshipStatus.NONE
                )
            }
        }

        return Result.success(discovered)
    }

    override suspend fun sendFriendRequest(
        recipientUserId: String,
        currentUserId: String
    ): Result<FriendRequest> {
        if (shouldFail) {
            return Result.failure(RuntimeException(failureMessage))
        }

        if (recipientUserId == currentUserId) {
            return Result.failure(IllegalArgumentException("Cannot send friend request to yourself."))
        }

        val alreadyPending = _pendingRequestsFlow.value.any {
            (it.requesterId == currentUserId && it.recipientId == recipientUserId) ||
            (it.requesterId == recipientUserId && it.recipientId == currentUserId)
        }
        if (alreadyPending) {
            return Result.failure(IllegalStateException("A pending friend request already exists."))
        }

        val request = FriendRequest(
            id = UUID.randomUUID().toString(),
            requesterId = currentUserId,
            recipientId = recipientUserId,
            otherUserId = recipientUserId,
            otherUserName = "Contact $recipientUserId",
            isIncoming = false,
            status = "pending"
        )
        _pendingRequestsFlow.update { it + request }
        return Result.success(request)
    }

    override suspend fun acceptFriendRequest(
        requestId: String,
        currentUserId: String
    ): Result<Unit> {
        if (shouldFail) {
            return Result.failure(RuntimeException(failureMessage))
        }

        val request = _pendingRequestsFlow.value.find { it.id == requestId }
            ?: return Result.failure(NoSuchElementException("Request not found"))

        _pendingRequestsFlow.update { list -> list.filterNot { it.id == requestId } }

        val newFriend = Contact(
            id = request.otherUserId,
            name = request.otherUserName,
            isOnline = true,
            statusText = "Active now",
            relationship = RelationshipType.FRIENDS
        )
        _friendsFlow.update { it + newFriend }
        return Result.success(Unit)
    }

    override suspend fun declineFriendRequest(
        requestId: String,
        currentUserId: String
    ): Result<Unit> {
        if (shouldFail) {
            return Result.failure(RuntimeException(failureMessage))
        }

        _pendingRequestsFlow.update { list -> list.filterNot { it.id == requestId } }
        return Result.success(Unit)
    }

    override suspend fun cancelFriendRequest(
        requestId: String,
        currentUserId: String
    ): Result<Unit> {
        if (shouldFail) {
            return Result.failure(RuntimeException(failureMessage))
        }

        _pendingRequestsFlow.update { list -> list.filterNot { it.id == requestId } }
        return Result.success(Unit)
    }

    override suspend fun refresh(currentUserId: String): Result<Unit> {
        if (shouldFail) {
            return Result.failure(RuntimeException(failureMessage))
        }
        return Result.success(Unit)
    }
}
