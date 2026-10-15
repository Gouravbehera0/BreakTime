package com.breaktime.app.data.contact

import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.RelationshipType
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

/**
 * Repository for managing user contacts and connections.
 */
interface ContactRepository {
    fun getContacts(currentUserId: String): Flow<List<Contact>>
    suspend fun togglePin(currentUserId: String, contactId: String): Boolean
    suspend fun getContactById(currentUserId: String, contactId: String): Contact?
    suspend fun refreshContacts(): Result<Unit>
}

/**
 * Default implementation with rich seed data matching the BreakTime design reference.
 * Pin preferences are strictly partitioned per authenticated user ID.
 */
class DefaultContactRepository(
    private val pinPreferencesRepository: PinPreferencesRepository
) : ContactRepository {

    // Base mock contacts modeled precisely after the BreakTime design specification
    private val baseContacts = listOf(
        Contact(
            id = "contact_1",
            name = "Aisha Sen",
            privateNickname = "My Moon 💜",
            nicknameCreatorId = "current_user",
            isOnline = true,
            statusText = "Active now",
            relationship = RelationshipType.LOVER,
            relationshipCreatorId = "current_user",
            phoneNumber = "+1 (555) 019-2834",
            bio = "Always up for midnight coffee and spontaneous drives ☕🌙"
        ),
        Contact(
            id = "contact_2",
            name = "Rahul Sharma 😎",
            isOnline = true,
            statusText = "Active 5m ago",
            relationship = RelationshipType.BESTFRIENDS,
            phoneNumber = "+1 (555) 014-9921",
            bio = "Building cool tech & gaming on weekends 🎮"
        ),
        Contact(
            id = "contact_3",
            name = "Aryan Verma 🏍️",
            isOnline = true,
            statusText = "Active 12m ago",
            relationship = RelationshipType.FRIENDS,
            phoneNumber = "+1 (555) 018-7743",
            bio = "Bikes, tracks, and open roads 🏍️💨"
        ),
        Contact(
            id = "contact_4",
            name = "Rohan Malhotra 🐺",
            isOnline = false,
            statusText = "Last seen 2h ago",
            relationship = RelationshipType.BHAI,
            phoneNumber = "+1 (555) 012-3456",
            bio = "Gym, brotherly advice & late night coding 🐺💪"
        ),
        Contact(
            id = "contact_5",
            name = "Ananya Roy ✨",
            isOnline = false,
            statusText = "Last seen 5h ago",
            relationship = RelationshipType.FRIENDS,
            phoneNumber = "+1 (555) 016-8812",
            bio = "Designing interfaces and chasing sunsets 🎨✨"
        ),
        Contact(
            id = "contact_6",
            name = "Karan Patel 🌿",
            isOnline = false,
            statusText = "Last seen 1d ago",
            relationship = RelationshipType.COLLEGE,
            phoneNumber = "+1 (555) 017-4321",
            bio = "Campus nostalgia, tea lover & indie music 🎶"
        ),
        Contact(
            id = "contact_7",
            name = "Priya Nair 💫",
            isOnline = true,
            statusText = "Active 3m ago",
            relationship = RelationshipType.SISTER,
            phoneNumber = "+1 (555) 019-4455",
            bio = "Big sister energy & book hoarder 📚"
        ),
        Contact(
            id = "contact_8",
            name = "Sneha Joshi 🌸",
            isOnline = true,
            statusText = "Active now",
            relationship = RelationshipType.FRIENDS,
            phoneNumber = "+1 (555) 011-8899",
            bio = "Matcha lattes and film photography 📷"
        ),
        Contact(
            id = "contact_9",
            name = "Vikram Singh ⚡",
            isOnline = false,
            statusText = "Last seen 3h ago",
            relationship = RelationshipType.FAMILY,
            phoneNumber = "+1 (555) 015-7766",
            bio = "Family first. Always ready for cricket matches 🏏"
        ),
        Contact(
            id = "contact_10",
            name = "Dev Dixit",
            isOnline = false,
            statusText = "Last seen 8h ago",
            relationship = RelationshipType.CRUSH,
            relationshipCreatorId = "current_user",
            privateNickname = "Dev 🌟",
            nicknameCreatorId = "current_user",
            phoneNumber = "+1 (555) 013-6655",
            bio = "Quiet thinker & acoustic guitarist 🎸"
        ),
        Contact(
            id = "contact_11",
            name = "Tanvi Mehta 🦋",
            isOnline = false,
            statusText = "Last seen 1d ago",
            relationship = RelationshipType.FRIENDS,
            phoneNumber = "+1 (555) 018-2233",
            bio = "Podcasts, plants, and travel plans ✈️"
        ),
        Contact(
            id = "contact_12",
            name = "Kabir Rao ☕",
            isOnline = false,
            statusText = "Last seen 2d ago",
            relationship = RelationshipType.OTHER,
            phoneNumber = "+1 (555) 010-9988",
            bio = "Coffee snob & startup founder 🚀"
        )
    )

    private val _contacts = MutableStateFlow(baseContacts)

    init {
        // Pre-populate initial default pins for "current_user" and "demo_user" if unset
        listOf("current_user", "demo_user").forEach { userId ->
            if (pinPreferencesRepository.getPinnedContactIds(userId).isEmpty()) {
                pinPreferencesRepository.setPinned(userId, "contact_1", true)
                pinPreferencesRepository.setPinned(userId, "contact_2", true)
                pinPreferencesRepository.setPinned(userId, "contact_4", true)
            }
        }
    }

    override fun getContacts(currentUserId: String): Flow<List<Contact>> {
        return _contacts.asStateFlow().map { list ->
            val pinnedIds = pinPreferencesRepository.getPinnedContactIds(currentUserId)
            list.map { contact ->
                contact.copy(
                    isPinned = pinnedIds.contains(contact.id)
                )
            }
        }
    }

    override suspend fun togglePin(currentUserId: String, contactId: String): Boolean {
        val newPinnedState = pinPreferencesRepository.togglePin(currentUserId, contactId)
        // Trigger flow update
        _contacts.value = _contacts.value.toList()
        return newPinnedState
    }

    override suspend fun getContactById(currentUserId: String, contactId: String): Contact? {
        val pinnedIds = pinPreferencesRepository.getPinnedContactIds(currentUserId)
        return _contacts.value.firstOrNull { it.id == contactId }?.let {
            it.copy(isPinned = pinnedIds.contains(it.id))
        }
    }

    override suspend fun refreshContacts(): Result<Unit> {
        // In real backend setup, this would fetch updated presence & contact list
        _contacts.value = baseContacts
        return Result.success(Unit)
    }
}
