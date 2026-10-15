package com.breaktime.app.ui.invitation.components

import androidx.compose.animation.AnimatedContent
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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryPurpleGradient
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.SuccessColor

/**
 * Flagship full-width invitation button dispatching an activity invite.
 *
 * Rules:
 * - Only tapping this button initiates an invitation dispatch.
 * - Swiping or selecting an activity never sends invitations or notifications.
 * - Loading indicator prevents duplicate in-flight submissions.
 */
@Composable
fun SendInvitationButton(
    activityTitle: String,
    isLoading: Boolean,
    isSuccess: Boolean,
    onSendClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed && !isLoading && !isSuccess) 0.97f else 1f,
        label = "sendButtonScale"
    )

    val shape = RoundedCornerShape(28.dp)
    val enabled = !isLoading && !isSuccess

    val backgroundBrush = if (isSuccess) {
        androidx.compose.ui.graphics.Brush.horizontalGradient(
            listOf(Color(0xFF1E3A2F), Color(0xFF1A4736))
        )
    } else {
        PrimaryPurpleGradient
    }

    val glowColor = if (isSuccess) SuccessColor.copy(alpha = 0.35f) else PrimaryAccent.copy(alpha = 0.5f)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .scale(scale)
            .shadow(
                elevation = if (enabled) 14.dp else 2.dp,
                shape = shape,
                spotColor = glowColor,
                ambientColor = glowColor
            )
            .clip(shape)
            .background(backgroundBrush)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                enabled = enabled,
                role = Role.Button,
                onClick = onSendClick
            )
            .padding(horizontal = 24.dp)
            .semantics {
                contentDescription = when {
                    isLoading -> "Sending invitation for $activityTitle..."
                    isSuccess -> "Invitation for $activityTitle sent successfully"
                    else -> "Send invitation for $activityTitle"
                }
            },
        contentAlignment = Alignment.Center
    ) {
        AnimatedContent(
            targetState = Pair(isLoading, isSuccess),
            transitionSpec = { fadeIn() togetherWith fadeOut() },
            label = "sendButtonState"
        ) { (loading, success) ->
            when {
                loading -> {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CircularProgressIndicator(
                            color = PrimaryText,
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Sending Invitation...",
                            color = PrimaryText,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
                success -> {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.Check,
                            contentDescription = null,
                            tint = SuccessColor,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "INVITATION SENT",
                            color = SuccessColor,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.8.sp
                        )
                    }
                }
                else -> {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.Bolt,
                            contentDescription = null,
                            tint = PrimaryText,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "SEND INVITATION",
                            color = PrimaryText,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.8.sp
                        )
                    }
                }
            }
        }
    }
}
