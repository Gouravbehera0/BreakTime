package com.breaktime.app.ui.auth.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.theme.DarkShadow
import com.breaktime.app.ui.theme.ErrorColor
import com.breaktime.app.ui.theme.InputBackground
import com.breaktime.app.ui.theme.InputBorder
import com.breaktime.app.ui.theme.InputFocusedBorder
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText

/**
 * Single logical input field rendered as six visually distinct Neomorphic cells.
 * Features:
 * - Full paste & autofill support
 * - Auto-focusing on first cell
 * - Animated cursor on active cell
 * - High accessibility compliance
 */
@Composable
fun OtpSixCellInput(
    otpCode: String,
    onOtpChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    isError: Boolean = false,
    errorMessage: String? = null,
    enabled: Boolean = true,
    onDone: (() -> Unit)? = null
) {
    val focusRequester = remember { FocusRequester() }
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    // Blinking cursor transition for active empty cell
    val infiniteTransition = rememberInfiniteTransition(label = "cursorBlink")
    val cursorAlpha by infiniteTransition.animateColorAsState(
        initialValue = PrimaryAccent,
        targetValue = PrimaryAccent.copy(alpha = 0f),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 600),
            repeatMode = RepeatMode.Reverse
        ),
        label = "cursorAlpha"
    )

    LaunchedEffect(Unit) {
        // Automatically request focus when screen appears
        focusRequester.requestFocus()
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .fillMaxWidth()
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) {
                    focusRequester.requestFocus()
                }
        ) {
            // Invisible underlying BasicTextField handling keyboard input, paste, and deletion
            BasicTextField(
                value = otpCode,
                onValueChange = { input ->
                    val filtered = input.filter { it.isDigit() }.take(6)
                    onOtpChange(filtered)
                },
                modifier = Modifier
                    .size(1.dp)
                    .alpha(0f)
                    .focusRequester(focusRequester),
                enabled = enabled,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.NumberPassword,
                    imeAction = if (onDone != null) ImeAction.Done else ImeAction.Default
                ),
                keyboardActions = KeyboardActions(
                    onDone = { onDone?.invoke() }
                ),
                interactionSource = interactionSource,
                cursorBrush = SolidColor(PrimaryAccent)
            )

            // Six visual Neomorphic cells
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics {
                        contentDescription = "6 digit SMS verification code input"
                    },
                horizontalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterHorizontally),
                verticalAlignment = Alignment.CenterVertically
            ) {
                val activeIndex = otpCode.length.coerceAtMost(5)

                for (i in 0 until 6) {
                    val char = otpCode.getOrNull(i)?.toString()
                    val isCellActive = isFocused && i == activeIndex

                    val cellBorderColor by animateColorAsState(
                        targetValue = when {
                            isError -> ErrorColor
                            isCellActive -> InputFocusedBorder
                            !char.isNullOrEmpty() -> PrimaryAccent.copy(alpha = 0.5f)
                            else -> InputBorder
                        },
                        label = "cellBorder_$i"
                    )

                    Box(
                        modifier = Modifier
                            .width(48.dp)
                            .height(58.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(InputBackground)
                            .border(
                                width = if (isCellActive || isError) 1.5.dp else 1.dp,
                                color = cellBorderColor,
                                shape = RoundedCornerShape(14.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        if (!char.isNullOrEmpty()) {
                            Text(
                                text = char,
                                color = PrimaryText,
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold
                            )
                        } else if (isCellActive && enabled) {
                            // Blinking cursor line
                            Box(
                                modifier = Modifier
                                    .width(2.dp)
                                    .height(24.dp)
                                    .background(cursorAlpha)
                            )
                        }
                    }
                }
            }
        }

        // Error message below cells
        AnimatedVisibility(
            visible = isError && !errorMessage.isNullOrBlank(),
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Text(
                text = errorMessage.orEmpty(),
                color = ErrorColor,
                fontSize = 12.sp,
                fontWeight = FontWeight.Normal,
                modifier = Modifier.padding(top = 10.dp)
            )
        }
    }
}
