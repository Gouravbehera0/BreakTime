package com.breaktime.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import com.breaktime.app.ui.theme.MainBackground
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.SecondaryAccent

/**
 * Ambient background implementing the Midnight Neomorphism aesthetic:
 * - Deep midnight charcoal canvas (#17171C)
 * - Upper purple ambient glow and subtle celestial orbs
 * - Bottom cosmic horizon curve with gentle purple edge
 */
@Composable
fun AmbientBackground(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MainBackground)
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height

            // 1. Upper central ambient glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        PrimaryAccent.copy(alpha = 0.18f),
                        SecondaryAccent.copy(alpha = 0.08f),
                        Color.Transparent
                    ),
                    center = Offset(width * 0.5f, height * 0.14f),
                    radius = width * 0.75f
                ),
                radius = width * 0.75f,
                center = Offset(width * 0.5f, height * 0.14f)
            )

            // 2. Right background planetary orb (subtle dark raised curvature)
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        Color(0xFF262632).copy(alpha = 0.6f),
                        Color(0xFF1E1E26).copy(alpha = 0.3f),
                        Color.Transparent
                    ),
                    center = Offset(width * 0.95f, height * 0.18f),
                    radius = width * 0.38f
                ),
                radius = width * 0.38f,
                center = Offset(width * 0.95f, height * 0.18f)
            )

            // Subtle rim on right orb
            drawArc(
                brush = Brush.sweepGradient(
                    listOf(
                        PrimaryAccent.copy(alpha = 0.25f),
                        Color.Transparent,
                        Color.Transparent
                    ),
                    center = Offset(width * 0.95f, height * 0.18f)
                ),
                startAngle = 140f,
                sweepAngle = 100f,
                useCenter = false,
                topLeft = Offset(width * 0.95f - width * 0.38f, height * 0.18f - width * 0.38f),
                size = androidx.compose.ui.geometry.Size(width * 0.76f, width * 0.76f),
                style = Stroke(width = 1.5f)
            )

            // 3. Left background subtle dark orb
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        Color(0xFF22222B).copy(alpha = 0.4f),
                        Color(0xFF191920).copy(alpha = 0.15f),
                        Color.Transparent
                    ),
                    center = Offset(width * 0.05f, height * 0.22f),
                    radius = width * 0.35f
                ),
                radius = width * 0.35f,
                center = Offset(width * 0.05f, height * 0.22f)
            )

            // 4. Bottom cosmic horizon silhouette
            val horizonPath = Path().apply {
                moveTo(0f, height * 0.90f)
                cubicTo(
                    width * 0.25f, height * 0.88f,
                    width * 0.65f, height * 0.93f,
                    width, height * 0.89f
                )
                lineTo(width, height)
                lineTo(0f, height)
                close()
            }

            drawPath(
                path = horizonPath,
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF1B1A24),
                        Color(0xFF121217)
                    )
                ),
                style = Fill
            )

            // Subtle purple crest line on the horizon
            val crestPath = Path().apply {
                moveTo(0f, height * 0.90f)
                cubicTo(
                    width * 0.25f, height * 0.88f,
                    width * 0.65f, height * 0.93f,
                    width, height * 0.89f
                )
            }
            drawPath(
                path = crestPath,
                brush = Brush.horizontalGradient(
                    colors = listOf(
                        Color.Transparent,
                        PrimaryAccent.copy(alpha = 0.35f),
                        SecondaryAccent.copy(alpha = 0.45f),
                        Color.Transparent
                    )
                ),
                style = Stroke(width = 2f)
            )

            // Bottom cosmic glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        PrimaryAccent.copy(alpha = 0.15f),
                        Color.Transparent
                    ),
                    center = Offset(width * 0.35f, height * 0.91f),
                    radius = width * 0.45f
                ),
                radius = width * 0.45f,
                center = Offset(width * 0.35f, height * 0.91f)
            )
        }

        content()
    }
}
