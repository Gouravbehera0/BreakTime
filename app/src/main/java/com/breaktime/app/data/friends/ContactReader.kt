package com.breaktime.app.data.friends

import com.breaktime.app.domain.friends.ContactPerson

/**
 * Interface abstraction for reading contacts from the device.
 */
interface ContactReader {
    fun hasPermission(): Boolean
    suspend fun readContacts(defaultCountryCode: String = "+1"): List<ContactPerson>
}
