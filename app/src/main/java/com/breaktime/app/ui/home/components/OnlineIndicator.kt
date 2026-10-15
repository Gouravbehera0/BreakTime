package com.breaktime.app.ui.home.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.breaktime.app.ui.theme.BreakTimeTheme
import com.breaktime.app.ui.theme.MainBackground
import com.breaktime.app.ui.theme.OfflineIndicatorColor
import com.breaktime.app.ui.theme.OnlineIndicatorColor

/**
 * Clean circular presence status indicator dot.
 * Displays green (#86EFAC) when online and subtle charcoal (#777581) when offline,
 * encased in a dark border ring for high contrast separation against avatar surfaces.
 */
@Composable
fun OnlineIndicator(
    isOnline: Boolean,
    modifier: Modifier = Modifier,
    size: Dp = 10.dp
) {
    val indicatorColor = if (isOnline) OnlineIndicatorColor else OfflineIndicatorColor
    val description = if (isOnline) "Online" else "Offline"

    Box(
        modifier = modifier
            .size(size + 4.dp) // accommodate border
            .clip(CircleShape)
            .background(MainBackground)
            .semantics { contentDescription = description }
            .border(width = 2.dp, color = MainBackground, shape = CircleShape)
    ) {
        Box(
            modifier = Modifier
                .size(size)
                .clip(CircleShape)
                .background(indicatorColor)
                .then(
                    if (isOnline) {
                        Modifier.shadow(
                            elevation = 4.dp,
                            shape = CircleShape,
                            spotColor = OnlineIndicatorColor,
                            ambientColor = OnlineIndicatorColor
                        )
                    } else Modifier
                )
        )
    }
}

@Preview(name = "Online Indicator")
@Composable
private fun OnlineIndicatorPreview() {
    BreakTimeTheme {
        OnlineIndicator(isOnline = true)
    }
}

@Preview(name = "Offline Indicator")
@Composable
private fun OfflineIndicatorPreview() {
    BreakTimeTheme {
        OnlineIndicator(isOnline = false)
    }
}
