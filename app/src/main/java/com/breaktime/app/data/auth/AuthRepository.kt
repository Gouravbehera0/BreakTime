package com.breaktime.app.data.auth

import com.breaktime.app.domain.auth.AuthState
import com.breaktime.app.domain.auth.AuthUser
import kotlinx.coroutines.flow.StateFlow

/**
 * Authentication repository interface defining all user auth actions.
 */
interface AuthRepository {
    val authState: StateFlow<AuthState>

    /**
     * Checks if the underlying Supabase backend credentials have been configured.
     */
    fun isBackendConfigured(): Boolean

    /**
     * Authenticates a user with email and password.
     */
    suspend fun signInWithEmail(email: String, password: String): Result<AuthUser>

    /**
     * Registers a new user with full name, email, and password.
     */
    suspend fun signUpWithEmail(
        email: String,
        password: String,
        fullName: String
    ): Result<AuthUser>

    /**
     * Requests a password reset email for the given address.
     */
    suspend fun sendPasswordResetEmail(email: String): Result<Unit>

    /**
     * Signs out the current user session.
     */
    suspend fun signOut(): Result<Unit>

    /**
     * Requests a phone SMS OTP for the given normalized phone number (E.164).
     */
    suspend fun requestPhoneOtp(phone: String): Result<Unit>

    /**
     * Verifies the 6-digit SMS OTP code for the given phone number.
     */
    suspend fun verifyPhoneOtp(phone: String, token: String): Result<AuthUser>

    /**
     * Updates the authenticated user's profile display name in backend metadata.
     */
    suspend fun updateUserProfile(fullName: String): Result<AuthUser>

    /**
     * Returns the currently active authenticated user, or null if unauthenticated.
     */
    fun getCurrentUser(): AuthUser?
}
