package com.breaktime.app

import com.breaktime.app.domain.auth.ValidationUtils
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ValidationUtilsTest {

    @Test
    fun testValidEmail_passes() {
        val result = ValidationUtils.validateEmail("user@breaktime.app")
        assertTrue(result.isValid)
    }

    @Test
    fun testEmptyEmail_fails() {
        val result = ValidationUtils.validateEmail("")
        assertFalse(result.isValid)
        assertEquals("Email address is required", result.errorMessage)
    }

    @Test
    fun testInvalidEmailFormat_fails() {
        val resultNoAt = ValidationUtils.validateEmail("userbreaktime.app")
        assertFalse(resultNoAt.isValid)

        val resultNoDomain = ValidationUtils.validateEmail("user@")
        assertFalse(resultNoDomain.isValid)

        val resultInvalidSuffix = ValidationUtils.validateEmail("user@domain")
        assertFalse(resultInvalidSuffix.isValid)
    }

    @Test
    fun testValidPassword_passes() {
        val result = ValidationUtils.validatePassword("secret123")
        assertTrue(result.isValid)
    }

    @Test
    fun testShortPassword_fails() {
        val result = ValidationUtils.validatePassword("12345")
        assertFalse(result.isValid)
        assertEquals("Password must be at least 6 characters", result.errorMessage)
    }

    @Test
    fun testEmptyPassword_fails() {
        val result = ValidationUtils.validatePassword("")
        assertFalse(result.isValid)
        assertEquals("Password is required", result.errorMessage)
    }

    @Test
    fun testValidFullName_passes() {
        val result = ValidationUtils.validateFullName("Sarah Connor")
        assertTrue(result.isValid)
    }

    @Test
    fun testEmptyFullName_fails() {
        val result = ValidationUtils.validateFullName("")
        assertFalse(result.isValid)
        assertEquals("Full name is required", result.errorMessage)
    }

    @Test
    fun testMatchingPasswordConfirmation_passes() {
        val result = ValidationUtils.validatePasswordConfirmation("securePass1", "securePass1")
        assertTrue(result.isValid)
    }

    @Test
    fun testMismatchedPasswordConfirmation_fails() {
        val result = ValidationUtils.validatePasswordConfirmation("securePass1", "differentPass")
        assertFalse(result.isValid)
        assertEquals("Passwords do not match", result.errorMessage)
    }

    @Test
    fun testTermsValidation() {
        assertTrue(ValidationUtils.validateTerms(true).isValid)
        assertFalse(ValidationUtils.validateTerms(false).isValid)
    }

    @Test
    fun testValidPhoneNumber_passes() {
        val india = com.breaktime.app.domain.auth.CountryCodeData.DEFAULT_COUNTRY
        val result = ValidationUtils.validatePhoneNumber("9876543210", india)
        assertTrue(result.isValid)
    }

    @Test
    fun testValidPhoneNumberWithSpacesAndDashes_passes() {
        val india = com.breaktime.app.domain.auth.CountryCodeData.DEFAULT_COUNTRY
        val result = ValidationUtils.validatePhoneNumber("98765-43210", india)
        assertTrue(result.isValid)
    }

    @Test
    fun testEmptyPhoneNumber_fails() {
        val india = com.breaktime.app.domain.auth.CountryCodeData.DEFAULT_COUNTRY
        val result = ValidationUtils.validatePhoneNumber("", india)
        assertFalse(result.isValid)
        assertEquals("Enter a valid phone number", result.errorMessage)
    }

    @Test
    fun testShortPhoneNumber_fails() {
        val india = com.breaktime.app.domain.auth.CountryCodeData.DEFAULT_COUNTRY
        val result = ValidationUtils.validatePhoneNumber("12345", india)
        assertFalse(result.isValid)
        assertTrue(result.errorMessage!!.contains("at least 10 digits"))
    }

    @Test
    fun testPhoneNumberNormalization_E164() {
        val india = com.breaktime.app.domain.auth.CountryCodeData.DEFAULT_COUNTRY
        val normalized = ValidationUtils.normalizePhoneNumber("98765 43210", india)
        assertEquals("+919876543210", normalized)

        val us = com.breaktime.app.domain.auth.CountryCodeData.ALL_COUNTRIES.first { it.countryCode == "US" }
        val normalizedUs = ValidationUtils.normalizePhoneNumber("202-555-0199", us)
        assertEquals("+12025550199", normalizedUs)
    }

    @Test
    fun testValidOtp_passes() {
        val result = ValidationUtils.validateOtp("123456")
        assertTrue(result.isValid)
    }

    @Test
    fun testShortOrNonDigitOtp_fails() {
        val resultShort = ValidationUtils.validateOtp("123")
        assertFalse(resultShort.isValid)

        val resultAlpha = ValidationUtils.validateOtp("12a456")
        assertFalse(resultAlpha.isValid)
    }

    @Test
    fun testDisplayNameValidation() {
        assertTrue(ValidationUtils.validateDisplayName("Alex Rivera").isValid)
        assertFalse(ValidationUtils.validateDisplayName("").isValid)
        assertFalse(ValidationUtils.validateDisplayName("A").isValid)
    }
}
