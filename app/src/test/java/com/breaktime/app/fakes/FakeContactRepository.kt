package com.breaktime.app.fakes

import com.breaktime.app.data.contact.ContactRepository
import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.RelationshipType
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

class FakeContactRepository(
    initialContacts: List<Contact> = emptyList()
) : ContactRepository {

    private val contactsFlow = MutableStateFlow(
        initialContacts.ifEmpty {
            listOf(
                Contact(id = "1", name = "Aisha", isOnline = true, isPinned = true, relationship = RelationshipType.LOVER),
                Contact(id = "2", name = "Rahul", isOnline = true, isPinned = true, relationship = RelationshipType.BESTFRIENDS),
                Contact(id = "3", name = "Aryan", isOnline = true, isPinned = false, relationship = RelationshipType.FRIENDS),
                Contact(id = "4", name = "Rohan", isOnline = false, isPinned = true, relationship = RelationshipType.BHAI),
                Contact(id = "5", name = "Ananya", isOnline = false, isPinned = false, relationship = RelationshipType.FRIENDS)
            )
        }
    )

    override fun getContacts(currentUserId: String): Flow<List<Contact>> {
        return contactsFlow.asStateFlow()
    }

    override suspend fun togglePin(currentUserId: String, contactId: String): Boolean {
        var newPinState = false
        contactsFlow.value = contactsFlow.value.map {
            if (it.id == contactId) {
                newPinState = !it.isPinned
                it.copy(isPinned = newPinState)
            } else it
        }
        return newPinState
    }

    override suspend fun getContactById(currentUserId: String, contactId: String): Contact? {
        return contactsFlow.value.firstOrNull { it.id == contactId }
    }

    override suspend fun refreshContacts(): Result<Unit> {
        return Result.success(Unit)
    }

    fun setContacts(contacts: List<Contact>) {
        contactsFlow.value = contacts
    }
}
