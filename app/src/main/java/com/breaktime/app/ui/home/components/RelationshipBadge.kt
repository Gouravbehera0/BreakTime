package com.breaktime.app.ui.home.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.domain.contact.RelationshipType
import com.breaktime.app.ui.theme.BreakTimeTheme

/**
 * Visual styling configuration for each relationship category.
 */
private data class BadgeStyle(
    val textColor: Color,
    val backgroundColor: Color,
    val borderColor: Color
)

private fun getBadgeStyle(relationship: RelationshipType): BadgeStyle {
    return when (relationship) {
        RelationshipType.LOVER -> BadgeStyle(
            textColor = Color(0xFFF472B6), // Soft Pink
            backgroundColor = Color(0x33F472B6),
            borderColor = Color(0x55F472B6)
        )
        RelationshipType.BESTFRIENDS -> BadgeStyle(
            textColor = Color(0xFFC084FC), // Radiant Purple
            backgroundColor = Color(0x33C084FC),
            borderColor = Color(0x55C084FC)
        )
        RelationshipType.FRIENDS -> BadgeStyle(
            textColor = Color(0xFF818CF8), // Calm Indigo
            backgroundColor = Color(0x33818CF8),
            borderColor = Color(0x55818CF8)
        )
        RelationshipType.BHAI -> BadgeStyle(
            textColor = Color(0xFFA78BFA), // Deep Violet
            backgroundColor = Color(0x33A78BFA),
            borderColor = Color(0x55A78BFA)
        )
        RelationshipType.SISTER -> BadgeStyle(
            textColor = Color(0xFFF472B6),
            backgroundColor = Color(0x33F472B6),
            borderColor = Color(0x55F472B6)
        )
        RelationshipType.FAMILY -> BadgeStyle(
            textColor = Color(0xFFFCD34D), // Warm Amber
            backgroundColor = Color(0x33FCD34D),
            borderColor = Color(0x55FCD34D)
        )
        RelationshipType.COLLEGE -> BadgeStyle(
            textColor = Color(0xFFFBBF24), // College Gold
            backgroundColor = Color(0x33FBBF24),
            borderColor = Color(0x55FBBF24)
        )
        RelationshipType.CRUSH -> BadgeStyle(
            textColor = Color(0xFFFB7185), // Rose
            backgroundColor = Color(0x33FB7185),
            borderColor = Color(0x55FB7185)
        )
        RelationshipType.OTHER -> BadgeStyle(
            textColor = Color(0xFFA5A0B5), // Muted Silver
            backgroundColor = Color(0x22A5A0B5),
            borderColor = Color(0x44A5A0B5)
        )
    }
}

/**
 * Reusable pill badge displaying the contact's relationship category.
 *
 * Honors BreakTime privacy rules:
 * - If [relationship] is a private-only tag (e.g. CRUSH) and [viewerUserId] is not the
 *   [relationshipCreatorId], this composable renders nothing.
 */
@Composable
fun RelationshipBadge(
    relationship: RelationshipType?,
    viewerUserId: String?,
    relationshipCreatorId: String?,
    modifier: Modifier = Modifier
) {
    if (relationship == null) return

    // Privacy safeguard: Never display private tags to anyone other than creator
    if (relationship.isPrivateOnly && (relationshipCreatorId == null || relationshipCreatorId != viewerUserId)) {
        return
    }

    val style = getBadgeStyle(relationship)
    val shape = RoundedCornerShape(12.dp)

    Row(
        modifier = modifier
            .clip(shape)
            .background(style.backgroundColor)
            .border(width = 0.8.dp, color = style.borderColor, shape = shape)
            .padding(horizontal = 8.dp, vertical = 2.5.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = relationship.iconEmoji,
            fontSize = 10.sp,
            color = style.textColor
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = relationship.label,
            color = style.textColor,
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.5.sp
        )
    }
}

@Preview(name = "Relationship Badges")
@Composable
private fun RelationshipBadgesPreview() {
    BreakTimeTheme {
        Row {
            RelationshipBadge(
                relationship = RelationshipType.LOVER,
                viewerUserId = "user1",
                relationshipCreatorId = "user1"
            )
            Spacer(modifier = Modifier.width(6.dp))
            RelationshipBadge(
                relationship = RelationshipType.BESTFRIENDS,
                viewerUserId = "user1",
                relationshipCreatorId = "user1"
            )
            Spacer(modifier = Modifier.width(6.dp))
            RelationshipBadge(
                relationship = RelationshipType.BHAI,
                viewerUserId = "user1",
                relationshipCreatorId = "user1"
            )
        }
    }
}
