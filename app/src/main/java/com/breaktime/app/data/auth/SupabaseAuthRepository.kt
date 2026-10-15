package com.breaktime.app.data.auth

import com.breaktime.app.domain.auth.AuthException
import com.breaktime.app.domain.auth.AuthState
import com.breaktime.app.domain.auth.AuthUser
import com.breaktime.app.domain.auth.SupabaseNotConfiguredException
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.OtpType
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.providers.builtin.OTP
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.createSupabaseClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class SupabaseAuthRepository(
    private val scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
) : AuthRepository {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Initial)
    override val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val supabaseClient: SupabaseClient? by lazy {
        if (SupabaseConfig.isConfigured()) {
            try {
                createSupabaseClient(
                    supabaseUrl = SupabaseConfig.supabaseUrl,
                    supabaseKey = SupabaseConfig.supabaseAnonKey
                ) {
                    install(Auth)
                }
            } catch (e: Exception) {
                null
            }
        } else {
            null
        }
    }

    init {
        initSessionListener()
    }

    private fun initSessionListener() {
        val client = supabaseClient
        if (client == null) {
            _authState.value = AuthState.Unauthenticated
            return
        }

        scope.launch {
            try {
                client.auth.sessionStatus.collect { status ->
                    _authState.value = when (status) {
                        is SessionStatus.Authenticated -> {
                            val user = status.session.user
                            AuthState.Authenticated(
                                AuthUser(
                                    id = user?.id.orEmpty(),
                                    email = user?.email.orEmpty(),
                                    phone = user?.phone,
                                    fullName = user?.userMetadata?.get("full_name")?.toString()?.trim('"'),
                                    createdAt = user?.createdAt?.toString(),
                                    isPhoneVerified = user?.phoneConfirmedAt != null,
                                    isEmailVerified = user?.emailConfirmedAt != null
                                )
                            )
                        }
                        is SessionStatus.Initializing -> AuthState.Loading
                        is SessionStatus.NotAuthenticated -> AuthState.Unauthenticated
                        else -> AuthState.Unauthenticated
                    }
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Unauthenticated
            }
        }
    }

    override fun isBackendConfigured(): Boolean {
        return SupabaseConfig.isConfigured()
    }

    override suspend fun signInWithEmail(email: String, password: String): Result<AuthUser> =
        withContext(Dispatchers.IO) {
            val client = supabaseClient
                ?: return@withContext Result.failure(SupabaseNotConfiguredException())

            try {
                client.auth.signInWith(Email) {
                    this.email = email.trim()
                    this.password = password
                }

                val current = client.auth.currentUserOrNull()
                if (current != null) {
                    val user = AuthUser(
                        id = current.id,
                        email = current.email.orEmpty(),
                        fullName = current.userMetadata?.get("full_name")?.toString()?.trim('"')
                    )
                    Result.success(user)
                } else {
                    Result.failure(AuthException("Sign in completed but session could not be retrieved"))
                }
            } catch (e: Exception) {
                val errorMsg = mapAuthErrorMessage(e)
                Result.failure(AuthException(errorMsg, e))
            }
        }

    override suspend fun signUpWithEmail(
        email: String,
        password: String,
        fullName: String
    ): Result<AuthUser> = withContext(Dispatchers.IO) {
        val client = supabaseClient
            ?: return@withContext Result.failure(SupabaseNotConfiguredException())

        try {
            val metadata = buildJsonObject {
                put("full_name", fullName.trim())
            }

            client.auth.signUpWith(Email) {
                this.email = email.trim()
                this.password = password
                this.data = metadata
            }

            val current = client.auth.currentUserOrNull()
            val user = AuthUser(
                id = current?.id.orEmpty(),
                email = email.trim(),
                fullName = fullName.trim()
            )
            Result.success(user)
        } catch (e: Exception) {
            val errorMsg = mapAuthErrorMessage(e)
            Result.failure(AuthException(errorMsg, e))
        }
    }

    override suspend fun sendPasswordResetEmail(email: String): Result<Unit> =
        withContext(Dispatchers.IO) {
            val client = supabaseClient
                ?: return@withContext Result.failure(SupabaseNotConfiguredException())

            try {
                client.auth.resetPasswordForEmail(email.trim())
                Result.success(Unit)
            } catch (e: Exception) {
                val errorMsg = mapAuthErrorMessage(e)
                Result.failure(AuthException(errorMsg, e))
            }
        }

    override suspend fun signOut(): Result<Unit> = withContext(Dispatchers.IO) {
        val client = supabaseClient
            ?: return@withContext Result.failure(SupabaseNotConfiguredException())

        try {
            client.auth.signOut()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(AuthException(e.message ?: "Sign out failed", e))
        }
    }

    override suspend fun requestPhoneOtp(phone: String): Result<Unit> = withContext(Dispatchers.IO) {
        val client = supabaseClient
            ?: return@withContext Result.failure(SupabaseNotConfiguredException())

        try {
            client.auth.signInWith(OTP) {
                this.phone = phone.trim()
                this.createUser = true
            }
            Result.success(Unit)
        } catch (e: Exception) {
            val errorMsg = mapAuthErrorMessage(e)
            Result.failure(AuthException(errorMsg, e))
        }
    }

    override suspend fun verifyPhoneOtp(phone: String, token: String): Result<AuthUser> = withContext(Dispatchers.IO) {
        val client = supabaseClient
            ?: return@withContext Result.failure(SupabaseNotConfiguredException())

        try {
            client.auth.verifyPhoneOtp(
                type = OtpType.Phone.SMS,
                phone = phone.trim(),
                token = token.trim()
            )

            val current = client.auth.currentUserOrNull()
            if (current != null) {
                val user = AuthUser(
                    id = current.id,
                    email = current.email.orEmpty(),
                    phone = current.phone,
                    fullName = current.userMetadata?.get("full_name")?.toString()?.trim('"'),
                    createdAt = current.createdAt?.toString(),
                    isPhoneVerified = current.phoneConfirmedAt != null,
                    isEmailVerified = current.emailConfirmedAt != null
                )
                _authState.value = AuthState.Authenticated(user)
                Result.success(user)
            } else {
                Result.failure(AuthException("OTP verification completed but session could not be established."))
            }
        } catch (e: Exception) {
            val errorMsg = mapAuthErrorMessage(e)
            Result.failure(AuthException(errorMsg, e))
        }
    }

    override suspend fun updateUserProfile(fullName: String): Result<AuthUser> = withContext(Dispatchers.IO) {
        val client = supabaseClient
            ?: return@withContext Result.failure(SupabaseNotConfiguredException())

        try {
            val trimmedName = fullName.trim()
            val updatedUser = client.auth.updateUser(updateCurrentUser = true) {
                data {
                    put("full_name", trimmedName)
                }
            }

            val user = AuthUser(
                id = updatedUser.id,
                email = updatedUser.email.orEmpty(),
                phone = updatedUser.phone,
                fullName = trimmedName,
                createdAt = updatedUser.createdAt?.toString(),
                isPhoneVerified = updatedUser.phoneConfirmedAt != null,
                isEmailVerified = updatedUser.emailConfirmedAt != null
            )
            _authState.value = AuthState.Authenticated(user)
            Result.success(user)
        } catch (e: Exception) {
            val errorMsg = mapAuthErrorMessage(e)
            Result.failure(AuthException(errorMsg, e))
        }
    }

    override fun getCurrentUser(): AuthUser? {
        val user = supabaseClient?.auth?.currentUserOrNull() ?: return null
        return AuthUser(
            id = user.id,
            email = user.email.orEmpty(),
            phone = user.phone,
            fullName = user.userMetadata?.get("full_name")?.toString()?.trim('"'),
            createdAt = user.createdAt?.toString(),
            isPhoneVerified = user.phoneConfirmedAt != null,
            isEmailVerified = user.emailConfirmedAt != null
        )
    }

    private fun mapAuthErrorMessage(e: Exception): String {
        val msg = e.message.orEmpty()
        return when {
            msg.contains("Invalid login credentials", ignoreCase = true) ->
                "Invalid email or password. Please check your credentials."
            msg.contains("User already registered", ignoreCase = true) ->
                "An account with this email already exists."
            msg.contains("Password should be at least", ignoreCase = true) ->
                "Password must be at least 6 characters long."
            msg.contains("Token has expired", ignoreCase = true) || msg.contains("otp_expired", ignoreCase = true) ->
                "This code has expired. Request a new one."
            msg.contains("Token is invalid", ignoreCase = true) || msg.contains("invalid token", ignoreCase = true) || msg.contains("otp_invalid", ignoreCase = true) ->
                "That code isn't correct. Check it and try again."
            msg.contains("rate limit", ignoreCase = true) || msg.contains("over_sms_send_rate_limit", ignoreCase = true) ->
                "Too many attempts. Please wait before trying again."
            msg.contains("Signups not allowed for otp", ignoreCase = true) ->
                "Signups via SMS are not enabled in your project settings."
            msg.contains("Network", ignoreCase = true) || msg.contains("ConnectException", ignoreCase = true) ->
                "You're offline. Check your internet connection and try again."
            else -> e.localizedMessage ?: "Authentication failed. Please try again."
        }
    }
}
