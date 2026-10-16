package com.breaktime.app.domain.friends

/**
 * Representation of a contact read from the device's address book.
 */
data class ContactPerson(
    val id: String,
    val displayName: String,
    val phoneNumbers: List<String>,
    val photoUri: String? = null
) {
    /** Primary normalized phone number for quick reference */
    val primaryPhoneNumber: String?
        get() = phoneNumbers.firstOrNull()
}
