package com.breaktime.app

import com.breaktime.app.data.activity.DefaultActivityRepository
import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.RelationshipType
import com.breaktime.app.fakes.FakeAuthRepository
import com.breaktime.app.fakes.FakeContactRepository
import com.breaktime.app.fakes.FakeInvitationRepository
import com.breaktime.app.ui.invitation.InvitationViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class InvitationViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var fakeContactRepository: FakeContactRepository
    private lateinit var fakeInvitationRepository: FakeInvitationRepository
    private lateinit var activityRepository: DefaultActivityRepository
    private lateinit var fakeAuthRepository: FakeAuthRepository
    private lateinit var viewModel: InvitationViewModel

    private val testContact = Contact(
        id = "contact_moon",
        name = "Aisha Sen",
        privateNickname = "My Moon 💜",
        isOnline = true,
        relationship = RelationshipType.LOVER
    )

    @Before
    fun setup() {
        fakeContactRepository = FakeContactRepository(listOf(testContact))
        fakeInvitationRepository = FakeInvitationRepository()
        activityRepository = DefaultActivityRepository(sharedPreferences = null)
        fakeAuthRepository = FakeAuthRepository()

        viewModel = InvitationViewModel(
            contactId = "contact_moon",
            contactRepository = fakeContactRepository,
            invitationRepository = fakeInvitationRepository,
            activityRepository = activityRepository,
            authRepository = fakeAuthRepository,
            initialUserId = "user_me"
        )
    }

    @Test
    fun testInitialLoad_PopulatesContactAndActivities() = runTest {
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertNotNull(state.contact)
        assertEquals("contact_moon", state.contact?.id)
        assertTrue(state.activities.isNotEmpty())
        assertNotNull(state.selectedActivity)
    }

    @Test
    fun testSwipeInteraction_ChangesIndexOnly_NeverSendsInvitation() = runTest {
        advanceUntilIdle()

        val initialActivity = viewModel.uiState.value.selectedActivity
        assertNotNull(initialActivity)

        // User swipes to next activity (e.g. index 2)
        viewModel.onIndexChanged(2)
        advanceUntilIdle()

        val newActivity = viewModel.uiState.value.selectedActivity
        assertEquals(2, viewModel.uiState.value.selectedIndex)

        // Strict Requirement: Swiping or selecting an activity must NEVER dispatch an invitation
        assertEquals(
            "Swiping must NEVER send an invitation or notification",
            0,
            fakeInvitationRepository.sentInvitations.size
        )
    }

    @Test
    fun testSendInvitation_DispatchesSelectedActivityOnly() = runTest {
        advanceUntilIdle()

        // Select Night Ride
        val nightRideIndex = viewModel.uiState.value.activities.indexOfFirst { it.title.contains("NIGHT RIDE") }
        assertTrue(nightRideIndex >= 0)
        viewModel.onIndexChanged(nightRideIndex)

        val selected = viewModel.uiState.value.selectedActivity!!
        assertEquals("NIGHT RIDE", selected.title)

        // User taps SEND INVITATION
        viewModel.sendInvitation()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isSendingInvitation)
        assertTrue(state.isInvitationSentSuccess)
        assertNotNull(state.toastMessage)
        assertTrue(state.toastMessage!!.contains("NIGHT RIDE"))

        assertEquals(1, fakeInvitationRepository.sentInvitations.size)
        assertEquals("contact_moon", fakeInvitationRepository.sentActivities.first().first)
        assertEquals(selected.id, fakeInvitationRepository.sentActivities.first().second)
    }

    @Test
    fun testSendInvitation_PreventsDuplicateSubmissions() = runTest {
        advanceUntilIdle()

        viewModel.sendInvitation()
        advanceUntilIdle()

        // Subsequent tap should be prevented
        viewModel.sendInvitation()
        advanceUntilIdle()

        assertEquals(1, fakeInvitationRepository.sentInvitations.size)
    }

    @Test
    fun testCustomActivityLifecycle() = runTest {
        advanceUntilIdle()

        val initialCount = viewModel.uiState.value.activities.size

        // Add custom activity
        viewModel.saveCustomActivity(
            title = "STARGAZING",
            subtitle = "Laying under the open sky.",
            tags = listOf("Telescope night", "Hilltop")
        )
        advanceUntilIdle()

        val updatedActivities = viewModel.uiState.value.activities
        assertEquals(initialCount + 1, updatedActivities.size)
        assertTrue(updatedActivities.any { it.title == "STARGAZING" })
    }

    @Test
    fun testUnknownContactFallback_DefaultsToFriendAndEnforcesConsentFiltering() = runTest {
        val unknownViewModel = InvitationViewModel(
            contactId = "unknown_user_id",
            contactRepository = fakeContactRepository,
            invitationRepository = fakeInvitationRepository,
            activityRepository = activityRepository,
            authRepository = fakeAuthRepository,
            initialUserId = "user_me"
        )
        advanceUntilIdle()

        val state = unknownViewModel.uiState.value
        assertNotNull(state.contact)
        assertEquals("Friend", state.contact?.name)
        assertEquals(RelationshipType.FRIENDS, state.contact?.relationship)
        // Intimate activities like KISS and CUDDLE must NOT be accessible for non-lover
        assertFalse(state.activities.any { it.title.contains("KISS", ignoreCase = true) })
        assertFalse(state.activities.any { it.title.contains("CUDDLE", ignoreCase = true) })
    }
}

