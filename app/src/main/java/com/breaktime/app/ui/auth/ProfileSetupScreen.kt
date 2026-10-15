package com.breaktime.app.ui.auth

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.breaktime.app.ui.components.AmbientBackground
import com.breaktime.app.ui.components.BreakTimeLogo
import com.breaktime.app.ui.components.NeomorphicTextField
import com.breaktime.app.ui.components.PrimaryGradientButton
import com.breaktime.app.ui.theme.PrimaryAccent
import com.breaktime.app.ui.theme.PrimaryText
import com.breaktime.app.ui.theme.RaisedCardSurface
import com.breaktime.app.ui.theme.SecondaryText

@Composable
fun ProfileSetupScreen(
    viewModel: ProfileSetupViewModel,
    onProfileSetupSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val scrollState = rememberScrollState()

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) {
            onProfileSetupSuccess()
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
            Spacer(modifier = Modifier.height(28.dp))

            // 1. Branding
            BreakTimeLogo(
                modifier = Modifier.padding(top = 8.dp),
                showText = true
            )

            Spacer(modifier = Modifier.height(32.dp))

            // 2. Heading
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.Start
            ) {
                Text(
                    text = "Complete your profile",
                    style = MaterialTheme.typography.headlineMedium,
                    color = PrimaryText,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Tell your people how to recognize you on BreakTime.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = SecondaryText,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            // 3. Form Inputs
            NeomorphicTextField(
                value = uiState.fullName,
                onValueChange = viewModel::onFullNameChange,
                label = "Display name",
                placeholder = "e.g. Alex Morgan",
                leadingIcon = Icons.Outlined.Person,
                isError = uiState.fullNameError != null,
                errorMessage = uiState.fullNameError,
                keyboardOptions = KeyboardOptions(
                    capitalization = KeyboardCapitalization.Words,
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Next
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            NeomorphicTextField(
                value = uiState.bio,
                onValueChange = viewModel::onBioChange,
                label = "Status / Vibe (optional)",
                placeholder = "e.g. Always down for chai or a night ride",
                leadingIcon = Icons.Outlined.ChatBubbleOutline,
                keyboardOptions = KeyboardOptions(
                    capitalization = KeyboardCapitalization.Sentences,
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Done
                ),
                keyboardActions = KeyboardActions(
                    onDone = {
                        keyboardController?.hide()
                        viewModel.submitProfile()
                    }
                )
            )

            Spacer(modifier = Modifier.height(32.dp))

            // 4. Primary Button
            PrimaryGradientButton(
                text = "Complete & Enter BreakTime",
                isLoading = uiState.isLoading,
                enabled = !uiState.isLoading,
                onClick = {
                    keyboardController?.hide()
                    viewModel.submitProfile()
                }
            )

            Spacer(modifier = Modifier.height(32.dp))
        }

        // Error Dialog
        if (uiState.generalError != null) {
            AlertDialog(
                onDismissRequest = viewModel::clearGeneralError,
                title = {
                    Text(
                        text = "Profile Notice",
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
                    TextButton(onClick = viewModel::clearGeneralError) {
                        Text("OK", color = PrimaryAccent, fontWeight = FontWeight.Bold)
                    }
                },
                containerColor = RaisedCardSurface
            )
        }
    }
}
