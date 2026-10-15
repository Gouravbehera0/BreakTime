package com.breaktime.app.ui.home.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.breaktime.app.ui.theme.BreakTimeTheme
import com.breaktime.app.ui.theme.OfflineIndicatorColor
import com.breaktime.app.ui.theme.PrimaryAccent

/**
 * Quick-action pin button allowing the user to pin or unpin favourite people.
 * Uses the bell/pin icon matching the BreakTime dashboard design.
 */
@Composable
fun PinButton(
    isPinned: Boolean,
    onTogglePin: () -> Unit,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val tintColor by animateColorAsState(
        targetValue = if (isPinned) PrimaryAccent else OfflineIndicatorColor,
        animationSpec = spring(),
        label = "pinTint"
    )

    val label = if (isPinned) "Unpin contact" else "Pin contact"

    Box(
        modifier = modifier
            .size(36.dp)
            .clip(CircleShape)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                role = Role.Button,
                onClick = onTogglePin
            )
            .semantics { contentDescription = label },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = if (isPinned) Icons.Filled.Notifications else Icons.Outlined.Notifications,
            contentDescription = label,
            tint = tintColor,
            modifier = Modifier.size(19.dp)
        )
    }
}

@Preview(name = "Pin Button")
@Composable
private fun PinButtonPreview() {
    BreakTimeTheme {
        PinButton(isPinned = true, onTogglePin = {})
    }
}
