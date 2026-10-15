package com.breaktime.app.domain.auth

/**
 * Validation utilities for user input in authentication forms.
 */
object ValidationUtils {

    private val EMAIL_REGEX = Regex(
        "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\$"
    )

    fun validateEmail(email: String): ValidationResult {
        val trimmed = email.trim()
        return when {
            trimmed.isEmpty() -> ValidationResult.Error("Email address is required")
            !EMAIL_REGEX.matches(trimmed) -> ValidationResult.Error("Please enter a valid email address")
            else -> ValidationResult.Success
        }
    }

    fun validatePassword(password: String): ValidationResult {
        return when {
            password.isEmpty() -> ValidationResult.Error("Password is required")
            password.length < 6 -> ValidationResult.Error("Password must be at least 6 characters")
            else -> ValidationResult.Success
        }
    }

    fun validateFullName(name: String): ValidationResult {
        val trimmed = name.trim()
        return when {
            trimmed.isEmpty() -> ValidationResult.Error("Full name is required")
            trimmed.length < 2 -> ValidationResult.Error("Please enter your full name")
            else -> ValidationResult.Success
        }
    }

    fun validatePasswordConfirmation(password: String, confirm: String): ValidationResult {
        return when {
            confirm.isEmpty() -> ValidationResult.Error("Please confirm your password")
            password != confirm -> ValidationResult.Error("Passwords do not match")
            else -> ValidationResult.Success
        }
    }

    fun validateTerms(accepted: Boolean): ValidationResult {
        return if (accepted) {
            ValidationResult.Success
        } else {
            ValidationResult.Error("You must agree to the Terms of Service and Privacy Policy")
        }
    }

    fun validatePhoneNumber(rawNumber: String, country: CountryCode): ValidationResult {
        val trimmed = rawNumber.trim()
        if (trimmed.isEmpty()) {
            return ValidationResult.Error("Enter a valid phone number")
        }
        val digitsOnly = extractDigits(trimmed)
        if (digitsOnly.isEmpty()) {
            return ValidationResult.Error("Enter a valid phone number")
        }
        val effectiveDigits = if (digitsOnly.startsWith("0") && digitsOnly.length > country.minLength) {
            digitsOnly.removePrefix("0")
        } else {
            digitsOnly
        }

        return when {
            effectiveDigits.length < country.minLength ->
                ValidationResult.Error("Phone number must have at least ${country.minLength} digits")
            effectiveDigits.length > country.maxLength ->
                ValidationResult.Error("Phone number cannot exceed ${country.maxLength} digits")
            else -> ValidationResult.Success
        }
    }

    fun normalizePhoneNumber(rawNumber: String, country: CountryCode): String {
        val digitsOnly = extractDigits(rawNumber.trim())
        val dialDigits = country.dialCode.removePrefix("+")
        val effectiveDigits = if (digitsOnly.startsWith("0") && digitsOnly.length > country.minLength) {
            digitsOnly.removePrefix("0")
        } else {
            digitsOnly
        }
        return if (effectiveDigits.startsWith(dialDigits) && effectiveDigits.length > dialDigits.length) {
            "+$effectiveDigits"
        } else {
            "+$dialDigits$effectiveDigits"
        }
    }

    private fun extractDigits(input: String): String {
        val sb = StringBuilder()
        for (ch in input) {
            if (ch.isDigit()) sb.append(ch)
        }
        return sb.toString()
    }

    fun validateOtp(otp: String): ValidationResult {
        val trimmed = otp.trim()
        return when {
            trimmed.isEmpty() -> ValidationResult.Error("Please enter the 6-digit verification code")
            trimmed.length != 6 || !trimmed.all { it.isDigit() } ->
                ValidationResult.Error("Verification code must be exactly 6 digits")
            else -> ValidationResult.Success
        }
    }

    fun validateDisplayName(name: String): ValidationResult {
        val trimmed = name.trim()
        return when {
            trimmed.isEmpty() -> ValidationResult.Error("Display name is required")
            trimmed.length < 2 -> ValidationResult.Error("Display name must be at least 2 characters")
            trimmed.length > 30 -> ValidationResult.Error("Display name cannot exceed 30 characters")
            else -> ValidationResult.Success
        }
    }
}

sealed interface ValidationResult {
    data object Success : ValidationResult
    data class Error(val message: String) : ValidationResult

    val isValid: Boolean get() = this is Success
    val errorMessage: String? get() = (this as? Error)?.message
}
