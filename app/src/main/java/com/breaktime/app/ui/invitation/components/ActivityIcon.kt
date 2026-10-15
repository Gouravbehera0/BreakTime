package com.breaktime.app.ui.invitation.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.domain.activity.ActivityIconType
import com.breaktime.app.domain.activity.BreakActivity
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.SecondaryAccent

/**
 * Atmospheric bespoke artwork for BreakTime activity spheres.
 * Draws luminous nocturnal visuals inside the glassmorphic selector.
 */
@Composable
fun ActivityIcon(
    activity: BreakActivity,
    modifier: Modifier = Modifier,
    size: Dp = 150.dp
) {
    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = this.size.width
            val h = this.size.height
            val center = Offset(w / 2f, h / 2f)

            when (activity.iconType) {
                ActivityIconType.NIGHT_RIDE -> {
                    // 1. Glowing Full Moon in background
                    val moonCenter = Offset(w * 0.68f, h * 0.32f)
                    val moonRadius = w * 0.16f
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(
                                Color(0xFFFFE4FF),
                                Color(0xFFD89BFF),
                                Color(0x33B45CFF),
                                Color.Transparent
                            ),
                            center = moonCenter,
                            radius = moonRadius * 1.8f
                        ),
                        radius = moonRadius * 1.8f,
                        center = moonCenter
                    )
                    drawCircle(
                        color = Color(0xFFE8D0FF),
                        radius = moonRadius,
                        center = moonCenter
                    )

                    // 2. City horizon silhouette at bottom
                    val cityPath = Path().apply {
                        moveTo(w * 0.15f, h * 0.70f)
                        lineTo(w * 0.25f, h * 0.70f)
                        lineTo(w * 0.25f, h * 0.62f)
                        lineTo(w * 0.35f, h * 0.62f)
                        lineTo(w * 0.35f, h * 0.66f)
                        lineTo(w * 0.45f, h * 0.66f)
                        lineTo(w * 0.45f, h * 0.58f)
                        lineTo(w * 0.58f, h * 0.58f)
                        lineTo(w * 0.58f, h * 0.68f)
                        lineTo(w * 0.72f, h * 0.68f)
                        lineTo(w * 0.72f, h * 0.60f)
                        lineTo(w * 0.85f, h * 0.60f)
                        lineTo(w * 0.85f, h * 0.72f)
                    }
                    drawPath(
                        path = cityPath,
                        brush = Brush.verticalGradient(
                            listOf(Color(0x55B45CFF), Color(0x22181523))
                        ),
                        style = Stroke(width = 1.5.dp.toPx())
                    )

                    // 3. Sleek Superbike Silhouette
                    // Rear wheel
                    drawCircle(
                        color = PrimaryAccent,
                        radius = w * 0.11f,
                        center = Offset(w * 0.30f, h * 0.68f),
                        style = Stroke(width = 4.dp.toPx())
                    )
                    drawCircle(
                        color = Color(0xFF1E1929),
                        radius = w * 0.08f,
                        center = Offset(w * 0.30f, h * 0.68f),
                        style = Fill
                    )

                    // Front wheel
                    drawCircle(
                        color = PrimaryAccent,
                        radius = w * 0.11f,
                        center = Offset(w * 0.70f, h * 0.68f),
                        style = Stroke(width = 4.dp.toPx())
                    )
                    drawCircle(
                        color = Color(0xFF1E1929),
                        radius = w * 0.08f,
                        center = Offset(w * 0.70f, h * 0.68f),
                        style = Fill
                    )

                    // Bike body / fairing
                    val bodyPath = Path().apply {
                        moveTo(w * 0.30f, h * 0.68f)
                        lineTo(w * 0.42f, h * 0.54f)
                        lineTo(w * 0.54f, h * 0.52f) // tank
                        lineTo(w * 0.66f, h * 0.46f) // windshield / visor
                        lineTo(w * 0.72f, h * 0.54f) // headlight nose
                        lineTo(w * 0.70f, h * 0.68f) // front axle
                        lineTo(w * 0.58f, h * 0.64f) // engine belly
                        lineTo(w * 0.44f, h * 0.66f) // swingarm
                        close()
                    }
                    drawPath(
                        path = bodyPath,
                        brush = Brush.horizontalGradient(
                            listOf(Color(0xFF2B2240), PrimaryAccent, SecondaryAccent)
                        ),
                        style = Fill
                    )

                    // Luminous headlight beam
                    val beamPath = Path().apply {
                        moveTo(w * 0.73f, h * 0.54f)
                        lineTo(w * 0.95f, h * 0.46f)
                        lineTo(w * 0.98f, h * 0.74f)
                        close()
                    }
                    drawPath(
                        path = beamPath,
                        brush = Brush.horizontalGradient(
                            listOf(
                                Color(0x8800FFFF),
                                Color(0x33B45CFF),
                                Color.Transparent
                            )
                        ),
                        style = Fill
                    )
                }

                ActivityIconType.EVENING_CHAI -> {
                    // Saucer
                    drawOval(
                        color = PrimaryAccent.copy(alpha = 0.5f),
                        topLeft = Offset(w * 0.20f, h * 0.72f),
                        size = Size(w * 0.60f, h * 0.12f),
                        style = Stroke(width = 2.5.dp.toPx())
                    )

                    // Cup Body
                    val cupPath = Path().apply {
                        moveTo(w * 0.28f, h * 0.46f)
                        lineTo(w * 0.72f, h * 0.46f)
                        cubicTo(
                            w * 0.72f, h * 0.68f,
                            w * 0.64f, h * 0.72f,
                            w * 0.50f, h * 0.72f
                        )
                        cubicTo(
                            w * 0.36f, h * 0.72f,
                            w * 0.28f, h * 0.68f,
                            w * 0.28f, h * 0.46f
                        )
                        close()
                    }
                    drawPath(
                        path = cupPath,
                        brush = Brush.verticalGradient(
                            listOf(PrimaryAccent, SecondaryAccent)
                        ),
                        style = Stroke(width = 3.dp.toPx())
                    )

                    // Handle
                    val handlePath = Path().apply {
                        moveTo(w * 0.71f, h * 0.50f)
                        cubicTo(
                            w * 0.86f, h * 0.50f,
                            w * 0.86f, h * 0.64f,
                            w * 0.68f, h * 0.64f
                        )
                    }
                    drawPath(
                        path = handlePath,
                        color = PrimaryAccent,
                        style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                    )

                    // Steaming wisps
                    val steamPath1 = Path().apply {
                        moveTo(w * 0.42f, h * 0.42f)
                        cubicTo(w * 0.38f, h * 0.32f, w * 0.46f, h * 0.26f, w * 0.40f, h * 0.18f)
                    }
                    drawPath(
                        path = steamPath1,
                        brush = Brush.verticalGradient(
                            listOf(Color.Transparent, Color(0xFFE8D0FF), Color.Transparent)
                        ),
                        style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round)
                    )

                    val steamPath2 = Path().apply {
                        moveTo(w * 0.54f, h * 0.40f)
                        cubicTo(w * 0.58f, h * 0.30f, w * 0.50f, h * 0.24f, w * 0.56f, h * 0.16f)
                    }
                    drawPath(
                        path = steamPath2,
                        brush = Brush.verticalGradient(
                            listOf(Color.Transparent, Color(0xFFF472B6), Color.Transparent)
                        ),
                        style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round)
                    )
                }

                ActivityIconType.SHOPPING -> {
                    // Shopping Bag
                    val bagPath = Path().apply {
                        moveTo(w * 0.28f, h * 0.38f)
                        lineTo(w * 0.72f, h * 0.38f)
                        lineTo(w * 0.76f, h * 0.78f)
                        lineTo(w * 0.24f, h * 0.78f)
                        close()
                    }
                    drawPath(
                        path = bagPath,
                        brush = Brush.linearGradient(
                            listOf(Color(0xFFE879F9), PrimaryAccent)
                        ),
                        style = Stroke(width = 3.dp.toPx())
                    )

                    // Bag handles
                    val handlePath = Path().apply {
                        moveTo(w * 0.42f, h * 0.38f)
                        cubicTo(w * 0.42f, h * 0.20f, w * 0.58f, h * 0.20f, w * 0.58f, h * 0.38f)
                    }
                    drawPath(
                        path = handlePath,
                        color = Color(0xFFF0ABFC),
                        style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                    )

                    // Center gift star
                    drawCircle(
                        color = Color(0xFFFFD166),
                        radius = 4.dp.toPx(),
                        center = Offset(w * 0.50f, h * 0.58f)
                    )
                }

                ActivityIconType.GAMING -> {
                    // Gamepad Body
                    val padPath = Path().apply {
                        moveTo(w * 0.24f, h * 0.46f)
                        cubicTo(w * 0.32f, h * 0.36f, w * 0.68f, h * 0.36f, w * 0.76f, h * 0.46f)
                        lineTo(w * 0.82f, h * 0.68f)
                        cubicTo(w * 0.78f, h * 0.76f, w * 0.68f, h * 0.70f, w * 0.62f, h * 0.60f)
                        lineTo(w * 0.38f, h * 0.60f)
                        cubicTo(w * 0.32f, h * 0.70f, w * 0.22f, h * 0.76f, w * 0.18f, h * 0.68f)
                        close()
                    }
                    drawPath(
                        path = padPath,
                        brush = Brush.horizontalGradient(
                            listOf(PrimaryAccent, SecondaryAccent)
                        ),
                        style = Stroke(width = 3.dp.toPx())
                    )

                    // D-Pad + Buttons
                    drawCircle(
                        color = Color(0xFF86EFAC),
                        radius = 4.dp.toPx(),
                        center = Offset(w * 0.70f, h * 0.48f)
                    )
                    drawCircle(
                        color = Color(0xFFF472B6),
                        radius = 4.dp.toPx(),
                        center = Offset(w * 0.66f, h * 0.54f)
                    )
                }

                ActivityIconType.KISS -> {
                    // Twin Neon Hearts
                    val heart1 = Path().apply {
                        moveTo(w * 0.44f, h * 0.44f)
                        cubicTo(w * 0.36f, h * 0.34f, w * 0.28f, h * 0.44f, w * 0.44f, h * 0.62f)
                        cubicTo(w * 0.60f, h * 0.44f, w * 0.52f, h * 0.34f, w * 0.44f, h * 0.44f)
                    }
                    drawPath(
                        path = heart1,
                        brush = Brush.linearGradient(
                            listOf(Color(0xFFFF70A6), PrimaryAccent)
                        ),
                        style = Fill
                    )

                    val heart2 = Path().apply {
                        moveTo(w * 0.62f, h * 0.36f)
                        cubicTo(w * 0.56f, h * 0.28f, w * 0.50f, h * 0.36f, w * 0.62f, h * 0.50f)
                        cubicTo(w * 0.74f, h * 0.36f, w * 0.68f, h * 0.28f, w * 0.62f, h * 0.36f)
                    }
                    drawPath(
                        path = heart2,
                        brush = Brush.linearGradient(
                            listOf(Color(0xFFFF9770), Color(0xFFFF70A6))
                        ),
                        style = Stroke(width = 2.dp.toPx())
                    )
                }

                ActivityIconType.CUDDLE -> {
                    // Crescent Moon & Glow
                    val moonPath = Path().apply {
                        moveTo(w * 0.50f, h * 0.26f)
                        cubicTo(w * 0.32f, h * 0.34f, w * 0.32f, h * 0.66f, w * 0.50f, h * 0.74f)
                        cubicTo(w * 0.38f, h * 0.64f, w * 0.38f, h * 0.36f, w * 0.50f, h * 0.26f)
                        close()
                    }
                    drawPath(
                        path = moonPath,
                        brush = Brush.linearGradient(
                            listOf(Color(0xFFFDE68A), Color(0xFFC084FC))
                        ),
                        style = Fill
                    )

                    // Cozy Star
                    drawCircle(
                        color = Color(0xFFFFE4E6),
                        radius = 4.dp.toPx(),
                        center = Offset(w * 0.64f, h * 0.46f)
                    )
                }

                ActivityIconType.MOVIE_NIGHT -> {
                    // Movie Clapper / Screen
                    drawRoundRect(
                        brush = Brush.verticalGradient(
                            listOf(PrimaryAccent, SecondaryAccent)
                        ),
                        topLeft = Offset(w * 0.26f, h * 0.36f),
                        size = Size(w * 0.48f, h * 0.38f),
                        cornerRadius = CornerRadius(8.dp.toPx(), 8.dp.toPx()),
                        style = Stroke(width = 2.5.dp.toPx())
                    )
                    // Play triangle
                    val playPath = Path().apply {
                        moveTo(w * 0.46f, h * 0.48f)
                        lineTo(w * 0.58f, h * 0.55f)
                        lineTo(w * 0.46f, h * 0.62f)
                        close()
                    }
                    drawPath(
                        path = playPath,
                        color = Color(0xFFFDE68A),
                        style = Fill
                    )
                }

                ActivityIconType.FOOD -> {
                    // Bowl
                    val bowlPath = Path().apply {
                        moveTo(w * 0.25f, h * 0.48f)
                        lineTo(w * 0.75f, h * 0.48f)
                        cubicTo(
                            w * 0.72f, h * 0.72f,
                            w * 0.28f, h * 0.72f,
                            w * 0.25f, h * 0.48f
                        )
                        close()
                    }
                    drawPath(
                        path = bowlPath,
                        brush = Brush.horizontalGradient(
                            listOf(Color(0xFFF59E0B), PrimaryAccent)
                        ),
                        style = Stroke(width = 3.dp.toPx())
                    )

                    // Chopsticks
                    drawLine(
                        color = Color(0xFFFDE68A),
                        start = Offset(w * 0.28f, h * 0.32f),
                        end = Offset(w * 0.76f, h * 0.56f),
                        strokeWidth = 2.dp.toPx(),
                        cap = StrokeCap.Round
                    )
                }

                ActivityIconType.DRINKING -> {
                    // Clinking cocktail glasses
                    val glass1 = Path().apply {
                        moveTo(w * 0.32f, h * 0.36f)
                        lineTo(w * 0.48f, h * 0.36f)
                        lineTo(w * 0.40f, h * 0.56f)
                        lineTo(w * 0.40f, h * 0.70f)
                    }
                    drawPath(
                        path = glass1,
                        brush = Brush.verticalGradient(
                            listOf(Color(0xFF38BDF8), PrimaryAccent)
                        ),
                        style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round)
                    )

                    val glass2 = Path().apply {
                        moveTo(w * 0.68f, h * 0.36f)
                        lineTo(w * 0.52f, h * 0.36f)
                        lineTo(w * 0.60f, h * 0.56f)
                        lineTo(w * 0.60f, h * 0.70f)
                    }
                    drawPath(
                        path = glass2,
                        brush = Brush.verticalGradient(
                            listOf(Color(0xFFEC4899), PrimaryAccent)
                        ),
                        style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round)
                    )
                }

                ActivityIconType.WALKING -> {
                    // Horizon trail under stars
                    val trail = Path().apply {
                        moveTo(w * 0.20f, h * 0.76f)
                        cubicTo(w * 0.40f, h * 0.64f, w * 0.60f, h * 0.54f, w * 0.80f, h * 0.44f)
                    }
                    drawPath(
                        path = trail,
                        brush = Brush.linearGradient(
                            listOf(PrimaryAccent, Color(0xFF86EFAC))
                        ),
                        style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                    )
                    drawCircle(
                        color = Color.White,
                        radius = 3.dp.toPx(),
                        center = Offset(w * 0.78f, h * 0.40f)
                    )
                }

                ActivityIconType.SMOKING_BREAK -> {
                    // Cigarette & Smoke
                    drawLine(
                        color = Color.White,
                        start = Offset(w * 0.28f, h * 0.62f),
                        end = Offset(w * 0.66f, h * 0.52f),
                        strokeWidth = 4.dp.toPx(),
                        cap = StrokeCap.Round
                    )
                    drawCircle(
                        color = Color(0xFFEF4444), // glowing cherry
                        radius = 3.5.dp.toPx(),
                        center = Offset(w * 0.66f, h * 0.52f)
                    )
                    // Curling smoke
                    val smoke = Path().apply {
                        moveTo(w * 0.68f, h * 0.50f)
                        cubicTo(w * 0.74f, h * 0.40f, w * 0.62f, h * 0.34f, w * 0.70f, h * 0.22f)
                    }
                    drawPath(
                        path = smoke,
                        brush = Brush.verticalGradient(
                            listOf(Color(0xFFD8B4FE), Color.Transparent)
                        ),
                        style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round)
                    )
                }

                ActivityIconType.CUSTOM -> {
                    // Magic Sparkle / Star + Plus
                    drawCircle(
                        color = PrimaryAccent,
                        radius = w * 0.20f,
                        center = center,
                        style = Stroke(width = 2.dp.toPx())
                    )
                    // Plus sign
                    drawLine(
                        color = Color(0xFFF5F3FA),
                        start = Offset(center.x - 14.dp.toPx(), center.y),
                        end = Offset(center.x + 14.dp.toPx(), center.y),
                        strokeWidth = 3.dp.toPx(),
                        cap = StrokeCap.Round
                    )
                    drawLine(
                        color = Color(0xFFF5F3FA),
                        start = Offset(center.x, center.y - 14.dp.toPx()),
                        end = Offset(center.x, center.y + 14.dp.toPx()),
                        strokeWidth = 3.dp.toPx(),
                        cap = StrokeCap.Round
                    )
                }
            }
        }

        // Overlay emoji accent
        Text(
            text = activity.emoji,
            fontSize = 20.sp,
            modifier = Modifier.align(Alignment.TopEnd)
        )
    }
}
