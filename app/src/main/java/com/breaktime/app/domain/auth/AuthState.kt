package com.breaktime.app.domain.auth

/**
 * Representation of an authenticated user in BreakTime.
 */
data class AuthUser(
    val id: String,
    val email: String = "",
    val phone: String? = null,
    val fullName: String? = null,
    val createdAt: String? = null,
    val isPhoneVerified: Boolean = false,
    val isEmailVerified: Boolean = false
) {
    val isProfileComplete: Boolean
        get() = !fullName.isNullOrBlank()
}

/**
 * State representing the user's authentication status across the application.
 */
sealed interface AuthState {
    data object Initial : AuthState
    data object Loading : AuthState
    data class Authenticated(val user: AuthUser) : AuthState
    data object Unauthenticated : AuthState
    data class Error(val message: String) : AuthState
}

/**
 * Domain-level exception thrown when authentication fails.
 */
open class AuthException(
    override val message: String,
    override val cause: Throwable? = null
) : Exception(message, cause)

/**
 * Exception thrown when Supabase URL or Anon Key is missing from project configuration.
 */
class SupabaseNotConfiguredException(
    message: String = "Supabase credentials are not configured. Please supply SUPABASE_URL and SUPABASE_ANON_KEY in local.properties or environment variables."
) : AuthException(message)
