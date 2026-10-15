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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
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
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.theme.BreakTimeTheme
import com.breaktime.app.ui.theme.DarkShadow
import com.breaktime.app.ui.theme.LightShadow
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryAccent
import com.breaktime.app.ui.theme.SecondaryText

/**
 * Top brand header for the BreakTime Dashboard:
 * - Stylized BreakTime brand title with celestial crescent moon
 * - Tagline: "Pause the World. Live the Moment."
 * - Circular neomorphic notification bell with unread indicator badge
 * - Profile avatar button with radiant purple rim
 */
@Composable
fun BreakTimeHeader(
    onNotificationClick: () -> Unit,
    onProfileClick: () -> Unit,
    hasUnreadNotifications: Boolean = true,
    userName: String = "User",
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Left Column: Brand Title & Subtitle
        Column {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = buildAnnotatedString {
                        withStyle(
                            SpanStyle(
                                color = PrimaryText,
                                fontWeight = FontWeight.Bold,
                                fontSize = 24.sp,
                                letterSpacing = (-0.4).sp
                            )
                        ) {
                            append("Break")
                        }
                        withStyle(
                            SpanStyle(
                                color = PrimaryAccent,
                                fontWeight = FontWeight.Bold,
                                fontSize = 24.sp,
                                letterSpacing = (-0.4).sp
                            )
                        ) {
                            append("Time")
                        }
                    }
                )

                Spacer(modifier = Modifier.width(6.dp))

                // Purple Crescent Moon Icon
                Text(
                    text = "🌙",
                    fontSize = 18.sp
                )
            }

            Spacer(modifier = Modifier.height(3.dp))

            Text(
                text = "Pause the World. Live the Moment.",
                color = SecondaryText,
                fontSize = 12.sp,
                fontWeight = FontWeight.Normal,
                letterSpacing = 0.2.sp
            )
        }

        // Right Actions: Notification Bell + Profile Avatar
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Notification Bell Button
            Box(
                modifier = Modifier
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
                            listOf(LightShadow.copy(alpha = 0.5f), Color.Transparent, DarkShadow),
                            start = Offset(0f, 0f),
                            end = Offset(40f, 40f)
                        ),
                        shape = CircleShape
                    )
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        role = Role.Button,
                        onClick = onNotificationClick
                    )
                    .semantics { contentDescription = "View notifications" },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Outlined.Notifications,
                    contentDescription = null,
                    tint = PrimaryText,
                    modifier = Modifier.size(20.dp)
                )

                if (hasUnreadNotifications) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .align(Alignment.TopEnd)
                            .padding(top = 10.dp, end = 10.dp)
                            .clip(CircleShape)
                            .background(PrimaryAccent)
                            .border(width = 1.5.dp, color = RaisedCardSurface, shape = CircleShape)
                    )
                }
            }

            // Profile Avatar Button
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .shadow(
                        elevation = 6.dp,
                        shape = CircleShape,
                        spotColor = DarkShadow,
                        ambientColor = DarkShadow
                    )
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                Color(0xFF2C253B),
                                Color(0xFF1B1824)
                            )
                        )
                    )
                    .border(
                        width = 1.5.dp,
                        brush = Brush.sweepGradient(
                            listOf(
                                PrimaryAccent,
                                SecondaryAccent,
                                PrimaryAccent
                            )
                        ),
                        shape = CircleShape
                    )
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        role = Role.Button,
                        onClick = onProfileClick
                    )
                    .semantics { contentDescription = "User profile for $userName" },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Outlined.Person,
                    contentDescription = null,
                    tint = PrimaryText,
                    modifier = Modifier.size(22.dp)
                )
            }
        }
    }
}

@Preview(name = "BreakTime Header")
@Composable
private fun BreakTimeHeaderPreview() {
    BreakTimeTheme {
        Box(modifier = Modifier.background(Color(0xFF17171C))) {
            BreakTimeHeader(
                onNotificationClick = {},
                onProfileClick = {},
                hasUnreadNotifications = true
            )
        }
    }
}
