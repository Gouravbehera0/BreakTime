package com.breaktime.app.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.SecondaryText

/**
 * Reusable password visibility toggle icon button.
 */
@Composable
fun PasswordVisibilityToggle(
    visible: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .size(48.dp)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onToggle
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = if (visible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
            contentDescription = if (visible) "Hide password" else "Show password",
            tint = if (visible) PrimaryAccent else SecondaryText,
            modifier = Modifier.size(20.dp)
        )
    }
}
