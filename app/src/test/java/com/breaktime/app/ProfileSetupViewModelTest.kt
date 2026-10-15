package com.breaktime.app

import com.breaktime.app.domain.auth.AuthUser
import com.breaktime.app.fakes.FakeAuthRepository
import com.breaktime.app.ui.auth.ProfileSetupViewModel
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
class ProfileSetupViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var fakeRepository: FakeAuthRepository
    private lateinit var viewModel: ProfileSetupViewModel

    @Before
    fun setup() {
        fakeRepository = FakeAuthRepository()
        viewModel = ProfileSetupViewModel(fakeRepository)
    }

    @Test
    fun testInitialState() {
        val state = viewModel.uiState.value
        assertEquals("", state.fullName)
        assertEquals("", state.bio)
        assertFalse(state.isLoading)
        assertFalse(state.isSuccess)
        assertNull(state.fullNameError)
        assertNull(state.generalError)
    }

    @Test
    fun testSubmitProfile_emptyName_failsValidation() {
        viewModel.onFullNameChange("")
        viewModel.submitProfile()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertFalse(state.isSuccess)
        assertEquals("Display name is required", state.fullNameError)
    }

    @Test
    fun testSubmitProfile_shortName_failsValidation() {
        viewModel.onFullNameChange("A")
        viewModel.submitProfile()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertFalse(state.isSuccess)
        assertEquals("Display name must be at least 2 characters", state.fullNameError)
    }

    @Test
    fun testSubmitProfile_validName_success() {
        viewModel.onFullNameChange("Jordan Lee")
        viewModel.onBioChange("Chai and code")
        viewModel.submitProfile()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertTrue(state.isSuccess)
        assertNull(state.fullNameError)
        assertEquals("Jordan Lee", fakeRepository.getCurrentUser()?.fullName)
    }

    @Test
    fun testSubmitProfile_repositoryError_showsError() {
        fakeRepository.shouldFail = true
        fakeRepository.failureMessage = "Database error"

        viewModel.onFullNameChange("Jordan Lee")
        viewModel.submitProfile()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertFalse(state.isSuccess)
        assertEquals("Database error", state.generalError)
    }
}
