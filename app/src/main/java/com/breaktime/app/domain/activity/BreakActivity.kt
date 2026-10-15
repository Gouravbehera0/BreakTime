package com.breaktime.app.domain.activity

import com.breaktime.app.domain.contact.RelationshipType

/**
 * Domain entity representing an invitation activity option in BreakTime.
 *
 * Privacy and Consent Guidelines:
 * - [isIntimate] activities (e.g. Kiss, Cuddle) strictly require mutual intimate relationship consent
 *   and are only accessible when the recipient relationship is [RelationshipType.LOVER].
 */
data class BreakActivity(
    val id: String,
    val title: String,
    val subtitle: String,
    val iconType: ActivityIconType,
    val emoji: String = "✨",
    val isIntimate: Boolean = false,
    val requiredRelationship: Set<RelationshipType>? = null,
    val isCustom: Boolean = false,
    val tags: List<String> = listOf("Just the two of us", "Anywhere nearby")
) {
    /**
     * Checks if this activity is permitted and consensual for the given recipient relationship.
     */
    fun isAvailableFor(relationship: RelationshipType?): Boolean {
        if (isIntimate) {
            // Intimate activities strictly require mutual romantic consent (LOVER)
            return relationship == RelationshipType.LOVER
        }
        if (requiredRelationship != null && relationship != null) {
            return requiredRelationship.contains(relationship)
        }
        return true
    }
}
