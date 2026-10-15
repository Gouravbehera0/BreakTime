package com.breaktime.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.breaktime.app.data.auth.AuthRepository
import com.breaktime.app.domain.auth.ValidationUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileSetupUiState(
    val fullName: String = "",
    val fullNameError: String? = null,
    val bio: String = "",
    val isLoading: Boolean = false,
    val generalError: String? = null,
    val isSuccess: Boolean = false
)

class ProfileSetupViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileSetupUiState())
    val uiState: StateFlow<ProfileSetupUiState> = _uiState.asStateFlow()

    fun onFullNameChange(newName: String) {
        _uiState.update {
            it.copy(
                fullName = newName,
                fullNameError = null,
                generalError = null
            )
        }
    }

    fun onBioChange(newBio: String) {
        _uiState.update { it.copy(bio = newBio) }
    }

    fun submitProfile() {
        val state = _uiState.value
        if (state.isLoading) return

        val validation = ValidationUtils.validateDisplayName(state.fullName)
        if (!validation.isValid) {
            _uiState.update { it.copy(fullNameError = validation.errorMessage) }
            return
        }

        _uiState.update { it.copy(isLoading = true, generalError = null) }

        viewModelScope.launch {
            val result = authRepository.updateUserProfile(state.fullName)
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
                            generalError = error.message ?: "Failed to save profile. Please try again."
                        )
                    }
                }
            )
        }
    }

    fun clearGeneralError() {
        _uiState.update { it.copy(generalError = null) }
    }
}
