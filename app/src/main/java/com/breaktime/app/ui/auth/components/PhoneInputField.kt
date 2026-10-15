package com.breaktime.app.ui.auth.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.domain.auth.CountryCode
import com.breaktime.app.ui.theme.ErrorColor
import com.breaktime.app.ui.theme.InputBackground
import com.breaktime.app.ui.theme.InputBorder
import com.breaktime.app.ui.theme.InputFocusedBorder
import com.breaktime.app.ui.theme.InputShape
import com.breaktime.app.ui.theme.PlaceholderColor
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.SecondaryBackground
import com.breaktime.app.ui.theme.SecondaryText

/**
 * Midnight Neomorphic Phone Input Field:
 * - Stacked label with dynamic focus color
 * - Country calling code pill with flag & dial code
 * - Digits-only editable field with normalized formatting
 * - Clean error presentation
 */
@Composable
fun PhoneInputField(
    phoneNumber: String,
    onPhoneNumberChange: (String) -> Unit,
    selectedCountry: CountryCode,
    onCountryCodeClick: () -> Unit,
    modifier: Modifier = Modifier,
    isError: Boolean = false,
    errorMessage: String? = null,
    enabled: Boolean = true,
    onDone: (() -> Unit)? = null
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    val animatedBorderColor by animateColorAsState(
        targetValue = when {
            isError -> ErrorColor
            isFocused -> InputFocusedBorder
            else -> InputBorder
        },
        label = "phoneBorderColor"
    )

    val labelColor by animateColorAsState(
        targetValue = when {
            isError -> ErrorColor
            isFocused -> PrimaryAccent
            else -> SecondaryText
        },
        label = "phoneLabelColor"
    )

    Column(
        modifier = modifier.fillMaxWidth()
    ) {
        // 1. Stacked Label
        Text(
            text = "Phone number",
            color = labelColor,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(start = 4.dp, bottom = 6.dp)
        )

        // 2. Input Box with Country Pill & Digits TextField
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(InputShape)
                .background(InputBackground)
                .border(
                    width = if (isFocused || isError) 1.5.dp else 1.dp,
                    color = animatedBorderColor,
                    shape = InputShape
                )
                .padding(horizontal = 8.dp, vertical = 6.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Country Code Pill
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(SecondaryBackground)
                        .clickable(enabled = enabled, onClick = onCountryCodeClick)
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = selectedCountry.flagEmoji,
                        fontSize = 18.sp
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = selectedCountry.dialCode,
                        color = PrimaryText,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Icon(
                        imageVector = Icons.Default.ArrowDropDown,
                        contentDescription = "Select Country",
                        tint = SecondaryText,
                        modifier = Modifier.size(18.dp)
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                // Editable Phone Digits
                BasicTextField(
                    value = phoneNumber,
                    onValueChange = { input ->
                        // Filter out non-digits or allowable spaces
                        val filtered = input.filter { it.isDigit() || it == ' ' || it == '-' }
                        onPhoneNumberChange(filtered)
                    },
                    modifier = Modifier
                        .weight(1f)
                        .padding(vertical = 6.dp),
                    enabled = enabled,
                    singleLine = true,
                    textStyle = TextStyle(
                        color = if (enabled) PrimaryText else SecondaryText,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium
                    ),
                    cursorBrush = SolidColor(PrimaryAccent),
                    interactionSource = interactionSource,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Phone,
                        imeAction = if (onDone != null) ImeAction.Done else ImeAction.Default
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = { onDone?.invoke() }
                    ),
                    decorationBox = { innerTextField ->
                        if (phoneNumber.isEmpty()) {
                            Text(
                                text = selectedCountry.example,
                                color = PlaceholderColor,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Normal
                            )
                        }
                        innerTextField()
                    }
                )
            }
        }

        // 3. Error message
        AnimatedVisibility(
            visible = isError && !errorMessage.isNullOrBlank(),
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Text(
                text = errorMessage.orEmpty(),
                color = ErrorColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.Normal,
                modifier = Modifier.padding(start = 6.dp, top = 4.dp)
            )
        }
    }
}
