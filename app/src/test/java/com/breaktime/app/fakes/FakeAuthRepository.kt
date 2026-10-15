package com.breaktime.app.fakes

import com.breaktime.app.data.auth.AuthRepository
import com.breaktime.app.domain.auth.AuthException
import com.breaktime.app.domain.auth.AuthState
import com.breaktime.app.domain.auth.AuthUser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class FakeAuthRepository : AuthRepository {

    var isConfigured: Boolean = true
    var shouldFail: Boolean = false
    var failureMessage: String = "Simulated authentication error"
    val requestedPhones = mutableListOf<String>()
    var expectedOtp: String = "123456"
    var isNewUserOnOtp: Boolean = false

    private val _authState = MutableStateFlow<AuthState>(AuthState.Unauthenticated)
    override val authState: StateFlow<AuthState> = _authState.asStateFlow()

    override fun isBackendConfigured(): Boolean = isConfigured

    override suspend fun signInWithEmail(email: String, password: String): Result<AuthUser> {
        return if (shouldFail) {
            Result.failure(AuthException(failureMessage))
        } else {
            val user = AuthUser(id = "user_123", email = email, fullName = "Test User", isEmailVerified = true)
            _authState.value = AuthState.Authenticated(user)
            Result.success(user)
        }
    }

    override suspend fun signUpWithEmail(
        email: String,
        password: String,
        fullName: String
    ): Result<AuthUser> {
        return if (shouldFail) {
            Result.failure(AuthException(failureMessage))
        } else {
            val user = AuthUser(id = "new_user_456", email = email, fullName = fullName, isEmailVerified = true)
            _authState.value = AuthState.Authenticated(user)
            Result.success(user)
        }
    }

    override suspend fun sendPasswordResetEmail(email: String): Result<Unit> {
        return if (shouldFail) {
            Result.failure(AuthException(failureMessage))
        } else {
            Result.success(Unit)
        }
    }

    override suspend fun requestPhoneOtp(phone: String): Result<Unit> {
        return if (shouldFail) {
            Result.failure(AuthException(failureMessage))
        } else {
            requestedPhones.add(phone)
            Result.success(Unit)
        }
    }

    override suspend fun verifyPhoneOtp(phone: String, token: String): Result<AuthUser> {
        return when {
            shouldFail -> Result.failure(AuthException(failureMessage))
            token != expectedOtp -> Result.failure(AuthException("That code isn't correct. Check it and try again."))
            else -> {
                val user = AuthUser(
                    id = "phone_user_789",
                    phone = phone,
                    fullName = if (isNewUserOnOtp) null else "Existing User",
                    isPhoneVerified = true
                )
                _authState.value = AuthState.Authenticated(user)
                Result.success(user)
            }
        }
    }

    override suspend fun updateUserProfile(fullName: String): Result<AuthUser> {
        return if (shouldFail) {
            Result.failure(AuthException(failureMessage))
        } else {
            val current = getCurrentUser() ?: AuthUser(id = "user_789")
            val updated = current.copy(fullName = fullName)
            _authState.value = AuthState.Authenticated(updated)
            Result.success(updated)
        }
    }

    override suspend fun signOut(): Result<Unit> {
        _authState.value = AuthState.Unauthenticated
        return Result.success(Unit)
    }

    override fun getCurrentUser(): AuthUser? =
        (_authState.value as? AuthState.Authenticated)?.user
}
