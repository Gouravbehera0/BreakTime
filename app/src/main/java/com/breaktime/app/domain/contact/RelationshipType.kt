package com.breaktime.app.domain.contact

/**
 * Supported relationship types in BreakTime.
 *
 * Special privacy rules:
 * - [CRUSH] is a private tag that MUST NEVER be displayed to the tagged person.
 * - Only the user who created a private tag may view it.
 */
enum class RelationshipType(
    val label: String,
    val iconEmoji: String,
    val isPrivateOnly: Boolean = false
) {
    LOVER(label = "LOVER", iconEmoji = "♥"),
    BESTFRIENDS(label = "BESTFRIENDS", iconEmoji = "👥"),
    FRIENDS(label = "FRIENDS", iconEmoji = "👥"),
    BHAI(label = "BHAI", iconEmoji = "👥"),
    SISTER(label = "SISTER", iconEmoji = "👥"),
    FAMILY(label = "FAMILY", iconEmoji = "👥"),
    COLLEGE(label = "COLLEGE", iconEmoji = "🎓"),
    CRUSH(label = "CRUSH", iconEmoji = "💘", isPrivateOnly = true),
    OTHER(label = "OTHER", iconEmoji = "✨");

    companion object {
        fun fromString(value: String): RelationshipType {
            return entries.firstOrNull { it.name.equals(value, ignoreCase = true) } ?: OTHER
        }
    }
}
