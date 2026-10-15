package com.breaktime.app.domain.contact

/**
 * Deterministic sorting strategy for BreakTime contacts.
 *
 * Priority rules:
 * 1. Pinned and online (highest priority)
 * 2. Other online contacts
 * 3. Pinned and offline
 * 4. Other offline contacts (lowest priority)
 *
 * Tie-breaker: Alphabetical by visible name, then by unique ID.
 */
object ContactSorting {

    /**
     * Computes the sorting tier score for a contact.
     * Higher score = higher display priority.
     */
    fun priorityScore(contact: Contact): Int {
        return when {
            contact.isPinned && contact.isOnline -> 4
            !contact.isPinned && contact.isOnline -> 3
            contact.isPinned && !contact.isOnline -> 2
            else -> 1
        }
    }

    /**
     * Sorts a list of contacts according to BreakTime's priority rules.
     */
    fun sortContacts(contacts: List<Contact>, viewerUserId: String? = null): List<Contact> {
        return contacts.sortedWith(
            compareByDescending<Contact> { priorityScore(it) }
                .thenBy { it.getVisibleName(viewerUserId).lowercase() }
                .thenBy { it.id }
        )
    }
}
