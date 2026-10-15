package com.breaktime.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val MidnightColorScheme = darkColorScheme(
    primary = PrimaryAccent,
    onPrimary = PrimaryText,
    primaryContainer = SecondaryAccent,
    onPrimaryContainer = PrimaryText,
    secondary = SecondaryAccent,
    onSecondary = PrimaryText,
    background = MainBackground,
    onBackground = PrimaryText,
    surface = RaisedCardSurface,
    onSurface = PrimaryText,
    surfaceVariant = SecondaryBackground,
    onSurfaceVariant = SecondaryText,
    outline = InputBorder,
    outlineVariant = SubtleBorderColor,
    error = ErrorColor,
    onError = MainBackground
)

@Composable
fun BreakTimeTheme(
    content: @Composable () -> Unit
) {
    // BreakTime strictly maintains its Midnight Neomorphism aesthetic
    // regardless of system dark/light mode preference.
    val colorScheme = MidnightColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            val insetsController = WindowCompat.getInsetsController(window, view)
            insetsController.isAppearanceLightStatusBars = false
            insetsController.isAppearanceLightNavigationBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = BreakTimeShapes,
        content = content
    )
}
