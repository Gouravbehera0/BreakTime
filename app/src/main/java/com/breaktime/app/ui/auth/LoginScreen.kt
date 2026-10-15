package com.breaktime.app.ui.auth

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Phone
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.auth.components.CountryCodePickerBottomSheet
import com.breaktime.app.ui.auth.components.PhoneInputField
import com.breaktime.app.ui.components.AmbientBackground
import com.breaktime.app.ui.components.BreakTimeLogo
import com.breaktime.app.ui.components.NeomorphicCheckbox
import com.breaktime.app.ui.components.NeomorphicTextField
import com.breaktime.app.ui.components.PasswordVisibilityToggle
import com.breaktime.app.ui.components.PrimaryGradientButton
import com.breaktime.app.ui.components.SocialLoginButton
import com.breaktime.app.ui.theme.DividerColor
import com.breaktime.app.ui.theme.InputBorder
import com.breaktime.app.ui.theme.InputFocusedBorder
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryBackground
import com.breaktime.app.ui.theme.SecondaryText

@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onNavigateToRegister: () -> Unit,
    onNavigateToForgotPassword: () -> Unit,
    onLoginSuccess: () -> Unit,
    onNavigateToOtp: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val scrollState = rememberScrollState()

    // Handle successful authentication navigation
    LaunchedEffect(uiState.isLoginSuccess) {
        if (uiState.isLoginSuccess) {
            onLoginSuccess()
        }
    }

    // Handle OTP screen navigation
    LaunchedEffect(uiState.navigateToOtpPhone) {
        uiState.navigateToOtpPhone?.let { phone ->
            onNavigateToOtp?.invoke(phone)
            viewModel.onOtpNavigationHandled()
        }
    }

    AmbientBackground(modifier = modifier) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .imePadding()
                .verticalScroll(scrollState)
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(20.dp))

            // 1. TOP BRAND SECTION
            BreakTimeLogo(
                modifier = Modifier.padding(top = 4.dp),
                showText = true
            )

            Spacer(modifier = Modifier.height(24.dp))

            // 2. WELCOME HEADINGS (Customized per active auth method)
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.Start
            ) {
                Text(
                    text = if (uiState.authMethod == AuthMethod.PHONE) "Welcome to BreakTime" else "Welcome Back",
                    style = MaterialTheme.typography.headlineMedium,
                    color = PrimaryText,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = if (uiState.authMethod == AuthMethod.PHONE) {
                        "Your people. Your moments. One tap away."
                    } else {
                        "Sign in and make time for your people."
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = SecondaryText,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // 3. SEGMENTED AUTH METHOD SELECTOR
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(SecondaryBackground)
                    .border(1.dp, InputBorder, RoundedCornerShape(14.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                // Phone Option
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(
                            if (uiState.authMethod == AuthMethod.PHONE) RaisedCardSurface else androidx.compose.ui.graphics.Color.Transparent
                        )
                        .border(
                            width = if (uiState.authMethod == AuthMethod.PHONE) 1.dp else 0.dp,
                            color = if (uiState.authMethod == AuthMethod.PHONE) InputFocusedBorder else androidx.compose.ui.graphics.Color.Transparent,
                            shape = RoundedCornerShape(10.dp)
                        )
                        .clickable { viewModel.onAuthMethodChange(AuthMethod.PHONE) }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Outlined.Phone,
                            contentDescription = null,
                            tint = if (uiState.authMethod == AuthMethod.PHONE) PrimaryAccent else SecondaryText,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Phone OTP",
                            color = if (uiState.authMethod == AuthMethod.PHONE) PrimaryText else SecondaryText,
                            fontSize = 13.sp,
                            fontWeight = if (uiState.authMethod == AuthMethod.PHONE) FontWeight.SemiBold else FontWeight.Medium
                        )
                    }
                }

                // Email Option
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(
                            if (uiState.authMethod == AuthMethod.EMAIL) RaisedCardSurface else androidx.compose.ui.graphics.Color.Transparent
                        )
                        .border(
                            width = if (uiState.authMethod == AuthMethod.EMAIL) 1.dp else 0.dp,
                            color = if (uiState.authMethod == AuthMethod.EMAIL) InputFocusedBorder else androidx.compose.ui.graphics.Color.Transparent,
                            shape = RoundedCornerShape(10.dp)
                        )
                        .clickable { viewModel.onAuthMethodChange(AuthMethod.EMAIL) }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Outlined.Email,
                            contentDescription = null,
                            tint = if (uiState.authMethod == AuthMethod.EMAIL) PrimaryAccent else SecondaryText,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Email & Password",
                            color = if (uiState.authMethod == AuthMethod.EMAIL) PrimaryText else SecondaryText,
                            fontSize = 13.sp,
                            fontWeight = if (uiState.authMethod == AuthMethod.EMAIL) FontWeight.SemiBold else FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // 4. AUTH METHOD CONTENT (Animated)
            AnimatedContent(
                targetState = uiState.authMethod,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "authMethodTransition"
            ) { method ->
                if (method == AuthMethod.PHONE) {
                    // OPTION 1: PHONE AUTHENTICATION
                    Column(modifier = Modifier.fillMaxWidth()) {
                        PhoneInputField(
                            phoneNumber = uiState.phoneNumber,
                            onPhoneNumberChange = viewModel::onPhoneNumberChange,
                            selectedCountry = uiState.selectedCountry,
                            onCountryCodeClick = viewModel::openCountryPicker,
                            isError = uiState.phoneNumberError != null,
                            errorMessage = uiState.phoneNumberError,
                            enabled = !uiState.isLoading,
                            onDone = {
                                keyboardController?.hide()
                                viewModel.sendOtp()
                            }
                        )

                        Spacer(modifier = Modifier.height(22.dp))

                        PrimaryGradientButton(
                            text = "Send OTP",
                            isLoading = uiState.isLoading,
                            onClick = {
                                keyboardController?.hide()
                                viewModel.sendOtp()
                            }
                        )
                    }
                } else {
                    // OPTION 2: EMAIL AUTHENTICATION
                    Column(modifier = Modifier.fillMaxWidth()) {
                        NeomorphicTextField(
                            value = uiState.email,
                            onValueChange = viewModel::onEmailChange,
                            label = "Email address",
                            placeholder = "Enter your email",
                            leadingIcon = Icons.Outlined.Email,
                            isError = uiState.emailError != null,
                            errorMessage = uiState.emailError,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Email,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            )
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        NeomorphicTextField(
                            value = uiState.password,
                            onValueChange = viewModel::onPasswordChange,
                            label = "Password",
                            placeholder = "Enter your password",
                            leadingIcon = Icons.Outlined.Lock,
                            isError = uiState.passwordError != null,
                            errorMessage = uiState.passwordError,
                            visualTransformation = if (uiState.isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    keyboardController?.hide()
                                    viewModel.login()
                                }
                            ),
                            trailingIcon = {
                                PasswordVisibilityToggle(
                                    visible = uiState.isPasswordVisible,
                                    onToggle = viewModel::togglePasswordVisibility
                                )
                            }
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        // Remember me & Forgot Password Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            NeomorphicCheckbox(
                                checked = uiState.rememberMe,
                                onCheckedChange = viewModel::onRememberMeChange,
                                content = {
                                    Text(
                                        text = "Remember me",
                                        color = SecondaryText,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Normal
                                    )
                                }
                            )

                            Text(
                                text = "Forgot password?",
                                color = PrimaryAccent,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null,
                                    onClick = onNavigateToForgotPassword
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(22.dp))

                        PrimaryGradientButton(
                            text = "Enter BreakTime",
                            isLoading = uiState.isLoading,
                            onClick = {
                                keyboardController?.hide()
                                viewModel.login()
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(22.dp))

            // 5. DIVIDER
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                HorizontalDivider(
                    modifier = Modifier.weight(1f),
                    color = DividerColor,
                    thickness = 1.dp
                )
                Text(
                    text = "  OR CONTINUE WITH  ",
                    color = SecondaryText.copy(alpha = 0.7f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.sp
                )
                HorizontalDivider(
                    modifier = Modifier.weight(1f),
                    color = DividerColor,
                    thickness = 1.dp
                )
            }

            Spacer(modifier = Modifier.height(18.dp))

            // 6. SOCIAL BUTTON (GOOGLE)
            SocialLoginButton(
                onClick = viewModel::onGoogleSignInClicked
            )

            Spacer(modifier = Modifier.height(10.dp))

            TextButton(
                onClick = viewModel::loginAsDemo
            ) {
                Text(
                    text = "Explore App in Demo Mode →",
                    color = PrimaryAccent.copy(alpha = 0.9f),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 7. REGISTRATION LINK
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "New here? ",
                    color = SecondaryText,
                    fontSize = 14.sp
                )
                Row(
                    modifier = Modifier.clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        onClick = onNavigateToRegister
                    ),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Create an account",
                        color = PrimaryAccent,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = "Create account",
                        tint = PrimaryAccent,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // 8. FOOTER MOTTO
            Text(
                text = "Made for moments that matter.",
                color = SecondaryText.copy(alpha = 0.6f),
                fontSize = 11.sp,
                fontWeight = FontWeight.Normal,
                letterSpacing = 0.4.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))
        }

        // 9. COUNTRY PICKER BOTTOM SHEET
        if (uiState.isCountryPickerOpen) {
            CountryCodePickerBottomSheet(
                selectedCountry = uiState.selectedCountry,
                onCountrySelected = viewModel::onCountrySelected,
                onDismissRequest = viewModel::dismissCountryPicker
            )
        }

        // 10. NOTIFICATION / ERROR DIALOGS
        if (uiState.generalError != null) {
            AlertDialog(
                onDismissRequest = viewModel::clearGeneralError,
                title = {
                    Text(
                        text = "Authentication Notice",
                        color = PrimaryText,
                        fontWeight = FontWeight.Bold
                    )
                },
                text = {
                    Text(
                        text = uiState.generalError.orEmpty(),
                        color = SecondaryText,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )
                },
                confirmButton = {
                    TextButton(onClick = viewModel::loginAsDemo) {
                        Text("Try Demo Mode", color = PrimaryAccent, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = viewModel::clearGeneralError) {
                        Text("Dismiss", color = SecondaryText)
                    }
                },
                containerColor = RaisedCardSurface
            )
        }

        if (uiState.infoMessage != null) {
            AlertDialog(
                onDismissRequest = viewModel::clearGeneralError,
                title = {
                    Text(
                        text = "Notice",
                        color = PrimaryText,
                        fontWeight = FontWeight.Bold
                    )
                },
                text = {
                    Text(
                        text = uiState.infoMessage.orEmpty(),
                        color = SecondaryText,
                        fontSize = 13.sp
                    )
                },
                confirmButton = {
                    TextButton(onClick = viewModel::clearGeneralError) {
                        Text("OK", color = PrimaryAccent, fontWeight = FontWeight.Bold)
                    }
                },
                containerColor = RaisedCardSurface
            )
        }
    }
}
