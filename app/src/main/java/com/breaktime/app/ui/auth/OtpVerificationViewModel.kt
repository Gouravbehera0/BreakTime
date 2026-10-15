package com.breaktime.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breaktime.app.data.auth.AuthRepository
import com.breaktime.app.domain.auth.AuthUser
import com.breaktime.app.domain.auth.ValidationUtils
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class OtpVerificationUiState(
    val phone: String = "",
    val otpCode: String = "",
    val otpError: String? = null,
    val isVerifying: Boolean = false,
    val isResending: Boolean = false,
    val resendCooldownSeconds: Int = 60,
    val canResend: Boolean = false,
    val verificationSuccessUser: AuthUser? = null,
    val infoMessage: String? = null,
    val generalError: String? = null
) {
    val isCodeComplete: Boolean
        get() = otpCode.length == 6 && otpCode.all { it.isDigit() }

    val formattedCooldown: String
        get() {
            val minutes = resendCooldownSeconds / 60
            val seconds = resendCooldownSeconds % 60
            return String.format("%02d:%02d", minutes, seconds)
        }
}

class OtpVerificationViewModel(
    private val phone: String,
    private val authRepository: AuthRepository,
    initialCooldownSeconds: Int = 60
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        OtpVerificationUiState(
            phone = phone,
            resendCooldownSeconds = initialCooldownSeconds
        )
    )
    val uiState: StateFlow<OtpVerificationUiState> = _uiState.asStateFlow()

    private var cooldownJob: Job? = null

    init {
        startCooldownTimer(initialCooldownSeconds)
    }

    fun onOtpChange(newCode: String) {
        val filtered = newCode.filter { it.isDigit() }.take(6)
        _uiState.update {
            it.copy(
                otpCode = filtered,
                otpError = null,
                generalError = null
            )
        }
    }

    fun verifyOtp() {
        val state = _uiState.value
        if (state.isVerifying) return

        // Validate code length
        val validation = ValidationUtils.validateOtp(state.otpCode)
        if (!validation.isValid) {
            _uiState.update { it.copy(otpError = validation.errorMessage) }
            return
        }

        _uiState.update {
            it.copy(
                isVerifying = true,
                otpError = null,
                generalError = null
            )
        }

        viewModelScope.launch {
            val result = authRepository.verifyPhoneOtp(phone, state.otpCode)
            result.fold(
                onSuccess = { user ->
                    _uiState.update {
                        it.copy(
                            isVerifying = false,
                            verificationSuccessUser = user
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isVerifying = false,
                            otpError = error.message ?: "Verification failed. Check the code and try again."
                        )
                    }
                }
            )
        }
    }

    fun resendOtp() {
        val state = _uiState.value
        if (!state.canResend || state.isResending) return

        _uiState.update {
            it.copy(
                isResending = true,
                otpError = null,
                generalError = null
            )
        }

        viewModelScope.launch {
            val result = authRepository.requestPhoneOtp(phone)
            result.fold(
                onSuccess = {
                    _uiState.update {
                        it.copy(
                            isResending = false,
                            infoMessage = "If your number can receive SMS, a verification code will be sent."
                        )
                    }
                    startCooldownTimer(60)
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isResending = false,
                            generalError = error.message ?: "Failed to resend verification code. Please wait."
                        )
                    }
                }
            )
        }
    }

    private fun startCooldownTimer(durationSeconds: Int) {
        cooldownJob?.cancel()
        _uiState.update {
            it.copy(
                resendCooldownSeconds = durationSeconds,
                canResend = durationSeconds <= 0
            )
        }

        if (durationSeconds <= 0) return

        cooldownJob = viewModelScope.launch {
            var remaining = durationSeconds
            while (remaining > 0) {
                delay(1000L)
                remaining--
                _uiState.update {
                    it.copy(
                        resendCooldownSeconds = remaining,
                        canResend = remaining == 0
                    )
                }
            }
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(generalError = null, infoMessage = null) }
    }

    override fun onCleared() {
        super.onCleared()
        cooldownJob?.cancel()
    }
}
