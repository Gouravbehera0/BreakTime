package com.breaktime.app

import com.breaktime.app.fakes.FakeAuthRepository
import com.breaktime.app.ui.auth.RegisterViewModel
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
class RegisterViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var fakeRepository: FakeAuthRepository
    private lateinit var viewModel: RegisterViewModel

    @Before
    fun setup() {
        fakeRepository = FakeAuthRepository()
        viewModel = RegisterViewModel(fakeRepository)
    }

    @Test
    fun testValidationFailure_emptyFields() {
        viewModel.register()

        val state = viewModel.uiState.value
        assertEquals("Full name is required", state.fullNameError)
        assertEquals("Email address is required", state.emailError)
        assertEquals("Password is required", state.passwordError)
        assertEquals("Please confirm your password", state.confirmPasswordError)
        assertEquals("You must agree to the Terms of Service and Privacy Policy", state.termsError)
        assertFalse(state.isRegisterSuccess)
    }

    @Test
    fun testValidationFailure_passwordMismatch() {
        viewModel.onFullNameChange("Alex Stone")
        viewModel.onEmailChange("alex@breaktime.app")
        viewModel.onPasswordChange("password123")
        viewModel.onConfirmPasswordChange("differentPass")
        viewModel.onAgreeTermsChange(true)
        viewModel.register()

        val state = viewModel.uiState.value
        assertEquals("Passwords do not match", state.confirmPasswordError)
        assertFalse(state.isRegisterSuccess)
    }

    @Test
    fun testSuccessfulRegistration() {
        viewModel.onFullNameChange("Alex Stone")
        viewModel.onEmailChange("alex@breaktime.app")
        viewModel.onPasswordChange("password123")
        viewModel.onConfirmPasswordChange("password123")
        viewModel.onAgreeTermsChange(true)
        viewModel.register()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertTrue(state.isRegisterSuccess)
        assertNull(state.generalError)
    }

    @Test
    fun testRegistration_backendError() {
        fakeRepository.shouldFail = true
        fakeRepository.failureMessage = "Email already registered"

        viewModel.onFullNameChange("Alex Stone")
        viewModel.onEmailChange("alex@breaktime.app")
        viewModel.onPasswordChange("password123")
        viewModel.onConfirmPasswordChange("password123")
        viewModel.onAgreeTermsChange(true)
        viewModel.register()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertFalse(state.isRegisterSuccess)
        assertEquals("Email already registered", state.generalError)
    }
}
