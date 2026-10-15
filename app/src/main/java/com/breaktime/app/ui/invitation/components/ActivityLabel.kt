package com.breaktime.app.ui.invitation.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.domain.activity.BreakActivity
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.SecondaryBackground
import com.breaktime.app.ui.theme.SecondaryText
import com.breaktime.app.ui.theme.SubtleBorderColor

/**
 * Animated activity title, subtitle, and metadata tags displayed beneath the circular selector.
 */
@Composable
fun ActivityLabel(
    activity: BreakActivity,
    onEditCustomActivity: () -> Unit,
    modifier: Modifier = Modifier
) {
    val pillShape = RoundedCornerShape(16.dp)

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AnimatedContent(
            targetState = activity,
            transitionSpec = {
                (slideInVertically { height -> height / 2 } + fadeIn()) togetherWith
                        (slideOutVertically { height -> -height / 2 } + fadeOut())
            },
            label = "activityLabelAnim"
        ) { targetActivity ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Activity Title
                Text(
                    text = targetActivity.title,
                    color = PrimaryText,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Activity Subtitle
                Text(
                    text = targetActivity.subtitle,
                    color = SecondaryText,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Normal,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Metadata Pill Tag
                Box(
                    modifier = Modifier
                        .clip(pillShape)
                        .background(SecondaryBackground)
                        .border(width = 0.8.dp, color = SubtleBorderColor, shape = pillShape)
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        val firstTag = targetActivity.tags.getOrNull(0) ?: "Just the two of us"
                        val secondTag = targetActivity.tags.getOrNull(1) ?: "Anywhere nearby"

                        Icon(
                            imageVector = Icons.Outlined.Groups,
                            contentDescription = null,
                            tint = SecondaryText,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = firstTag,
                            color = PrimaryText.copy(alpha = 0.85f),
                            fontSize = 12.sp
                        )

                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "|",
                            color = SecondaryText.copy(alpha = 0.4f),
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.width(10.dp))

                        Icon(
                            imageVector = Icons.Outlined.Place,
                            contentDescription = null,
                            tint = SecondaryText,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = secondTag,
                            color = PrimaryText.copy(alpha = 0.85f),
                            fontSize = 12.sp
                        )
                    }
                }

                // If custom activity, allow editing
                if (targetActivity.isCustom) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null,
                                role = Role.Button,
                                onClick = onEditCustomActivity
                            )
                            .padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Edit,
                            contentDescription = "Edit activity",
                            tint = PrimaryAccent,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Customize activity details",
                            color = PrimaryAccent,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Understated swipe hint
        Text(
            text = "Swipe to change",
            color = SecondaryText.copy(alpha = 0.6f),
            fontSize = 11.sp,
            letterSpacing = 0.4.sp
        )
    }
}
