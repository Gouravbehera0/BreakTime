package com.breaktime.app.ui.home.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.MoreVert
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.RelationshipType
import com.breaktime.app.ui.theme.BreakTimeTheme
import com.breaktime.app.ui.theme.DarkShadow
import com.breaktime.app.ui.theme.LightShadow
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryAccent
import com.breaktime.app.ui.theme.SecondaryText

/**
 * Neomorphic Contact Card implementing the BreakTime Midnight aesthetic.
 *
 * Displays:
 * - Profile avatar with embedded presence status indicator.
 * - Privacy-aware visible name (resolving private nicknames for creator).
 * - Online / Offline last-seen activity status.
 * - Privacy-aware relationship badge (hiding private tags like CRUSH from non-creators).
 * - Pin/unpin quick toggle.
 * - One-tap ⚡ Invite button.
 * - More options menu trigger.
 */
@Composable
fun ContactCard(
    contact: Contact,
    currentUserId: String,
    isInviting: Boolean,
    isInvited: Boolean,
    onInvite: () -> Unit,
    onTogglePin: () -> Unit,
    onCardClick: () -> Unit,
    onMoreOptionsClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val displayName = contact.getVisibleName(currentUserId)
    val visibleRelationship = contact.getVisibleRelationship(currentUserId)
    val cardShape = RoundedCornerShape(20.dp)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .shadow(
                elevation = 8.dp,
                shape = cardShape,
                spotColor = DarkShadow,
                ambientColor = DarkShadow
            )
            .clip(cardShape)
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        RaisedCardSurface,
                        Color(0xFF1D1D24)
                    ),
                    start = Offset(0f, 0f),
                    end = Offset(300f, 300f)
                )
            )
            .border(
                width = 1.dp,
                brush = Brush.linearGradient(
                    colors = listOf(
                        LightShadow.copy(alpha = 0.5f),
                        Color.Transparent,
                        DarkShadow
                    ),
                    start = Offset(0f, 0f),
                    end = Offset(200f, 200f)
                ),
                shape = cardShape
            )
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                role = Role.Button,
                onClick = onCardClick
            )
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 1. Avatar with Status Indicator
            Box(
                modifier = Modifier.size(54.dp),
                contentAlignment = Alignment.BottomEnd
            ) {
                // Circular Avatar Container with initials / subtle gradient
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(
                                    Color(0xFF2E2B3D),
                                    Color(0xFF1E1C27)
                                )
                            )
                        )
                        .border(
                            width = 1.2.dp,
                            brush = Brush.sweepGradient(
                                listOf(
                                    PrimaryAccent.copy(alpha = 0.4f),
                                    SecondaryAccent.copy(alpha = 0.2f),
                                    PrimaryAccent.copy(alpha = 0.4f)
                                )
                            ),
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    val initials = displayName.take(2).uppercase().filter { it.isLetter() }.ifEmpty { "BT" }
                    Text(
                        text = initials,
                        color = PrimaryText,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Presence Dot (Online/Offline)
                OnlineIndicator(
                    isOnline = contact.isOnline,
                    size = 10.dp
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            // 2. Middle Content: Name, Status, Relationship
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = displayName,
                    color = PrimaryText,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(2.dp))

                Text(
                    text = if (contact.isOnline) "Online • ${contact.statusText}" else "Offline • ${contact.statusText}",
                    color = SecondaryText,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                if (visibleRelationship != null) {
                    Spacer(modifier = Modifier.height(6.dp))
                    RelationshipBadge(
                        relationship = visibleRelationship,
                        viewerUserId = currentUserId,
                        relationshipCreatorId = contact.relationshipCreatorId
                    )
                }
            }

            Spacer(modifier = Modifier.width(10.dp))

            // 3. Right Column: Pin/More Actions & Instant Invite Button
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.height(72.dp)
            ) {
                // Top Action Row (Pin & More Vert)
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    PinButton(
                        isPinned = contact.isPinned,
                        onTogglePin = onTogglePin
                    )

                    IconButton(
                        onClick = onMoreOptionsClick,
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.MoreVert,
                            contentDescription = "More options for $displayName",
                            tint = SecondaryText,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                // Bottom Action: Flagship One-Tap ⚡ Invite Button
                InstantInviteButton(
                    isInviting = isInviting,
                    isInvited = isInvited,
                    onInvite = onInvite
                )
            }
        }
    }
}

@Preview(name = "Contact Card")
@Composable
private fun ContactCardPreview() {
    BreakTimeTheme {
        Box(
            modifier = Modifier
                .background(Color(0xFF17171C))
                .padding(16.dp)
        ) {
            ContactCard(
                contact = Contact(
                    id = "1",
                    name = "Aisha Sen",
                    privateNickname = "My Moon 💜",
                    isOnline = true,
                    statusText = "Active now",
                    relationship = RelationshipType.LOVER,
                    isPinned = true
                ),
                currentUserId = "user1",
                isInviting = false,
                isInvited = false,
                onInvite = {},
                onTogglePin = {},
                onCardClick = {},
                onMoreOptionsClick = {}
            )
        }
    }
}
