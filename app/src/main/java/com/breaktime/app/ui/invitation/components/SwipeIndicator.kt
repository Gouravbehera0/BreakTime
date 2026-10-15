package com.breaktime.app.ui.invitation.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.breaktime.app.ui.theme.PrimaryAccent

/**
 * Capsule carousel indicator dots reflecting the active activity index in the swipe sequence.
 */
@Composable
fun SwipeIndicator(
    totalCount: Int,
    selectedIndex: Int,
    modifier: Modifier = Modifier
) {
    if (totalCount <= 1) return

    // Show up to 7 dots comfortably
    val visibleCount = minOf(totalCount, 7)

    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        for (i in 0 until visibleCount) {
            val isSelected = (selectedIndex % visibleCount) == i

            val width by animateDpAsState(
                targetValue = if (isSelected) 22.dp else 7.dp,
                animationSpec = spring(),
                label = "indicatorWidth"
            )

            val color by animateColorAsState(
                targetValue = if (isSelected) PrimaryAccent else Color.White.copy(alpha = 0.20f),
                label = "indicatorColor"
            )

            Box(
                modifier = Modifier
                    .height(6.dp)
                    .width(width)
                    .clip(CircleShape)
                    .background(color)
            )
        }
    }
}
