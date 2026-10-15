package com.breaktime.app.ui.invitation.components

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
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Icon
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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.ui.home.components.OnlineIndicator
import com.breaktime.app.ui.home.components.RelationshipBadge
import com.breaktime.app.ui.theme.DarkShadow
import com.breaktime.app.ui.theme.LightShadow
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryAccent
import com.breaktime.app.ui.theme.SecondaryText

/**
 * Top branding header and Recipient card for the Swipe Invitation Dashboard.
 */
@Composable
fun RecipientHeader(
    contact: Contact,
    currentUserId: String,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val displayName = contact.getVisibleName(currentUserId)
    val visibleRelationship = contact.getVisibleRelationship(currentUserId)
    val cardShape = RoundedCornerShape(24.dp)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
    ) {
        // 1. TOP MINIMAL BRAND HEADER WITH BACK BUTTON
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp)
        ) {
            // Circular Back Button on Left
            Box(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .size(42.dp)
                    .shadow(
                        elevation = 6.dp,
                        shape = CircleShape,
                        spotColor = DarkShadow,
                        ambientColor = DarkShadow
                    )
                    .clip(CircleShape)
                    .background(RaisedCardSurface)
                    .border(
                        width = 1.dp,
                        brush = Brush.linearGradient(
                            listOf(LightShadow.copy(alpha = 0.5f), Color.Transparent, DarkShadow)
                        ),
                        shape = CircleShape
                    )
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        role = Role.Button,
                        onClick = onNavigateBack
                    )
                    .semantics { contentDescription = "Go back to dashboard" },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Outlined.ArrowBack,
                    contentDescription = null,
                    tint = PrimaryText,
                    modifier = Modifier.size(20.dp)
                )
            }

            // Center Branding
            Column(
                modifier = Modifier.align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = buildAnnotatedString {
                            withStyle(
                                SpanStyle(
                                    color = PrimaryText,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 22.sp,
                                    letterSpacing = (-0.4).sp
                                )
                            ) {
                                append("Break")
                            }
                            withStyle(
                                SpanStyle(
                                    color = PrimaryAccent,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 22.sp,
                                    letterSpacing = (-0.4).sp
                                )
                            ) {
                                append("Time")
                            }
                        }
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "🌙", fontSize = 16.sp)
                }

                Spacer(modifier = Modifier.height(2.dp))

                Text(
                    text = "Pause the World. Live the Moment.",
                    color = SecondaryText,
                    fontSize = 11.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // 2. RECIPIENT CARD
        Box(
            modifier = Modifier
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
                            Color(0xFF1B1B22)
                        ),
                        start = Offset(0f, 0f),
                        end = Offset(300f, 300f)
                    )
                )
                .border(
                    width = 1.dp,
                    color = LightShadow.copy(alpha = 0.4f),
                    shape = cardShape
                )
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Avatar with Presence Status Dot
                Box(
                    modifier = Modifier.size(56.dp),
                    contentAlignment = Alignment.BottomEnd
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(
                                    listOf(Color(0xFF2C243B), Color(0xFF1D1826))
                                )
                            )
                            .border(
                                width = 1.5.dp,
                                brush = Brush.sweepGradient(
                                    listOf(PrimaryAccent, SecondaryAccent, PrimaryAccent)
                                ),
                                shape = CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        val initials = displayName.take(2).uppercase().filter { it.isLetter() }.ifEmpty { "BT" }
                        Text(
                            text = initials,
                            color = PrimaryText,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    OnlineIndicator(
                        isOnline = contact.isOnline,
                        size = 11.dp
                    )
                }

                Spacer(modifier = Modifier.width(14.dp))

                // Recipient Info
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = "Inviting",
                        color = SecondaryText,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Normal
                    )

                    Spacer(modifier = Modifier.height(2.dp))

                    Text(
                        text = displayName,
                        color = PrimaryText,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    Spacer(modifier = Modifier.height(2.dp))

                    Text(
                        text = if (contact.isOnline) "Online • Usually active" else "Offline • ${contact.statusText}",
                        color = SecondaryText,
                        fontSize = 12.sp
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
            }
        }
    }
}
