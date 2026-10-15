package com.breaktime.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.breaktime.app.ui.theme.CheckboxShape
import com.breaktime.app.ui.theme.InputBackground
import com.breaktime.app.ui.theme.InputBorder
import com.breaktime.app.ui.theme.PrimaryAccent

/**
 * Reusable Neomorphic Checkbox with smooth animated state transitions.
 */
@Composable
fun NeomorphicCheckbox(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    content: (@Composable () -> Unit)? = null
) {
    val interactionSource = remember { MutableInteractionSource() }

    val backgroundColor by animateColorAsState(
        targetValue = if (checked) PrimaryAccent else InputBackground,
        label = "checkboxBg"
    )

    val borderColor by animateColorAsState(
        targetValue = if (checked) PrimaryAccent else InputBorder,
        label = "checkboxBorder"
    )

    Row(
        modifier = modifier.clickable(
            interactionSource = interactionSource,
            indication = null,
            role = Role.Checkbox,
            onClick = { onCheckedChange(!checked) }
        ),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(20.dp)
                .clip(CheckboxShape)
                .background(backgroundColor)
                .border(width = 1.dp, color = borderColor, shape = CheckboxShape),
            contentAlignment = Alignment.Center
        ) {
            if (checked) {
                Icon(
                    imageVector = Icons.Filled.Check,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(14.dp)
                )
            }
        }

        if (content != null) {
            Spacer(modifier = Modifier.width(10.dp))
            content()
        }
    }
}
