package com.breaktime.app.data.contact

import android.content.Context
import android.content.SharedPreferences

/**
 * Repository interface for persisting contact pin preferences per authenticated user.
 */
interface PinPreferencesRepository {
    fun getPinnedContactIds(userId: String): Set<String>
    fun isPinned(userId: String, contactId: String): Boolean
    fun setPinned(userId: String, contactId: String, pinned: Boolean)
    fun togglePin(userId: String, contactId: String): Boolean
}

/**
 * SharedPreferences-backed implementation of [PinPreferencesRepository].
 * Stores pin sets keyed by user ID to isolate preferences per account.
 */
class SharedPrefsPinPreferencesRepository(
    private val sharedPreferences: SharedPreferences
) : PinPreferencesRepository {

    constructor(context: Context) : this(
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    )

    override fun getPinnedContactIds(userId: String): Set<String> {
        val key = keyForUser(userId)
        return sharedPreferences.getStringSet(key, emptySet())?.toSet() ?: emptySet()
    }

    override fun isPinned(userId: String, contactId: String): Boolean {
        return getPinnedContactIds(userId).contains(contactId)
    }

    override fun setPinned(userId: String, contactId: String, pinned: Boolean) {
        val current = getPinnedContactIds(userId).toMutableSet()
        if (pinned) {
            current.add(contactId)
        } else {
            current.remove(contactId)
        }
        sharedPreferences.edit().putStringSet(keyForUser(userId), current).apply()
    }

    override fun togglePin(userId: String, contactId: String): Boolean {
        val isNowPinned = !isPinned(userId, contactId)
        setPinned(userId, contactId, isNowPinned)
        return isNowPinned
    }

    private fun keyForUser(userId: String): String = "pinned_contacts_$userId"

    companion object {
        private const val PREFS_NAME = "breaktime_pin_preferences"
    }
}
