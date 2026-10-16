package com.breaktime.app.fakes

import com.breaktime.app.data.friends.ContactReader
import com.breaktime.app.domain.friends.ContactPerson

class FakeContactReader : ContactReader {

    var hasPermission: Boolean = false
    var contacts: List<ContactPerson> = emptyList()

    override fun hasPermission(): Boolean = hasPermission

    override suspend fun readContacts(defaultCountryCode: String): List<ContactPerson> {
        return if (hasPermission) contacts else emptyList()
    }
}
