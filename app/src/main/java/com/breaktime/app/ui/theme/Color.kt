package com.breaktime.app.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// ==================================================
// MIDNIGHT NEOMORPHISM COLOR PALETTE
// ==================================================

val MainBackground = Color(0xFF17171C)
val SecondaryBackground = Color(0xFF1C1C23)
val RaisedCardSurface = Color(0xFF202027)
val DarkShadow = Color(0xFF101014)
val LightShadow = Color(0xFF30303A)

val PrimaryAccent = Color(0xFFB45CFF)
val SecondaryAccent = Color(0xFF8B5CF6)

val PrimaryText = Color(0xFFF5F3FA)
val SecondaryText = Color(0xFFA5A0B5)

val InputBackground = Color(0xFF1B1B22)
val InputBorder = Color(0xFF34313D)
val InputFocusedBorder = Color(0xFF9E65FF)

val ErrorColor = Color(0xFFFF6B81)
val SuccessColor = Color(0xFF86EFAC)

val OnlineIndicatorColor = Color(0xFF86EFAC)
val OfflineIndicatorColor = Color(0xFF777581)

val GlassSurfaceColor = Color(0xE61C1C23)
val GlassBorderColor = Color(0x33B45CFF)

val DividerColor = Color(0xFF282833)
val PlaceholderColor = Color(0xFF635E74)
val SubtleBorderColor = Color(0xFF2C2C38)

// Gradients
val PrimaryPurpleGradient = Brush.horizontalGradient(
    colors = listOf(
        SecondaryAccent, // #8B5CF6
        PrimaryAccent    // #B45CFF
    )
)

val GlowPurpleGradient = Brush.radialGradient(
    colors = listOf(
        PrimaryAccent.copy(alpha = 0.35f),
        SecondaryAccent.copy(alpha = 0.15f),
        Color.Transparent
    )
)

val SubtleSurfaceGradient = Brush.verticalGradient(
    colors = listOf(
        Color(0xFF22222A),
        Color(0xFF1C1C23)
    )
)
