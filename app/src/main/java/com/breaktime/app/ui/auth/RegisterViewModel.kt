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

data class RegisterUiState(
    val fullName: String = "",
    val fullNameError: String? = null,
    val email: String = "",
    val emailError: String? = null,
    val password: String = "",
    val passwordError: String? = null,
    val confirmPassword: String = "",
    val confirmPasswordError: String? = null,
    val isPasswordVisible: Boolean = false,
    val isConfirmPasswordVisible: Boolean = false,
    val agreeTerms: Boolean = false,
    val termsError: String? = null,
    val isLoading: Boolean = false,
    val generalError: String? = null,
    val infoMessage: String? = null,
    val isRegisterSuccess: Boolean = false
)

class RegisterViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(RegisterUiState())
    val uiState: StateFlow<RegisterUiState> = _uiState.asStateFlow()

    fun onFullNameChange(name: String) {
        _uiState.update { it.copy(fullName = name, fullNameError = null, generalError = null) }
    }

    fun onEmailChange(email: String) {
        _uiState.update { it.copy(email = email, emailError = null, generalError = null) }
    }

    fun onPasswordChange(password: String) {
        _uiState.update { it.copy(password = password, passwordError = null, generalError = null) }
    }

    fun onConfirmPasswordChange(confirm: String) {
        _uiState.update { it.copy(confirmPassword = confirm, confirmPasswordError = null, generalError = null) }
    }

    fun togglePasswordVisibility() {
        _uiState.update { it.copy(isPasswordVisible = !it.isPasswordVisible) }
    }

    fun toggleConfirmPasswordVisibility() {
        _uiState.update { it.copy(isConfirmPasswordVisible = !it.isConfirmPasswordVisible) }
    }

    fun onAgreeTermsChange(agreed: Boolean) {
        _uiState.update { it.copy(agreeTerms = agreed, termsError = null) }
    }

    fun clearGeneralError() {
        _uiState.update { it.copy(generalError = null, infoMessage = null) }
    }

    fun register() {
        val name = _uiState.value.fullName.trim()
        val email = _uiState.value.email.trim()
        val password = _uiState.value.password
        val confirm = _uiState.value.confirmPassword
        val terms = _uiState.value.agreeTerms

        val nameValidation = ValidationUtils.validateFullName(name)
        val emailValidation = ValidationUtils.validateEmail(email)
        val passwordValidation = ValidationUtils.validatePassword(password)
        val confirmValidation = ValidationUtils.validatePasswordConfirmation(password, confirm)
        val termsValidation = ValidationUtils.validateTerms(terms)

        if (!nameValidation.isValid || !emailValidation.isValid ||
            !passwordValidation.isValid || !confirmValidation.isValid ||
            !termsValidation.isValid
        ) {
            _uiState.update {
                it.copy(
                    fullNameError = nameValidation.errorMessage,
                    emailError = emailValidation.errorMessage,
                    passwordError = passwordValidation.errorMessage,
                    confirmPasswordError = confirmValidation.errorMessage,
                    termsError = termsValidation.errorMessage
                )
            }
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

        _uiState.update { it.copy(isLoading = true, generalError = null, infoMessage = null) }

        viewModelScope.launch {
            val result = authRepository.signUpWithEmail(email, password, name)
            result.fold(
                onSuccess = {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isRegisterSuccess = true
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            generalError = error.message ?: "Account registration failed."
                        )
                    }
                }
            )
        }
    }

    fun onGoogleSignInClicked() {
        if (!authRepository.isBackendConfigured()) {
            _uiState.update {
                it.copy(
                    infoMessage = "Google Sign-In requires Supabase OAuth configuration. Please add SUPABASE_URL and SUPABASE_ANON_KEY to local.properties."
                )
            }
        } else {
            _uiState.update {
                it.copy(
                    infoMessage = "To enable Google Sign-In, configure Google Provider in your Supabase Authentication dashboard."
                )
            }
        }
    }

    fun registerAsDemo() {
        _uiState.update {
            it.copy(
                isLoading = false,
                isRegisterSuccess = true,
                generalError = null,
                infoMessage = null
            )
        }
    }
}
