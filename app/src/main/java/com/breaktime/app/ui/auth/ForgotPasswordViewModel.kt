package com.breaktime.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breaktime.app.data.auth.AuthRepository
import com.breaktime.app.data.auth.SupabaseConfig
import com.breaktime.app.domain.auth.ValidationUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ForgotPasswordUiState(
    val email: String = "",
    val emailError: String? = null,
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val generalError: String? = null
)

class ForgotPasswordViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ForgotPasswordUiState())
    val uiState: StateFlow<ForgotPasswordUiState> = _uiState.asStateFlow()

    fun onEmailChange(newEmail: String) {
        _uiState.update {
            it.copy(
                email = newEmail,
                emailError = null,
                generalError = null
            )
        }
    }

    fun clearGeneralError() {
        _uiState.update { it.copy(generalError = null) }
    }

    fun sendResetLink() {
        val email = _uiState.value.email.trim()
        val emailValidation = ValidationUtils.validateEmail(email)

        if (!emailValidation.isValid) {
            _uiState.update { it.copy(emailError = emailValidation.errorMessage) }
            return
        }

        if (!authRepository.isBackendConfigured()) {
            _uiState.update {
                it.copy(
                    generalError = SupabaseConfig.CONFIGURATION_INSTRUCTIONS
                )
            }
            return
        }

        _uiState.update { it.copy(isLoading = true, generalError = null) }

        viewModelScope.launch {
            val result = authRepository.sendPasswordResetEmail(email)
            result.fold(
                onSuccess = {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isSuccess = true
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            generalError = error.message ?: "Failed to send reset link."
                        )
                    }
                }
            )
        }
    }

    fun simulateResetInDemo() {
        _uiState.update {
            it.copy(
                isLoading = false,
                isSuccess = true,
                generalError = null
            )
        }
    }
}
