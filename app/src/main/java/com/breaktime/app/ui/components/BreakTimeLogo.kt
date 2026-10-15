package com.breaktime.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.theme.DarkShadow
import com.breaktime.app.ui.theme.LightShadow
import com.breaktime.app.ui.theme.LogoShape
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryAccent
import com.breaktime.app.ui.theme.SecondaryText

/**
 * The official BreakTime brand logo & header component:
 * - Bespoke neomorphic squircle tile
 * - Radiant purple neon ring
 * - Vertical pause symbol `||` with soft neon luminescence
 * - Floating celestial satellite orb
 * - Stylized "BreakTime" (Break in white, Time in radiant purple)
 * - Tagline: "Pause the World. Live the Moment."
 */
@Composable
fun BreakTimeLogo(
    modifier: Modifier = Modifier,
    showText: Boolean = true
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Logo Container with floating satellite dot
        Box(
            modifier = Modifier.size(92.dp),
            contentAlignment = Alignment.Center
        ) {
            // Neomorphic Squircle Base
            Box(
                modifier = Modifier
                    .size(76.dp)
                    .shadow(
                        elevation = 12.dp,
                        shape = LogoShape,
                        spotColor = DarkShadow,
                        ambientColor = DarkShadow
                    )
                    .clip(LogoShape)
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                RaisedCardSurface,
                                Color(0xFF1B1B21)
                            ),
                            start = Offset(0f, 0f),
                            end = Offset(100f, 100f)
                        )
                    )
                    .border(
                        width = 1.dp,
                        brush = Brush.linearGradient(
                            colors = listOf(
                                LightShadow,
                                Color.Transparent,
                                DarkShadow
                            )
                        ),
                        shape = LogoShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                // Canvas drawing the luminous ring and pause symbol
                Canvas(modifier = Modifier.size(56.dp)) {
                    val w = size.width
                    val h = size.height
                    val center = Offset(w / 2f, h / 2f)
                    val ringRadius = w * 0.38f

                    // Soft outer glow of ring
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(
                                PrimaryAccent.copy(alpha = 0.35f),
                                Color.Transparent
                            ),
                            center = center,
                            radius = ringRadius * 1.5f
                        ),
                        radius = ringRadius * 1.5f,
                        center = center
                    )

                    // Luminous purple ring
                    drawCircle(
                        brush = Brush.sweepGradient(
                            colors = listOf(
                                PrimaryAccent,
                                SecondaryAccent,
                                PrimaryAccent
                            ),
                            center = center
                        ),
                        radius = ringRadius,
                        center = center,
                        style = Stroke(width = 2.8f.dp.toPx())
                    )

                    // Left Pause Bar
                    val barWidth = 3.5f.dp.toPx()
                    val barHeight = 16f.dp.toPx()
                    val barSpacing = 4.5f.dp.toPx()
                    val cornerRadius = CornerRadius(2f.dp.toPx(), 2f.dp.toPx())

                    val leftBarX = center.x - barSpacing - barWidth
                    val barY = center.y - barHeight / 2f

                    // Glow behind bars
                    drawCircle(
                        color = PrimaryAccent.copy(alpha = 0.25f),
                        radius = barHeight * 0.7f,
                        center = center
                    )

                    drawRoundRect(
                        color = PrimaryAccent,
                        topLeft = Offset(leftBarX, barY),
                        size = Size(barWidth, barHeight),
                        cornerRadius = cornerRadius
                    )

                    // Right Pause Bar
                    val rightBarX = center.x + barSpacing
                    drawRoundRect(
                        color = PrimaryAccent,
                        topLeft = Offset(rightBarX, barY),
                        size = Size(barWidth, barHeight),
                        cornerRadius = cornerRadius
                    )
                }
            }

            // Top-Right Orbit Satellite Orb
            Box(
                modifier = Modifier
                    .size(14.dp)
                    .offset(x = 36.dp, y = (-32).dp)
                    .clip(androidx.compose.foundation.shape.CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                Color(0xFFD99BFF),
                                PrimaryAccent,
                                SecondaryAccent
                            )
                        )
                    )
                    .border(
                        width = 1.dp,
                        color = Color(0xFFE2BAFF).copy(alpha = 0.6f),
                        shape = androidx.compose.foundation.shape.CircleShape
                    )
            )
        }

        if (showText) {
            Spacer(modifier = Modifier.height(14.dp))

            // BreakTime Title
            Text(
                text = buildAnnotatedString {
                    withStyle(
                        style = SpanStyle(
                            color = PrimaryText,
                            fontWeight = FontWeight.Bold,
                            fontSize = 28.sp,
                            letterSpacing = (-0.5).sp
                        )
                    ) {
                        append("Break")
                    }
                    withStyle(
                        style = SpanStyle(
                            color = PrimaryAccent,
                            fontWeight = FontWeight.Bold,
                            fontSize = 28.sp,
                            letterSpacing = (-0.5).sp
                        )
                    ) {
                        append("Time")
                    }
                }
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Tagline
            Text(
                text = "Pause the World. Live the Moment.",
                color = SecondaryText,
                fontSize = 13.sp,
                fontWeight = FontWeight.Normal,
                letterSpacing = 0.2.sp
            )
        }
    }
}
