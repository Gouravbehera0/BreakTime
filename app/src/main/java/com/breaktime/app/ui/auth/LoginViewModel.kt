package com.breaktime.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breaktime.app.data.auth.AuthRepository
import com.breaktime.app.data.auth.SupabaseConfig
import com.breaktime.app.domain.auth.CountryCode
import com.breaktime.app.domain.auth.CountryCodeData
import com.breaktime.app.domain.auth.ValidationUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class AuthMethod {
    PHONE,
    EMAIL
}

data class LoginUiState(
    // Auth Method Switch
    val authMethod: AuthMethod = AuthMethod.PHONE,

    // Phone State
    val phoneNumber: String = "",
    val phoneNumberError: String? = null,
    val selectedCountry: CountryCode = CountryCodeData.DEFAULT_COUNTRY,
    val isCountryPickerOpen: Boolean = false,
    val navigateToOtpPhone: String? = null,

    // Email State
    val email: String = "",
    val emailError: String? = null,
    val password: String = "",
    val passwordError: String? = null,
    val isPasswordVisible: Boolean = false,
    val rememberMe: Boolean = true,

    // Common State
    val isLoading: Boolean = false,
    val generalError: String? = null,
    val infoMessage: String? = null,
    val isLoginSuccess: Boolean = false
)

class LoginViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onAuthMethodChange(method: AuthMethod) {
        _uiState.update {
            it.copy(
                authMethod = method,
                generalError = null,
                infoMessage = null
            )
        }
    }

    // Phone Auth handlers
    fun onPhoneNumberChange(newNumber: String) {
        _uiState.update {
            it.copy(
                phoneNumber = newNumber,
                phoneNumberError = null,
                generalError = null
            )
        }
    }

    fun onCountrySelected(country: CountryCode) {
        _uiState.update {
            it.copy(
                selectedCountry = country,
                phoneNumberError = null,
                isCountryPickerOpen = false
            )
        }
    }

    fun openCountryPicker() {
        _uiState.update { it.copy(isCountryPickerOpen = true) }
    }

    fun dismissCountryPicker() {
        _uiState.update { it.copy(isCountryPickerOpen = false) }
    }

    fun sendOtp() {
        val state = _uiState.value
        if (state.isLoading) return

        // 1. Client-side phone validation
        val validation = ValidationUtils.validatePhoneNumber(state.phoneNumber, state.selectedCountry)
        if (!validation.isValid) {
            _uiState.update { it.copy(phoneNumberError = validation.errorMessage) }
            return
        }

        // 2. Normalize to E.164
        val normalized = ValidationUtils.normalizePhoneNumber(state.phoneNumber, state.selectedCountry)

        // 3. Check if backend is configured
        if (!authRepository.isBackendConfigured()) {
            _uiState.update {
                it.copy(
                    generalError = SupabaseConfig.CONFIGURATION_INSTRUCTIONS
                )
            }
            return
        }

        // 4. Request Phone OTP from Auth Provider
        _uiState.update { it.copy(isLoading = true, generalError = null, infoMessage = null) }

        viewModelScope.launch {
            val result = authRepository.requestPhoneOtp(normalized)
            result.fold(
                onSuccess = {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            navigateToOtpPhone = normalized,
                            infoMessage = "If your number can receive SMS, a verification code will be sent."
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            generalError = error.message ?: "Failed to send verification code. Please try again."
                        )
                    }
                }
            )
        }
    }

    fun onOtpNavigationHandled() {
        _uiState.update { it.copy(navigateToOtpPhone = null) }
    }

    // Email Auth handlers
    fun onEmailChange(newEmail: String) {
        _uiState.update {
            it.copy(
                email = newEmail,
                emailError = null,
                generalError = null
            )
        }
    }

    fun onPasswordChange(newPassword: String) {
        _uiState.update {
            it.copy(
                password = newPassword,
                passwordError = null,
                generalError = null
            )
        }
    }

    fun togglePasswordVisibility() {
        _uiState.update { it.copy(isPasswordVisible = !it.isPasswordVisible) }
    }

    fun onRememberMeChange(checked: Boolean) {
        _uiState.update { it.copy(rememberMe = checked) }
    }

    fun clearGeneralError() {
        _uiState.update { it.copy(generalError = null, infoMessage = null) }
    }

    fun login() {
        val email = _uiState.value.email.trim()
        val password = _uiState.value.password

        // 1. Client-side input validation
        val emailValidation = ValidationUtils.validateEmail(email)
        val passwordValidation = ValidationUtils.validatePassword(password)

        if (!emailValidation.isValid || !passwordValidation.isValid) {
            _uiState.update {
                it.copy(
                    emailError = emailValidation.errorMessage,
                    passwordError = passwordValidation.errorMessage
                )
            }
            return
        }

        // 2. Check if backend is configured
        if (!authRepository.isBackendConfigured()) {
            _uiState.update {
                it.copy(
                    generalError = SupabaseConfig.CONFIGURATION_INSTRUCTIONS
                )
            }
            return
        }

        // 3. Perform asynchronous Supabase authentication
        _uiState.update { it.copy(isLoading = true, generalError = null, infoMessage = null) }

        viewModelScope.launch {
            val result = authRepository.signInWithEmail(email, password)
            result.fold(
                onSuccess = {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isLoginSuccess = true
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            generalError = error.message ?: "Login failed. Please check your credentials."
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

    fun loginAsDemo() {
        _uiState.update {
            it.copy(
                isLoading = false,
                isLoginSuccess = true,
                generalError = null,
                infoMessage = null
            )
        }
    }
}
