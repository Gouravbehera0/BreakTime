package com.breaktime.app

import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.ContactSorting
import com.breaktime.app.domain.contact.RelationshipType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ContactSortingTest {

    @Test
    fun testPrioritySortingOrder() {
        val contactPinnedOnline = Contact(
            id = "1",
            name = "Aisha",
            isOnline = true,
            isPinned = true,
            relationship = RelationshipType.LOVER
        )
        val contactOnlineOnly = Contact(
            id = "2",
            name = "Aryan",
            isOnline = true,
            isPinned = false,
            relationship = RelationshipType.FRIENDS
        )
        val contactPinnedOffline = Contact(
            id = "3",
            name = "Rohan",
            isOnline = false,
            isPinned = true,
            relationship = RelationshipType.BHAI
        )
        val contactOfflineOnly = Contact(
            id = "4",
            name = "Karan",
            isOnline = false,
            isPinned = false,
            relationship = RelationshipType.COLLEGE
        )

        // Shuffle in random reverse order
        val unsorted = listOf(contactOfflineOnly, contactOnlineOnly, contactPinnedOffline, contactPinnedOnline)
        val sorted = ContactSorting.sortContacts(unsorted)

        // Must strictly adhere to:
        // 1. Pinned and online
        // 2. Other online contacts
        // 3. Pinned and offline
        // 4. Other offline contacts
        assertEquals("1", sorted[0].id) // Pinned + Online
        assertEquals("2", sorted[1].id) // Online only
        assertEquals("3", sorted[2].id) // Pinned + Offline
        assertEquals("4", sorted[3].id) // Offline only
    }

    @Test
    fun testTieBreakerAlphabeticalByVisibleName() {
        val userA = Contact(id = "1", name = "Zara", isOnline = true, isPinned = true)
        val userB = Contact(id = "2", name = "Aman", isOnline = true, isPinned = true)
        val userC = Contact(id = "3", name = "Bhavna", isOnline = true, isPinned = true)

        val sorted = ContactSorting.sortContacts(listOf(userA, userB, userC))

        assertEquals("Aman", sorted[0].name)
        assertEquals("Bhavna", sorted[1].name)
        assertEquals("Zara", sorted[2].name)
    }

    @Test
    fun testPrivacyRule_CrushTagHiddenFromNonCreator() {
        val crushContact = Contact(
            id = "10",
            name = "Dev",
            relationship = RelationshipType.CRUSH,
            relationshipCreatorId = "user_alice"
        )

        // Creator Alice views Dev: sees CRUSH tag
        val tagForAlice = crushContact.getVisibleRelationship("user_alice")
        assertEquals(RelationshipType.CRUSH, tagForAlice)

        // Tagged person Dev views profile: must NEVER see CRUSH tag
        val tagForDev = crushContact.getVisibleRelationship("user_dev")
        assertNull("CRUSH tag must never be visible to tagged person", tagForDev)

        // Third party Bob views profile: must not see CRUSH tag
        val tagForBob = crushContact.getVisibleRelationship("user_bob")
        assertNull("CRUSH tag must never be visible to third party", tagForBob)
    }

    @Test
    fun testPrivacyRule_PrivateNicknameVisibleOnlyToCreator() {
        val contact = Contact(
            id = "1",
            name = "Aisha Sen",
            privateNickname = "My Moon 💜",
            nicknameCreatorId = "user_alice"
        )

        // Alice (creator) views Aisha
        assertEquals("My Moon 💜", contact.getVisibleName("user_alice"))

        // Another user views Aisha: receives public name
        assertEquals("Aisha Sen", contact.getVisibleName("user_bob"))
    }
}
