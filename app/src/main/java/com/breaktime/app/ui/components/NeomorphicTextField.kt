package com.breaktime.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.theme.DarkShadow
import com.breaktime.app.ui.theme.ErrorColor
import com.breaktime.app.ui.theme.InputBackground
import com.breaktime.app.ui.theme.InputBorder
import com.breaktime.app.ui.theme.InputFocusedBorder
import com.breaktime.app.ui.theme.InputShape
import com.breaktime.app.ui.theme.PlaceholderColor
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.SecondaryText

/**
 * Reusable recessed NeomorphicTextField:
 * - Stacked label + input design matching the reference image
 * - Recessed dark charcoal surface (#1B1B22)
 * - Subtle inner bevel and animated focus glow
 * - Leading icon & optional trailing toggle
 * - Clean error presentation
 */
@Composable
fun NeomorphicTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    modifier: Modifier = Modifier,
    leadingIcon: ImageVector? = null,
    trailingIcon: @Composable (() -> Unit)? = null,
    isError: Boolean = false,
    errorMessage: String? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    singleLine: Boolean = true
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    val animatedBorderColor by animateColorAsState(
        targetValue = when {
            isError -> ErrorColor
            isFocused -> InputFocusedBorder
            else -> InputBorder
        },
        label = "borderColorAnimation"
    )

    val labelColor by animateColorAsState(
        targetValue = when {
            isError -> ErrorColor
            isFocused -> PrimaryAccent
            else -> SecondaryText
        },
        label = "labelColorAnimation"
    )

    val iconColor by animateColorAsState(
        targetValue = when {
            isError -> ErrorColor
            isFocused -> PrimaryAccent
            else -> SecondaryText
        },
        label = "iconColorAnimation"
    )

    Column(modifier = modifier.fillMaxWidth()) {
        // Recessed Container
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .shadow(
                    elevation = if (isFocused) 6.dp else 2.dp,
                    shape = InputShape,
                    spotColor = if (isFocused) PrimaryAccent.copy(alpha = 0.3f) else DarkShadow,
                    ambientColor = DarkShadow
                )
                .clip(InputShape)
                .background(InputBackground)
                .border(
                    width = if (isFocused || isError) 1.5.dp else 1.dp,
                    color = animatedBorderColor,
                    shape = InputShape
                )
                .padding(horizontal = 16.dp, vertical = 8.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Leading Icon
                if (leadingIcon != null) {
                    Icon(
                        imageVector = leadingIcon,
                        contentDescription = label,
                        tint = iconColor,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(14.dp))
                }

                // Two-line stacked label + input field
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    // Top Label
                    Text(
                        text = label,
                        color = labelColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        letterSpacing = 0.3.sp
                    )

                    Spacer(modifier = Modifier.height(2.dp))

                    // Input Text / Placeholder
                    BasicTextField(
                        value = value,
                        onValueChange = onValueChange,
                        modifier = Modifier.fillMaxWidth(),
                        textStyle = TextStyle(
                            fontFamily = FontFamily.SansSerif,
                            fontWeight = FontWeight.Normal,
                            fontSize = 14.sp,
                            color = PrimaryText,
                            letterSpacing = 0.2.sp
                        ),
                        cursorBrush = SolidColor(PrimaryAccent),
                        visualTransformation = visualTransformation,
                        keyboardOptions = keyboardOptions,
                        keyboardActions = keyboardActions,
                        singleLine = singleLine,
                        interactionSource = interactionSource,
                        decorationBox = { innerTextField ->
                            if (value.isEmpty()) {
                                Text(
                                    text = placeholder,
                                    color = PlaceholderColor,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Normal,
                                    letterSpacing = 0.2.sp
                                )
                            }
                            innerTextField()
                        }
                    )
                }

                // Trailing Icon (e.g. Password Toggle)
                if (trailingIcon != null) {
                    trailingIcon()
                }
            }
        }

        // Error message below field
        AnimatedVisibility(
            visible = isError && !errorMessage.isNullOrEmpty(),
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Text(
                text = errorMessage.orEmpty(),
                color = ErrorColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(start = 12.dp, top = 4.dp)
            )
        }
    }
}
