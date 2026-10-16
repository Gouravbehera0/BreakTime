package com.breaktime.app.data.friends

import android.content.Context
import android.content.pm.PackageManager
import android.provider.ContactsContract
import androidx.core.content.ContextCompat
import com.breaktime.app.domain.friends.ContactPerson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Reads and normalizes phone contacts from Android's ContactsContract.
 *
 * Privacy guidelines:
 * - Does NOT upload the entire address book to any remote database.
 * - Extracts only contact ID, display name, normalized phone numbers, and local photo URI.
 * - De-duplicates phone numbers and ignores malformed/empty entries.
 */
class PhoneContactReader(
    private val context: Context
) : ContactReader {

    /**
     * Checks if READ_CONTACTS permission has been granted by the user.
     */
    override fun hasPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.READ_CONTACTS
        ) == PackageManager.PERMISSION_GRANTED
    }

    /**
     * Reads all contacts with phone numbers from the device address book.
     * Returns an empty list if permission is missing or reading fails.
     */
    override suspend fun readContacts(defaultCountryCode: String): List<ContactPerson> =
        withContext(Dispatchers.IO) {
            if (!hasPermission()) {
                return@withContext emptyList()
            }

            val contactsMap = mutableMapOf<String, MutableContactData>()
            val projection = arrayOf(
                ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY,
                ContactsContract.CommonDataKinds.Phone.NUMBER,
                ContactsContract.CommonDataKinds.Phone.PHOTO_URI
            )

            try {
                val cursor = context.contentResolver.query(
                    ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                    projection,
                    null,
                    null,
                    "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY} ASC"
                )

                cursor?.use {
                    val idIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
                    val nameIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY)
                    val numberIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                    val photoIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.PHOTO_URI)

                    while (it.moveToNext()) {
                        val contactId = if (idIndex != -1) it.getString(idIndex).orEmpty() else ""
                        val name = if (nameIndex != -1) it.getString(nameIndex).orEmpty() else ""
                        val rawNumber = if (numberIndex != -1) it.getString(numberIndex).orEmpty() else ""
                        val photoUri = if (photoIndex != -1) it.getString(photoIndex) else null

                        if (contactId.isNotBlank() && name.isNotBlank() && rawNumber.isNotBlank()) {
                            val normalized = normalizePhoneNumber(rawNumber, defaultCountryCode)
                            if (!normalized.isNullOrBlank()) {
                                val entry = contactsMap.getOrPut(contactId) {
                                    MutableContactData(
                                        id = contactId,
                                        displayName = name,
                                        photoUri = photoUri
                                    )
                                }
                                if (!entry.phoneNumbers.contains(normalized)) {
                                    entry.phoneNumbers.add(normalized)
                                }
                            }
                        }
                    }
                }
            } catch (e: SecurityException) {
                return@withContext emptyList()
            } catch (e: Exception) {
                return@withContext emptyList()
            }

            contactsMap.values.map {
                ContactPerson(
                    id = it.id,
                    displayName = it.displayName,
                    phoneNumbers = it.phoneNumbers.toList(),
                    photoUri = it.photoUri
                )
            }
        }

    companion object {
        /**
         * Normalizes phone numbers to standard E.164-like format:
         * - Strips all whitespace, dashes, parentheses, dots.
         * - Preserves leading '+' for international numbers.
         * - If no '+' prefix, prepends the provided defaultCountryCode.
         * - Validates length (must have at least 7 digits).
         */
        fun normalizePhoneNumber(raw: String, defaultCountryCode: String = "+1"): String? {
            val trimmed = raw.trim()
            if (trimmed.isEmpty()) return null

            val hasPlus = trimmed.startsWith("+")
            val digitsOnly = trimmed.filter { it.isDigit() }

            if (digitsOnly.length < 7) {
                return null
            }

            val cleanCountryCode = if (defaultCountryCode.startsWith("+")) defaultCountryCode else "+$defaultCountryCode"

            return if (hasPlus) {
                "+$digitsOnly"
            } else {
                // If it starts with 00, treat 00 as +
                if (digitsOnly.startsWith("00")) {
                    "+${digitsOnly.substring(2)}"
                } else if (digitsOnly.length == 10) {
                    "$cleanCountryCode$digitsOnly"
                } else if (digitsOnly.length == 11 && digitsOnly.startsWith("1") && cleanCountryCode == "+1") {
                    "+$digitsOnly"
                } else {
                    "$cleanCountryCode$digitsOnly"
                }
            }
        }
    }

    private class MutableContactData(
        val id: String,
        val displayName: String,
        val photoUri: String?,
        val phoneNumbers: MutableList<String> = mutableListOf()
    )
}
