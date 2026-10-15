package com.breaktime.app.ui.invitation.components

import android.graphics.RenderEffect
import android.graphics.Shader
import android.os.Build
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asComposeRenderEffect
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.domain.activity.BreakActivity
import com.breaktime.app.ui.theme.DarkShadow
import com.breaktime.app.ui.theme.GlassBorderColor
import com.breaktime.app.ui.theme.GlassSurfaceColor
import com.breaktime.app.ui.theme.LightShadow
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.SecondaryAccent
import com.breaktime.app.ui.theme.SecondaryText
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * The flagship circular glass activity selector.
 *
 * Implements:
 * - A large, perfectly circular crystal orb as the visual focal point.
 * - Deep layered depth: selected activity is sharp & prominent; adjacent activities
 *   are scaled down, dimmed, horizontally offset, and blurred (Android 12+).
 * - Real horizontal swipe gesture handling with smooth spring physics.
 * - Glass chevron controls for quick left/right stepping.
 */
@Composable
fun CircularGlassActivitySelector(
    activities: List<BreakActivity>,
    selectedIndex: Int,
    onIndexChanged: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    if (activities.isEmpty()) return

    val coroutineScope = rememberCoroutineScope()
    val dragOffsetX = remember { Animatable(0f) }

    val currentActivity = activities.getOrElse(selectedIndex) { activities.first() }
    val prevIndex = (selectedIndex - 1 + activities.size) % activities.size
    val nextIndex = (selectedIndex + 1) % activities.size

    val prevActivity = activities[prevIndex]
    val nextActivity = activities[nextIndex]

    val swipeThresholdPx = 100f

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(310.dp)
            .pointerInput(activities.size, selectedIndex) {
                detectHorizontalDragGestures(
                    onDragEnd = {
                        val currentOffset = dragOffsetX.value
                        coroutineScope.launch {
                            if (currentOffset > swipeThresholdPx) {
                                // Swiped right -> move to next activity as specified
                                onIndexChanged(nextIndex)
                            } else if (currentOffset < -swipeThresholdPx) {
                                // Swiped left -> move to previous activity as specified
                                onIndexChanged(prevIndex)
                            }
                            dragOffsetX.animateTo(
                                targetValue = 0f,
                                animationSpec = spring(
                                    dampingRatio = Spring.DampingRatioMediumBouncy,
                                    stiffness = Spring.StiffnessLow
                                )
                            )
                        }
                    },
                    onDragCancel = {
                        coroutineScope.launch {
                            dragOffsetX.animateTo(0f, spring())
                        }
                    },
                    onHorizontalDrag = { change, dragAmount ->
                        change.consume()
                        coroutineScope.launch {
                            dragOffsetX.snapTo(dragOffsetX.value + dragAmount * 0.75f)
                        }
                    }
                )
            },
        contentAlignment = Alignment.Center
    ) {
        val dynamicDrag = dragOffsetX.value
        val normalizedDragFraction = (abs(dynamicDrag) / 300f).coerceIn(0f, 1f)

        // 1. PREVIOUS ACTIVITY (Left background orb)
        if (activities.size > 1) {
            val leftOffset = (-135).dp
            val isEntering = dynamicDrag < 0f // dragging left brings previous
            val dynamicScale = 0.72f + if (isEntering) 0.12f * normalizedDragFraction else 0f
            val dynamicAlpha = 0.42f + if (isEntering) 0.25f * normalizedDragFraction else 0f

            SideActivityOrb(
                activity = prevActivity,
                scale = dynamicScale,
                alpha = dynamicAlpha,
                modifier = Modifier
                    .offset(x = leftOffset)
                    .offset { IntOffset((dynamicDrag * 0.35f).roundToInt(), 0) }
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        role = Role.Button,
                        onClick = { onIndexChanged(prevIndex) }
                    )
            )
        }

        // 2. NEXT ACTIVITY (Right background orb)
        if (activities.size > 1) {
            val rightOffset = 135.dp
            val isEntering = dynamicDrag > 0f // dragging right brings next
            val dynamicScale = 0.72f + if (isEntering) 0.12f * normalizedDragFraction else 0f
            val dynamicAlpha = 0.42f + if (isEntering) 0.25f * normalizedDragFraction else 0f

            SideActivityOrb(
                activity = nextActivity,
                scale = dynamicScale,
                alpha = dynamicAlpha,
                modifier = Modifier
                    .offset(x = rightOffset)
                    .offset { IntOffset((dynamicDrag * 0.35f).roundToInt(), 0) }
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        role = Role.Button,
                        onClick = { onIndexChanged(nextIndex) }
                    )
            )
        }

        // 3. CENTER ACTIVE ACTIVITY ORB (Main visual focal point)
        Box(
            modifier = Modifier
                .offset { IntOffset(dynamicDrag.roundToInt(), 0) }
                .size(240.dp)
                .shadow(
                    elevation = 24.dp,
                    shape = CircleShape,
                    spotColor = PrimaryAccent.copy(alpha = 0.55f),
                    ambientColor = DarkShadow
                )
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color(0xFF2E2248),
                            Color(0xFF201830),
                            Color(0xFF14121B)
                        ),
                        center = Offset(240f, 240f),
                        radius = 280f
                    )
                )
                .border(
                    width = 2.dp,
                    brush = Brush.sweepGradient(
                        listOf(
                            PrimaryAccent,
                            Color(0x88FFFFFF),
                            SecondaryAccent,
                            Color(0x33B45CFF),
                            PrimaryAccent
                        )
                    ),
                    shape = CircleShape
                )
                .semantics {
                    contentDescription = "Selected activity: ${currentActivity.title}"
                },
            contentAlignment = Alignment.Center
        ) {
            // Inner atmospheric glass ring highlight
            Box(
                modifier = Modifier
                    .size(228.dp)
                    .clip(CircleShape)
                    .border(
                        width = 1.dp,
                        brush = Brush.verticalGradient(
                            listOf(
                                Color.White.copy(alpha = 0.25f),
                                Color.Transparent,
                                PrimaryAccent.copy(alpha = 0.3f)
                            )
                        ),
                        shape = CircleShape
                    )
            )

            // Centered Activity Artwork
            ActivityIcon(
                activity = currentActivity,
                size = 175.dp
            )
        }

        // 4. FLOATING GLASS ARROW BUTTONS (< and >)
        if (activities.size > 1) {
            // Left Chevron
            GlassNavigationArrow(
                isRight = false,
                onClick = { onIndexChanged(prevIndex) },
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .padding(start = 16.dp)
            )

            // Right Chevron
            GlassNavigationArrow(
                isRight = true,
                onClick = { onIndexChanged(nextIndex) },
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 16.dp)
            )
        }
    }
}

/**
 * Dimmed, scaled, and blurred side orb representing adjacent activities in the swipe sequence.
 */
@Composable
private fun SideActivityOrb(
    activity: BreakActivity,
    modifier: Modifier = Modifier,
    scale: Float = 0.72f,
    alpha: Float = 0.42f
) {
    Column(
        modifier = modifier
            .scale(scale)
            .alpha(alpha)
            .graphicsLayer {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    renderEffect = RenderEffect.createBlurEffect(
                        10f,
                        10f,
                        Shader.TileMode.CLAMP
                    ).asComposeRenderEffect()
                }
            },
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(170.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color(0xFF261D3B),
                            Color(0xFF16141F)
                        )
                    )
                )
                .border(
                    width = 1.dp,
                    color = PrimaryAccent.copy(alpha = 0.3f),
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            ActivityIcon(
                activity = activity,
                size = 110.dp
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = activity.title,
            color = SecondaryText,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.5.sp
        )
    }
}

/**
 * Minimal glassmorphic chevron button for quick horizontal navigation.
 */
@Composable
private fun GlassNavigationArrow(
    isRight: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }

    Box(
        modifier = modifier
            .size(40.dp)
            .shadow(
                elevation = 8.dp,
                shape = CircleShape,
                spotColor = PrimaryAccent.copy(alpha = 0.35f),
                ambientColor = DarkShadow
            )
            .clip(CircleShape)
            .background(GlassSurfaceColor)
            .border(width = 1.dp, color = GlassBorderColor, shape = CircleShape)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                role = Role.Button,
                onClick = onClick
            )
            .semantics {
                contentDescription = if (isRight) "Next activity" else "Previous activity"
            },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = if (isRight) {
                Icons.AutoMirrored.Outlined.KeyboardArrowRight
            } else {
                Icons.AutoMirrored.Outlined.KeyboardArrowLeft
            },
            contentDescription = null,
            tint = PrimaryText,
            modifier = Modifier.size(20.dp)
        )
    }
}
