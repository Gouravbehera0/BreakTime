package com.breaktime.app.ui.auth

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.auth.components.OtpSixCellInput
import com.breaktime.app.ui.components.AmbientBackground
import com.breaktime.app.ui.components.PrimaryGradientButton
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryBackground
import com.breaktime.app.ui.theme.SecondaryText

@Composable
fun OtpVerificationScreen(
    viewModel: OtpVerificationViewModel,
    onNavigateBack: () -> Unit,
    onVerificationSuccessToHome: () -> Unit,
    onVerificationSuccessToProfileSetup: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val keyboardController = LocalSoftwareKeyboardController.current
    val scrollState = rememberScrollState()

    // Handle successful verification navigation
    LaunchedEffect(uiState.verificationSuccessUser) {
        val user = uiState.verificationSuccessUser
        if (user != null) {
            if (user.isProfileComplete) {
                onVerificationSuccessToHome()
            } else {
                onVerificationSuccessToProfileSetup()
            }
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
            // 1. Top Bar with Back Button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onNavigateBack,
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = PrimaryText
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // 2. Headings
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.Start
            ) {
                Text(
                    text = "Verify your number",
                    style = MaterialTheme.typography.headlineMedium,
                    color = PrimaryText,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Enter the 6-digit code sent to",
                    style = MaterialTheme.typography.bodyMedium,
                    color = SecondaryText,
                    fontSize = 14.sp
                )

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        onClick = onNavigateBack
                    )
                ) {
                    Text(
                        text = uiState.phone,
                        color = PrimaryText,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Change",
                        color = PrimaryAccent,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.width(2.dp))
                    Icon(
                        imageVector = Icons.Outlined.Edit,
                        contentDescription = "Change phone number",
                        tint = PrimaryAccent,
                        modifier = Modifier.size(13.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(36.dp))

            // 3. 6-Cell OTP Input
            OtpSixCellInput(
                otpCode = uiState.otpCode,
                onOtpChange = viewModel::onOtpChange,
                isError = uiState.otpError != null,
                errorMessage = uiState.otpError,
                enabled = !uiState.isVerifying,
                onDone = {
                    if (uiState.isCodeComplete) {
                        keyboardController?.hide()
                        viewModel.verifyOtp()
                    }
                }
            )

            Spacer(modifier = Modifier.height(32.dp))

            // 4. Primary Button: Verify & Continue
            PrimaryGradientButton(
                text = "Verify & Continue",
                isLoading = uiState.isVerifying,
                enabled = uiState.isCodeComplete && !uiState.isVerifying,
                onClick = {
                    keyboardController?.hide()
                    viewModel.verifyOtp()
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // 5. Resend Cooldown Section
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (uiState.isResending) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = PrimaryAccent,
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Requesting new code...",
                        color = SecondaryText,
                        fontSize = 13.sp
                    )
                } else if (uiState.canResend) {
                    Text(
                        text = "Didn't receive the code? ",
                        color = SecondaryText,
                        fontSize = 13.sp
                    )
                    Text(
                        text = "Resend OTP",
                        color = PrimaryAccent,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick = viewModel::resendOtp
                        )
                    )
                } else {
                    Text(
                        text = "Resend OTP in ${uiState.formattedCooldown}",
                        color = SecondaryText.copy(alpha = 0.75f),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))
        }

        // Notification / Error Dialog
        if (uiState.generalError != null) {
            AlertDialog(
                onDismissRequest = viewModel::clearMessages,
                title = {
                    Text(
                        text = "Verification Notice",
                        color = PrimaryText,
                        fontWeight = FontWeight.Bold
                    )
                },
                text = {
                    Text(
                        text = uiState.generalError.orEmpty(),
                        color = SecondaryText,
                        fontSize = 14.sp
                    )
                },
                confirmButton = {
                    TextButton(onClick = viewModel::clearMessages) {
                        Text("OK", color = PrimaryAccent, fontWeight = FontWeight.Bold)
                    }
                },
                containerColor = RaisedCardSurface
            )
        }

        if (uiState.infoMessage != null) {
            AlertDialog(
                onDismissRequest = viewModel::clearMessages,
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
                        fontSize = 14.sp
                    )
                },
                confirmButton = {
                    TextButton(onClick = viewModel::clearMessages) {
                        Text("OK", color = PrimaryAccent, fontWeight = FontWeight.Bold)
                    }
                },
                containerColor = RaisedCardSurface
            )
        }
    }
}
