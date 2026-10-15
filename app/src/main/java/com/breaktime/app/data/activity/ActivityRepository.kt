package com.breaktime.app.data.activity

import android.content.Context
import android.content.SharedPreferences
import com.breaktime.app.domain.activity.ActivityIconType
import com.breaktime.app.domain.activity.BreakActivity
import com.breaktime.app.domain.contact.Contact
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/**
 * Repository interface managing BreakTime activity options and user-defined custom activities.
 */
interface ActivityRepository {
    /**
     * Returns activities available for a given contact, filtered by relationship and consent rules.
     */
    fun getActivitiesForContact(contact: Contact): Flow<List<BreakActivity>>

    /**
     * Returns all custom activities created by the user.
     */
    fun getCustomActivities(): Flow<List<BreakActivity>>

    /**
     * Adds a new custom activity.
     */
    suspend fun addCustomActivity(title: String, subtitle: String, tags: List<String>): BreakActivity

    /**
     * Updates an existing custom activity.
     */
    suspend fun updateCustomActivity(id: String, title: String, subtitle: String, tags: List<String>): Boolean

    /**
     * Deletes a custom activity.
     */
    suspend fun deleteCustomActivity(id: String): Boolean
}

/**
 * Default implementation pre-seeded with official BreakTime activities,
 * storing custom activities in [SharedPreferences] for persistent storage.
 */
class DefaultActivityRepository(
    private val sharedPreferences: SharedPreferences? = null
) : ActivityRepository {

    constructor(context: Context) : this(
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    )

    private val baseActivities = listOf(
        BreakActivity(
            id = "act_chai",
            title = "EVENING CHAI",
            subtitle = "Warm cups and slow talks.",
            iconType = ActivityIconType.EVENING_CHAI,
            emoji = "☕",
            tags = listOf("Just the two of us", "At our usual spot")
        ),
        BreakActivity(
            id = "act_night_ride",
            title = "NIGHT RIDE",
            subtitle = "Let's escape the routine.",
            iconType = ActivityIconType.NIGHT_RIDE,
            emoji = "🏍️",
            tags = listOf("Just the two of us", "Anywhere nearby")
        ),
        BreakActivity(
            id = "act_shopping",
            title = "SHOPPING",
            subtitle = "Retail therapy and good company.",
            iconType = ActivityIconType.SHOPPING,
            emoji = "🛍️",
            tags = listOf("Mall or street walk", "Weekend vibe")
        ),
        BreakActivity(
            id = "act_walking",
            title = "WALKING",
            subtitle = "Clear our heads under the stars.",
            iconType = ActivityIconType.WALKING,
            emoji = "🚶",
            tags = listOf("Quiet path", "30-minute unwind")
        ),
        BreakActivity(
            id = "act_food",
            title = "FOOD",
            subtitle = "Midnight cravings and street eats.",
            iconType = ActivityIconType.FOOD,
            emoji = "🍜",
            tags = listOf("Food walk", "Your favourite spot")
        ),
        BreakActivity(
            id = "act_movie_night",
            title = "MOVIE NIGHT",
            subtitle = "Popcorn and a great story.",
            iconType = ActivityIconType.MOVIE_NIGHT,
            emoji = "🎬",
            tags = listOf("Cozy stream", "Late night show")
        ),
        BreakActivity(
            id = "act_gaming",
            title = "GAMING",
            subtitle = "Co-op sessions and friendly rivalry.",
            iconType = ActivityIconType.GAMING,
            emoji = "🎮",
            tags = listOf("Console or PC", "Victory royale")
        ),
        BreakActivity(
            id = "act_smoking_break",
            title = "SMOKING BREAK",
            subtitle = "Quick reset and fresh air.",
            iconType = ActivityIconType.SMOKING_BREAK,
            emoji = "🚬",
            tags = listOf("Quick 10m", "Balcony or corner")
        ),
        BreakActivity(
            id = "act_drinking",
            title = "DRINKING",
            subtitle = "Chilled drinks and late confessions.",
            iconType = ActivityIconType.DRINKING,
            emoji = "🥂",
            tags = listOf("Rooftop or pub", "Unwind night")
        ),
        BreakActivity(
            id = "act_kiss",
            title = "KISS",
            subtitle = "Soft moments that say everything.",
            iconType = ActivityIconType.KISS,
            emoji = "💋",
            isIntimate = true,
            tags = listOf("Intimate moment", "Just you and me")
        ),
        BreakActivity(
            id = "act_cuddle",
            title = "CUDDLE",
            subtitle = "Warm blankets and pure comfort.",
            iconType = ActivityIconType.CUDDLE,
            emoji = "🫂",
            isIntimate = true,
            tags = listOf("Cozy reset", "No words needed")
        ),
        BreakActivity(
            id = "act_custom_default",
            title = "CUSTOM ACTIVITY",
            subtitle = "Create your own moment.",
            iconType = ActivityIconType.CUSTOM,
            emoji = "✨",
            isCustom = true,
            tags = listOf("Tap to customize", "Your choice")
        )
    )

    private val _customActivities = MutableStateFlow<List<BreakActivity>>(loadCustomActivities())

    override fun getActivitiesForContact(contact: Contact): Flow<List<BreakActivity>> {
        return _customActivities.asStateFlow().map { customList ->
            val all = baseActivities + customList
            // Strictly filter by relationship consent rules
            all.filter { it.isAvailableFor(contact.relationship) }
        }
    }

    override fun getCustomActivities(): Flow<List<BreakActivity>> {
        return _customActivities.asStateFlow()
    }

    override suspend fun addCustomActivity(
        title: String,
        subtitle: String,
        tags: List<String>
    ): BreakActivity {
        val newActivity = BreakActivity(
            id = "custom_${UUID.randomUUID().toString().take(8)}",
            title = title.uppercase().trim(),
            subtitle = subtitle.trim(),
            iconType = ActivityIconType.CUSTOM,
            emoji = "✨",
            isCustom = true,
            tags = tags.ifEmpty { listOf("Custom moment", "Just the two of us") }
        )
        val updated = _customActivities.value + newActivity
        _customActivities.value = updated
        persistCustomActivities(updated)
        return newActivity
    }

    override suspend fun updateCustomActivity(
        id: String,
        title: String,
        subtitle: String,
        tags: List<String>
    ): Boolean {
        val current = _customActivities.value
        val index = current.indexOfFirst { it.id == id }
        if (index == -1) return false

        val updated = current.toMutableList()
        updated[index] = updated[index].copy(
            title = title.uppercase().trim(),
            subtitle = subtitle.trim(),
            tags = tags.ifEmpty { listOf("Custom moment", "Just the two of us") }
        )
        _customActivities.value = updated
        persistCustomActivities(updated)
        return true
    }

    override suspend fun deleteCustomActivity(id: String): Boolean {
        val current = _customActivities.value
        val updated = current.filterNot { it.id == id }
        if (updated.size == current.size) return false

        _customActivities.value = updated
        persistCustomActivities(updated)
        return true
    }

    private fun loadCustomActivities(): List<BreakActivity> {
        val rawJson = sharedPreferences?.getString(KEY_CUSTOM_ACTIVITIES, null) ?: return emptyList()
        return try {
            val jsonArray = JSONArray(rawJson)
            val list = mutableListOf<BreakActivity>()
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                val tagsArray = obj.optJSONArray("tags")
                val tagsList = mutableListOf<String>()
                if (tagsArray != null) {
                    for (j in 0 until tagsArray.length()) {
                        tagsList.add(tagsArray.getString(j))
                    }
                }
                list.add(
                    BreakActivity(
                        id = obj.getString("id"),
                        title = obj.getString("title"),
                        subtitle = obj.getString("subtitle"),
                        iconType = ActivityIconType.CUSTOM,
                        emoji = obj.optString("emoji", "✨"),
                        isCustom = true,
                        tags = tagsList.ifEmpty { listOf("Custom moment", "Just the two of us") }
                    )
                )
            }
            list
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun persistCustomActivities(activities: List<BreakActivity>) {
        if (sharedPreferences == null) return
        val jsonArray = JSONArray()
        activities.forEach { act ->
            val obj = JSONObject().apply {
                put("id", act.id)
                put("title", act.title)
                put("subtitle", act.subtitle)
                put("emoji", act.emoji)
                val tagsArr = JSONArray()
                act.tags.forEach { tagsArr.put(it) }
                put("tags", tagsArr)
            }
            jsonArray.put(obj)
        }
        sharedPreferences.edit().putString(KEY_CUSTOM_ACTIVITIES, jsonArray.toString()).apply()
    }

    companion object {
        private const val PREFS_NAME = "breaktime_activities"
        private const val KEY_CUSTOM_ACTIVITIES = "saved_custom_activities"
    }
}
