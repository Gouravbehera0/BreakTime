package com.breaktime.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.breaktime.app.ui.theme.CardShape
import com.breaktime.app.ui.theme.DarkShadow
import com.breaktime.app.ui.theme.LightShadow
import com.breaktime.app.ui.theme.RaisedCardSurface

/**
 * Reusable NeomorphicCard providing the raised midnight surface:
 * - Subtle dual border highlight (light top-left, dark bottom-right)
 * - Soft dark elevation shadow
 * - Elegant rounded corners
 */
@Composable
fun NeomorphicCard(
    modifier: Modifier = Modifier,
    shape: Shape = CardShape,
    elevation: Dp = 8.dp,
    backgroundColor: Color = RaisedCardSurface,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .shadow(
                elevation = elevation,
                shape = shape,
                spotColor = DarkShadow,
                ambientColor = DarkShadow
            )
            .clip(shape)
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        backgroundColor,
                        backgroundColor.copy(alpha = 0.92f)
                    ),
                    start = Offset(0f, 0f),
                    end = Offset(200f, 200f)
                )
            )
            .border(
                width = 1.dp,
                brush = Brush.linearGradient(
                    colors = listOf(
                        LightShadow,
                        Color.Transparent,
                        DarkShadow
                    ),
                    start = Offset(0f, 0f),
                    end = Offset(100f, 100f)
                ),
                shape = shape
            ),
        content = content
    )
}
