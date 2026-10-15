package com.breaktime.app.ui.home.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.theme.BreakTimeTheme
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryPurpleGradient
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.SuccessColor

/**
 * The flagship BreakTime One-Tap Instant Invite Button.
 *
 * Provides immediate feedback:
 * - Idle: Radiant purple gradient "⚡ Invite"
 * - Loading: Spinner to prevent duplicate taps
 * - Invited: "✓ Sent" confirmation badge
 */
@Composable
fun InstantInviteButton(
    isInviting: Boolean,
    isInvited: Boolean,
    onInvite: () -> Unit,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed && !isInviting && !isInvited) 0.94f else 1f,
        label = "inviteScale"
    )

    val shape = RoundedCornerShape(20.dp)
    val buttonEnabled = !isInviting && !isInvited

    val backgroundBrush = if (isInvited) {
        androidx.compose.ui.graphics.Brush.horizontalGradient(
            colors = listOf(
                Color(0xFF1E3A2F),
                Color(0xFF1A4736)
            )
        )
    } else {
        PrimaryPurpleGradient
    }

    val glowColor = if (isInvited) SuccessColor.copy(alpha = 0.3f) else PrimaryAccent.copy(alpha = 0.45f)

    Box(
        modifier = modifier
            .scale(scale)
            .shadow(
                elevation = if (buttonEnabled) 8.dp else 2.dp,
                shape = shape,
                spotColor = glowColor,
                ambientColor = glowColor
            )
            .clip(shape)
            .background(backgroundBrush)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                enabled = buttonEnabled,
                role = Role.Button,
                onClick = onInvite
            )
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .semantics {
                contentDescription = when {
                    isInviting -> "Sending break invitation..."
                    isInvited -> "Invitation sent"
                    else -> "Send instant break invitation"
                }
            },
        contentAlignment = Alignment.Center
    ) {
        AnimatedContent(
            targetState = Triple(isInviting, isInvited, Unit),
            transitionSpec = { fadeIn() togetherWith fadeOut() },
            label = "inviteState"
        ) { (inviting, invited, _) ->
            when {
                inviting -> {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(14.dp),
                            color = PrimaryText,
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Sending...",
                            color = PrimaryText,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
                invited -> {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Check,
                            contentDescription = null,
                            tint = SuccessColor,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Sent",
                            color = SuccessColor,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
                else -> {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Bolt,
                            contentDescription = null,
                            tint = PrimaryText,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Invite",
                            color = PrimaryText,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.2.sp
                        )
                    }
                }
            }
        }
    }
}

@Preview(name = "Instant Invite States")
@Composable
private fun InstantInviteButtonPreview() {
    BreakTimeTheme {
        Row(modifier = Modifier.padding(16.dp)) {
            InstantInviteButton(isInviting = false, isInvited = false, onInvite = {})
            Spacer(modifier = Modifier.width(8.dp))
            InstantInviteButton(isInviting = true, isInvited = false, onInvite = {})
            Spacer(modifier = Modifier.width(8.dp))
            InstantInviteButton(isInviting = false, isInvited = true, onInvite = {})
        }
    }
}
