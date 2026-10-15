package com.breaktime.app

import com.breaktime.app.fakes.FakeAuthRepository
import com.breaktime.app.ui.auth.OtpVerificationViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class OtpVerificationViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var fakeRepository: FakeAuthRepository
    private lateinit var viewModel: OtpVerificationViewModel
    private val testPhone = "+919876543210"

    @Before
    fun setup() {
        fakeRepository = FakeAuthRepository()
        viewModel = OtpVerificationViewModel(
            phone = testPhone,
            authRepository = fakeRepository,
            initialCooldownSeconds = 60
        )
    }

    @Test
    fun testInitialState() {
        val state = viewModel.uiState.value
        assertEquals(testPhone, state.phone)
        assertEquals("", state.otpCode)
        assertFalse(state.isCodeComplete)
        assertFalse(state.isVerifying)
        assertFalse(state.canResend)
        assertEquals(60, state.resendCooldownSeconds)
        assertEquals("01:00", state.formattedCooldown)
    }

    @Test
    fun testOtpCodeEntry_filtersNonDigitsAndCapsAtSix() {
        viewModel.onOtpChange("12a34")
        assertEquals("1234", viewModel.uiState.value.otpCode)
        assertFalse(viewModel.uiState.value.isCodeComplete)

        viewModel.onOtpChange("12345678")
        assertEquals("123456", viewModel.uiState.value.otpCode)
        assertTrue(viewModel.uiState.value.isCodeComplete)
    }

    @Test
    fun testVerifyOtp_shortCode_showsError() {
        viewModel.onOtpChange("123")
        viewModel.verifyOtp()

        val state = viewModel.uiState.value
        assertNotNull(state.otpError)
        assertNull(state.verificationSuccessUser)
    }

    @Test
    fun testVerifyOtp_incorrectCode_fails() {
        fakeRepository.expectedOtp = "654321"
        viewModel.onOtpChange("123456")
        viewModel.verifyOtp()

        val state = viewModel.uiState.value
        assertFalse(state.isVerifying)
        assertNotNull(state.otpError)
        assertTrue(state.otpError!!.contains("That code isn't correct"))
        assertNull(state.verificationSuccessUser)
    }

    @Test
    fun testVerifyOtp_correctCode_existingUser_success() {
        fakeRepository.expectedOtp = "123456"
        fakeRepository.isNewUserOnOtp = false

        viewModel.onOtpChange("123456")
        viewModel.verifyOtp()

        val state = viewModel.uiState.value
        assertFalse(state.isVerifying)
        assertNull(state.otpError)
        assertNotNull(state.verificationSuccessUser)
        assertEquals("Existing User", state.verificationSuccessUser?.fullName)
        assertTrue(state.verificationSuccessUser!!.isProfileComplete)
    }

    @Test
    fun testVerifyOtp_correctCode_newUser_successWithIncompleteProfile() {
        fakeRepository.expectedOtp = "123456"
        fakeRepository.isNewUserOnOtp = true

        viewModel.onOtpChange("123456")
        viewModel.verifyOtp()

        val state = viewModel.uiState.value
        assertFalse(state.isVerifying)
        assertNull(state.otpError)
        assertNotNull(state.verificationSuccessUser)
        assertNull(state.verificationSuccessUser?.fullName)
        assertFalse(state.verificationSuccessUser!!.isProfileComplete)
    }

    @Test
    fun testCooldownCountdown_enablesResend() = runTest {
        // Create VM with short cooldown for test
        val quickVm = OtpVerificationViewModel(
            phone = testPhone,
            authRepository = fakeRepository,
            initialCooldownSeconds = 2
        )

        assertFalse(quickVm.uiState.value.canResend)

        advanceTimeBy(1100L)
        assertEquals(1, quickVm.uiState.value.resendCooldownSeconds)
        assertFalse(quickVm.uiState.value.canResend)

        advanceTimeBy(1100L)
        assertEquals(0, quickVm.uiState.value.resendCooldownSeconds)
        assertTrue(quickVm.uiState.value.canResend)
    }

    @Test
    fun testResendOtp_whenEnabled_restartsCooldown() = runTest {
        val quickVm = OtpVerificationViewModel(
            phone = testPhone,
            authRepository = fakeRepository,
            initialCooldownSeconds = 0
        )
        assertTrue(quickVm.uiState.value.canResend)

        quickVm.resendOtp()
        advanceUntilIdle()

        val state = quickVm.uiState.value
        assertFalse(state.isResending)
        assertNotNull(state.infoMessage)
        assertEquals(1, fakeRepository.requestedPhones.size)
        assertEquals(testPhone, fakeRepository.requestedPhones.first())
        // Cooldown reset to 60s
        assertEquals(60, state.resendCooldownSeconds)
        assertFalse(state.canResend)
    }
}
