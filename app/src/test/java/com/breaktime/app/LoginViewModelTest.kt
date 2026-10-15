package com.breaktime.app

import com.breaktime.app.fakes.FakeAuthRepository
import com.breaktime.app.ui.auth.LoginViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var fakeRepository: FakeAuthRepository
    private lateinit var viewModel: LoginViewModel

    @Before
    fun setup() {
        fakeRepository = FakeAuthRepository()
        viewModel = LoginViewModel(fakeRepository)
    }

    @Test
    fun testInitialState() {
        val state = viewModel.uiState.value
        assertEquals("", state.email)
        assertEquals("", state.password)
        assertFalse(state.isPasswordVisible)
        assertTrue(state.rememberMe)
        assertFalse(state.isLoading)
        assertFalse(state.isLoginSuccess)
        assertNull(state.emailError)
        assertNull(state.passwordError)
        assertNull(state.generalError)
    }

    @Test
    fun testValidationFailure_emptyInputs() {
        viewModel.login()

        val state = viewModel.uiState.value
        assertEquals("Email address is required", state.emailError)
        assertEquals("Password is required", state.passwordError)
        assertFalse(state.isLoading)
        assertFalse(state.isLoginSuccess)
    }

    @Test
    fun testValidationFailure_invalidEmailFormat() {
        viewModel.onEmailChange("not-an-email")
        viewModel.onPasswordChange("password123")
        viewModel.login()

        val state = viewModel.uiState.value
        assertEquals("Please enter a valid email address", state.emailError)
        assertNull(state.passwordError)
        assertFalse(state.isLoginSuccess)
    }

    @Test
    fun testBackendNotConfigured_setsNotice() {
        fakeRepository.isConfigured = false
        viewModel.onEmailChange("valid@breaktime.app")
        viewModel.onPasswordChange("password123")
        viewModel.login()

        val state = viewModel.uiState.value
        assertNotNull(state.generalError)
        assertTrue(state.generalError!!.contains("Supabase credentials are not configured"))
        assertFalse(state.isLoginSuccess)
    }

    @Test
    fun testSuccessfulLogin() {
        viewModel.onEmailChange("user@breaktime.app")
        viewModel.onPasswordChange("password123")
        viewModel.login()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertTrue(state.isLoginSuccess)
        assertNull(state.generalError)
    }

    @Test
    fun testFailedLogin() {
        fakeRepository.shouldFail = true
        fakeRepository.failureMessage = "Invalid credentials"

        viewModel.onEmailChange("user@breaktime.app")
        viewModel.onPasswordChange("wrongpassword")
        viewModel.login()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertFalse(state.isLoginSuccess)
        assertEquals("Invalid credentials", state.generalError)
    }

    @Test
    fun testToggles() {
        viewModel.togglePasswordVisibility()
        assertTrue(viewModel.uiState.value.isPasswordVisible)
        viewModel.togglePasswordVisibility()
        assertFalse(viewModel.uiState.value.isPasswordVisible)

        viewModel.onRememberMeChange(false)
        assertFalse(viewModel.uiState.value.rememberMe)
    }

    @Test
    fun testPhoneAuthMethodSelection() {
        viewModel.onAuthMethodChange(com.breaktime.app.ui.auth.AuthMethod.EMAIL)
        assertEquals(com.breaktime.app.ui.auth.AuthMethod.EMAIL, viewModel.uiState.value.authMethod)

        viewModel.onAuthMethodChange(com.breaktime.app.ui.auth.AuthMethod.PHONE)
        assertEquals(com.breaktime.app.ui.auth.AuthMethod.PHONE, viewModel.uiState.value.authMethod)
    }

    @Test
    fun testCountrySelection() {
        val us = com.breaktime.app.domain.auth.CountryCodeData.ALL_COUNTRIES.first { it.countryCode == "US" }
        viewModel.onCountrySelected(us)
        assertEquals("US", viewModel.uiState.value.selectedCountry.countryCode)
        assertEquals("+1", viewModel.uiState.value.selectedCountry.dialCode)
    }

    @Test
    fun testSendOtp_emptyPhone_showsError() {
        viewModel.onPhoneNumberChange("")
        viewModel.sendOtp()

        val state = viewModel.uiState.value
        assertEquals("Enter a valid phone number", state.phoneNumberError)
        assertFalse(state.isLoading)
        assertNull(state.navigateToOtpPhone)
    }

    @Test
    fun testSendOtp_validPhone_requestsOtpAndNavigates() {
        viewModel.onPhoneNumberChange("9876543210")
        viewModel.sendOtp()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertEquals("+919876543210", state.navigateToOtpPhone)
        assertNull(state.phoneNumberError)
        assertEquals(1, fakeRepository.requestedPhones.size)
        assertEquals("+919876543210", fakeRepository.requestedPhones.first())

        viewModel.onOtpNavigationHandled()
        assertNull(viewModel.uiState.value.navigateToOtpPhone)
    }

    @Test
    fun testSendOtp_failedRequest_showsError() {
        fakeRepository.shouldFail = true
        fakeRepository.failureMessage = "Too many attempts"

        viewModel.onPhoneNumberChange("9876543210")
        viewModel.sendOtp()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertNull(state.navigateToOtpPhone)
        assertEquals("Too many attempts", state.generalError)
    }

    @Test
    fun testSendOtp_backendNotConfigured_showsNotice() {
        fakeRepository.isConfigured = false

        viewModel.onPhoneNumberChange("9876543210")
        viewModel.sendOtp()

        val state = viewModel.uiState.value
        assertNotNull(state.generalError)
        assertTrue(state.generalError!!.contains("Supabase credentials are not configured"))
        assertNull(state.navigateToOtpPhone)
    }
}
