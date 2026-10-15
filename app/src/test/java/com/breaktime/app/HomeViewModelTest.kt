package com.breaktime.app

import com.breaktime.app.domain.contact.ContactFilter
import com.breaktime.app.fakes.FakeAuthRepository
import com.breaktime.app.fakes.FakeContactRepository
import com.breaktime.app.fakes.FakeInvitationRepository
import com.breaktime.app.ui.home.HomeViewModel
import com.breaktime.app.ui.home.components.DashboardTab
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
class HomeViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var fakeContactRepository: FakeContactRepository
    private lateinit var fakeInvitationRepository: FakeInvitationRepository
    private lateinit var fakeAuthRepository: FakeAuthRepository
    private lateinit var viewModel: HomeViewModel

    @Before
    fun setup() {
        fakeContactRepository = FakeContactRepository()
        fakeInvitationRepository = FakeInvitationRepository()
        fakeAuthRepository = FakeAuthRepository()

        viewModel = HomeViewModel(
            contactRepository = fakeContactRepository,
            invitationRepository = fakeInvitationRepository,
            authRepository = fakeAuthRepository,
            initialUserId = "test_user_1",
            initialUserName = "Test User"
        )
    }

    @Test
    fun testInitialLoadingAndCounts() = runTest {
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertEquals(5, state.allCount)
        assertEquals(3, state.onlineCount)
        assertEquals(2, state.offlineCount)
        assertEquals(3, state.pinnedCount)
        assertEquals(5, state.displayedContacts.size)

        // Verify deterministic sorting:
        // Priority 1: Aisha (Pinned, Online), Rahul (Pinned, Online)
        // Priority 2: Aryan (Unpinned, Online)
        // Priority 3: Rohan (Pinned, Offline)
        // Priority 4: Ananya (Unpinned, Offline)
        assertEquals("Aisha", state.displayedContacts[0].name)
        assertEquals("Rahul", state.displayedContacts[1].name)
        assertEquals("Aryan", state.displayedContacts[2].name)
        assertEquals("Rohan", state.displayedContacts[3].name)
        assertEquals("Ananya", state.displayedContacts[4].name)
    }

    @Test
    fun testFilterSelection_Online() = runTest {
        advanceUntilIdle()

        viewModel.onFilterSelected(ContactFilter.ONLINE)

        val state = viewModel.uiState.value
        assertEquals(ContactFilter.ONLINE, state.selectedFilter)
        assertEquals(3, state.displayedContacts.size)
        assertTrue(state.displayedContacts.all { it.isOnline })
    }

    @Test
    fun testFilterSelection_Offline() = runTest {
        advanceUntilIdle()

        viewModel.onFilterSelected(ContactFilter.OFFLINE)

        val state = viewModel.uiState.value
        assertEquals(ContactFilter.OFFLINE, state.selectedFilter)
        assertEquals(2, state.displayedContacts.size)
        assertTrue(state.displayedContacts.none { it.isOnline })
    }

    @Test
    fun testFilterSelection_Pinned() = runTest {
        advanceUntilIdle()

        viewModel.onFilterSelected(ContactFilter.PINNED)

        val state = viewModel.uiState.value
        assertEquals(ContactFilter.PINNED, state.selectedFilter)
        assertEquals(3, state.displayedContacts.size)
        assertTrue(state.displayedContacts.all { it.isPinned })
    }

    @Test
    fun testSearchQueryFiltering() = runTest {
        advanceUntilIdle()

        viewModel.onSearchQueryChanged("aryan")

        val state = viewModel.uiState.value
        assertEquals("aryan", state.searchQuery)
        assertEquals(1, state.displayedContacts.size)
        assertEquals("Aryan", state.displayedContacts.first().name)
    }

    @Test
    fun testSendInstantInvite_Success() = runTest {
        advanceUntilIdle()

        val contactId = "3" // Aryan
        viewModel.sendInstantInvite(contactId)

        // After coroutine executes
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.invitingContactIds.contains(contactId))
        assertTrue(state.invitedContactIds.contains(contactId))
        assertNotNull(state.toastMessage)
        assertTrue(state.toastMessage!!.contains("Invite sent"))
        assertEquals(1, fakeInvitationRepository.sentInvitations.size)
    }

    @Test
    fun testSendInstantInvite_PreventsDuplicates() = runTest {
        advanceUntilIdle()

        val contactId = "3"
        viewModel.sendInstantInvite(contactId)
        advanceUntilIdle()

        // Attempting to send invite again to the same contact
        viewModel.sendInstantInvite(contactId)
        advanceUntilIdle()

        // Should still only have sent 1 invitation
        assertEquals(1, fakeInvitationRepository.sentInvitations.size)
    }

    @Test
    fun testSendInstantInvite_Failure() = runTest {
        fakeInvitationRepository.shouldFail = true
        fakeInvitationRepository.failureMessage = "Network timeout"

        advanceUntilIdle()

        val contactId = "2"
        viewModel.sendInstantInvite(contactId)
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.invitingContactIds.contains(contactId))
        assertFalse(state.invitedContactIds.contains(contactId))
        assertEquals("Network timeout", state.toastMessage)
    }

    @Test
    fun testTogglePin() = runTest {
        advanceUntilIdle()

        // Aryan is initially unpinned
        val initialAryan = viewModel.uiState.value.allContacts.first { it.id == "3" }
        assertFalse(initialAryan.isPinned)

        viewModel.onTogglePin("3")
        advanceUntilIdle()

        val updatedAryan = viewModel.uiState.value.allContacts.first { it.id == "3" }
        assertTrue(updatedAryan.isPinned)
    }

    @Test
    fun testNavTabSelected_UpcomingFeaturesHandledExplicitly() = runTest {
        advanceUntilIdle()

        viewModel.onNavTabSelected(DashboardTab.EXPLORE)
        assertTrue(viewModel.uiState.value.toastMessage!!.contains("Explore"))

        viewModel.onNavTabSelected(DashboardTab.CIRCLES)
        assertTrue(viewModel.uiState.value.toastMessage!!.contains("Circles"))

        viewModel.onNavTabSelected(DashboardTab.CREATE_BREAK)
        assertTrue(viewModel.uiState.value.toastMessage!!.contains("Instant Break"))
    }
}
