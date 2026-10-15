package com.breaktime.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.components.AmbientBackground
import com.breaktime.app.ui.components.BreakTimeLogo
import com.breaktime.app.ui.components.NeomorphicCheckbox
import com.breaktime.app.ui.components.NeomorphicTextField
import com.breaktime.app.ui.components.PasswordVisibilityToggle
import com.breaktime.app.ui.components.PrimaryGradientButton
import com.breaktime.app.ui.components.SocialLoginButton
import com.breaktime.app.ui.theme.DarkShadow
import com.breaktime.app.ui.theme.DividerColor
import com.breaktime.app.ui.theme.ErrorColor
import com.breaktime.app.ui.theme.LightShadow
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryText

@Composable
fun RegisterScreen(
    viewModel: RegisterViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToLogin: () -> Unit,
    onRegisterSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val scrollState = rememberScrollState()

    LaunchedEffect(uiState.isRegisterSuccess) {
        if (uiState.isRegisterSuccess) {
            onRegisterSuccess()
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
            Spacer(modifier = Modifier.height(16.dp))

            // TOP NAVIGATION ROW (Back Button)
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .shadow(
                            elevation = 6.dp,
                            shape = CircleShape,
                            spotColor = DarkShadow,
                            ambientColor = DarkShadow
                        )
                        .clip(CircleShape)
                        .background(RaisedCardSurface)
                        .border(1.dp, LightShadow, CircleShape)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick = onNavigateBack
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = PrimaryText,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // BRAND LOGO
            BreakTimeLogo(
                showText = true
            )

            Spacer(modifier = Modifier.height(24.dp))

            // HEADINGS
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.Start
            ) {
                Text(
                    text = "Create your account",
                    style = MaterialTheme.typography.headlineMedium,
                    color = PrimaryText,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Join BreakTime and start making memories with your people.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = SecondaryText,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // FIELD 1: Full name
            NeomorphicTextField(
                value = uiState.fullName,
                onValueChange = viewModel::onFullNameChange,
                label = "Full name",
                placeholder = "Enter your full name",
                leadingIcon = Icons.Outlined.Person,
                isError = uiState.fullNameError != null,
                errorMessage = uiState.fullNameError,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Next
                ),
                keyboardActions = KeyboardActions(
                    onNext = { focusManager.moveFocus(FocusDirection.Down) }
                )
            )

            Spacer(modifier = Modifier.height(12.dp))

            // FIELD 2: Email address
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

            Spacer(modifier = Modifier.height(12.dp))

            // FIELD 3: Password
            NeomorphicTextField(
                value = uiState.password,
                onValueChange = viewModel::onPasswordChange,
                label = "Password",
                placeholder = "Create a password",
                leadingIcon = Icons.Outlined.Lock,
                isError = uiState.passwordError != null,
                errorMessage = uiState.passwordError,
                visualTransformation = if (uiState.isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Next
                ),
                keyboardActions = KeyboardActions(
                    onNext = { focusManager.moveFocus(FocusDirection.Down) }
                ),
                trailingIcon = {
                    PasswordVisibilityToggle(
                        visible = uiState.isPasswordVisible,
                        onToggle = viewModel::togglePasswordVisibility
                    )
                }
            )

            Spacer(modifier = Modifier.height(12.dp))

            // FIELD 4: Confirm password
            NeomorphicTextField(
                value = uiState.confirmPassword,
                onValueChange = viewModel::onConfirmPasswordChange,
                label = "Confirm password",
                placeholder = "Confirm your password",
                leadingIcon = Icons.Outlined.Lock,
                isError = uiState.confirmPasswordError != null,
                errorMessage = uiState.confirmPasswordError,
                visualTransformation = if (uiState.isConfirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done
                ),
                keyboardActions = KeyboardActions(
                    onDone = {
                        keyboardController?.hide()
                        viewModel.register()
                    }
                ),
                trailingIcon = {
                    PasswordVisibilityToggle(
                        visible = uiState.isConfirmPasswordVisible,
                        onToggle = viewModel::toggleConfirmPasswordVisibility
                    )
                }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // TERMS AND PRIVACY CHECKBOX
            Column(modifier = Modifier.fillMaxWidth()) {
                NeomorphicCheckbox(
                    checked = uiState.agreeTerms,
                    onCheckedChange = viewModel::onAgreeTermsChange,
                    content = {
                        Text(
                            text = buildAnnotatedString {
                                append("I agree to the ")
                                withStyle(SpanStyle(color = PrimaryAccent, fontWeight = FontWeight.Medium)) {
                                    append("Terms of Service")
                                }
                                append(" and ")
                                withStyle(SpanStyle(color = PrimaryAccent, fontWeight = FontWeight.Medium)) {
                                    append("Privacy Policy")
                                }
                            },
                            color = SecondaryText,
                            fontSize = 12.sp,
                            lineHeight = 16.sp
                        )
                    }
                )

                if (uiState.termsError != null) {
                    Text(
                        text = uiState.termsError.orEmpty(),
                        color = ErrorColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(start = 30.dp, top = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // PRIMARY BUTTON (Create Account)
            PrimaryGradientButton(
                text = "Create Account",
                isLoading = uiState.isLoading,
                onClick = {
                    keyboardController?.hide()
                    viewModel.register()
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // DIVIDER
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

            // SOCIAL BUTTON
            SocialLoginButton(
                onClick = viewModel::onGoogleSignInClicked
            )

            Spacer(modifier = Modifier.height(24.dp))

            // BOTTOM NAVIGATION (Sign In)
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Already have an account? ",
                    color = SecondaryText,
                    fontSize = 14.sp
                )
                Row(
                    modifier = Modifier.clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        onClick = onNavigateToLogin
                    ),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Sign in",
                        color = PrimaryAccent,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = "Sign in",
                        tint = PrimaryAccent,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }

        // Dialogs
        if (uiState.generalError != null) {
            AlertDialog(
                onDismissRequest = viewModel::clearGeneralError,
                title = {
                    Text(
                        text = "Registration Notice",
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
                    TextButton(onClick = viewModel::registerAsDemo) {
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
                        text = "Google Sign-In",
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
                    TextButton(onClick = viewModel::registerAsDemo) {
                        Text("Try Demo Mode", color = PrimaryAccent, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = viewModel::clearGeneralError) {
                        Text("OK", color = SecondaryText)
                    }
                },
                containerColor = RaisedCardSurface
            )
        }
    }
}
