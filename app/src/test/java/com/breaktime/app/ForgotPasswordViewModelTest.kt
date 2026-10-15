package com.breaktime.app

import com.breaktime.app.fakes.FakeAuthRepository
import com.breaktime.app.ui.auth.ForgotPasswordViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ForgotPasswordViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var fakeRepository: FakeAuthRepository
    private lateinit var viewModel: ForgotPasswordViewModel

    @Before
    fun setup() {
        fakeRepository = FakeAuthRepository()
        viewModel = ForgotPasswordViewModel(fakeRepository)
    }

    @Test
    fun testValidationFailure_emptyEmail() {
        viewModel.sendResetLink()

        val state = viewModel.uiState.value
        assertEquals("Email address is required", state.emailError)
        assertFalse(state.isSuccess)
    }

    @Test
    fun testSuccessfulReset() {
        viewModel.onEmailChange("user@breaktime.app")
        viewModel.sendResetLink()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertTrue(state.isSuccess)
        assertNull(state.generalError)
    }

    @Test
    fun testFailedReset() {
        fakeRepository.shouldFail = true
        fakeRepository.failureMessage = "Account not found"

        viewModel.onEmailChange("unknown@breaktime.app")
        viewModel.sendResetLink()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertFalse(state.isSuccess)
        assertEquals("Account not found", state.generalError)
    }
}
