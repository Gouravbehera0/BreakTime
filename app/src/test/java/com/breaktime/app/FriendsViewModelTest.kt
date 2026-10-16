package com.breaktime.app

import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.RelationshipType
import com.breaktime.app.domain.friends.ContactPerson
import com.breaktime.app.domain.friends.DiscoveredContact
import com.breaktime.app.domain.friends.FriendRequest
import com.breaktime.app.domain.friends.FriendshipStatus
import com.breaktime.app.fakes.FakeAuthRepository
import com.breaktime.app.fakes.FakeContactReader
import com.breaktime.app.fakes.FakeFriendRepository
import com.breaktime.app.ui.friends.ContactPermissionState
import com.breaktime.app.ui.friends.FriendsViewModel
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
class FriendsViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var fakeFriendRepository: FakeFriendRepository
    private lateinit var fakeContactReader: FakeContactReader
    private lateinit var fakeAuthRepository: FakeAuthRepository
    private lateinit var viewModel: FriendsViewModel

    @Before
    fun setUp() {
        fakeFriendRepository = FakeFriendRepository()
        fakeContactReader = FakeContactReader()
        fakeAuthRepository = FakeAuthRepository()
    }

    private fun createViewModel(initialUserId: String = "user_me"): FriendsViewModel {
        return FriendsViewModel(
            friendRepository = fakeFriendRepository,
            phoneContactReader = fakeContactReader,
            authRepository = fakeAuthRepository,
            initialUserId = initialUserId
        )
    }

    @Test
    fun initialPermission_notGranted_stateIsNotRequested() = runTest {
        fakeContactReader.hasPermission = false
        viewModel = createViewModel()

        assertEquals(ContactPermissionState.NOT_REQUESTED, viewModel.uiState.value.permissionState)
        assertTrue(viewModel.uiState.value.discoveredContacts.isEmpty())
    }

    @Test
    fun initialPermission_granted_triggersScanAndMatching() = runTest {
        fakeContactReader.hasPermission = true
        fakeContactReader.contacts = listOf(
            ContactPerson("1", "Aisha Sen", listOf("+15550192834"))
        )
        fakeFriendRepository.registeredBreakTimePhones.add("+15550192834")

        viewModel = createViewModel()
        advanceUntilIdle()

        assertEquals(ContactPermissionState.GRANTED, viewModel.uiState.value.permissionState)
        assertEquals(1, viewModel.uiState.value.discoveredContacts.size)
        val discovered = viewModel.uiState.value.discoveredContacts.first()
        assertTrue(discovered.isBreakTimeUser)
        assertEquals("Aisha Sen", discovered.displayName)
    }

    @Test
    fun onPermissionResult_granted_scansContactsAndPopulatesBreakTimeAndInviteable() = runTest {
        fakeContactReader.hasPermission = false
        viewModel = createViewModel()

        fakeContactReader.hasPermission = true
        fakeContactReader.contacts = listOf(
            ContactPerson("1", "Aisha Sen", listOf("+15550192834")),
            ContactPerson("2", "Bob Unregistered", listOf("+15550001111"))
        )
        fakeFriendRepository.registeredBreakTimePhones.add("+15550192834")

        viewModel.onPermissionResult(isGranted = true)
        advanceUntilIdle()

        assertEquals(ContactPermissionState.GRANTED, viewModel.uiState.value.permissionState)
        assertEquals(2, viewModel.uiState.value.discoveredContacts.size)
        assertEquals(1, viewModel.uiState.value.breakTimeUsers.size)
        assertEquals(1, viewModel.uiState.value.inviteableContacts.size)
        assertEquals("Aisha Sen", viewModel.uiState.value.breakTimeUsers.first().displayName)
        assertEquals("Bob Unregistered", viewModel.uiState.value.inviteableContacts.first().displayName)
    }

    @Test
    fun onPermissionResult_deniedWithRationale_setsDeniedState() = runTest {
        viewModel = createViewModel()
        viewModel.onPermissionResult(isGranted = false, shouldShowRationale = true)

        assertEquals(ContactPermissionState.DENIED, viewModel.uiState.value.permissionState)
    }

    @Test
    fun onPermissionResult_permanentlyDenied_setsPermanentlyDeniedState() = runTest {
        viewModel = createViewModel()
        viewModel.onPermissionResult(isGranted = false, shouldShowRationale = false)

        assertEquals(ContactPermissionState.PERMANENTLY_DENIED, viewModel.uiState.value.permissionState)
    }

    @Test
    fun sendFriendRequest_success_updatesStatusToPendingSent() = runTest {
        fakeContactReader.hasPermission = true
        fakeContactReader.contacts = listOf(
            ContactPerson("1", "Rahul Sharma", listOf("+15550149921"))
        )
        fakeFriendRepository.registeredBreakTimePhones.add("+15550149921")
        viewModel = createViewModel()
        advanceUntilIdle()

        val contactToRequest = viewModel.uiState.value.breakTimeUsers.first()
        viewModel.sendFriendRequest(contactToRequest)
        advanceUntilIdle()

        val updated = viewModel.uiState.value.breakTimeUsers.first()
        assertEquals(FriendshipStatus.PENDING_SENT, updated.friendshipStatus)
        assertEquals("Friend request sent to Rahul Sharma!", viewModel.uiState.value.successMessage)
        assertEquals(1, viewModel.uiState.value.pendingRequests.size)
    }

    @Test
    fun sendFriendRequest_duplicatePrevention_doesNotResendIfAlreadyPending() = runTest {
        fakeContactReader.hasPermission = true
        fakeContactReader.contacts = listOf(
            ContactPerson("1", "Rahul Sharma", listOf("+15550149921"))
        )
        fakeFriendRepository.registeredBreakTimePhones.add("+15550149921")
        viewModel = createViewModel()
        advanceUntilIdle()

        val contactToRequest = viewModel.uiState.value.breakTimeUsers.first()
        viewModel.sendFriendRequest(contactToRequest)
        advanceUntilIdle()

        // Attempting to send again
        val updatedContact = viewModel.uiState.value.breakTimeUsers.first()
        viewModel.sendFriendRequest(updatedContact)
        advanceUntilIdle()

        // Should still only have 1 request
        assertEquals(1, viewModel.uiState.value.pendingRequests.size)
    }

    @Test
    fun acceptFriendRequest_movesFromPendingToConfirmedFriends() = runTest {
        val incomingRequest = FriendRequest(
            id = "req_101",
            requesterId = "user_incoming",
            recipientId = "user_me",
            otherUserId = "user_incoming",
            otherUserName = "Aisha Sen",
            isIncoming = true
        )
        fakeFriendRepository.setInitialRequests(listOf(incomingRequest))
        viewModel = createViewModel()
        advanceUntilIdle()

        assertEquals(1, viewModel.uiState.value.pendingRequests.size)
        assertEquals(0, viewModel.uiState.value.confirmedFriends.size)

        viewModel.acceptFriendRequest(incomingRequest)
        advanceUntilIdle()

        assertEquals(0, viewModel.uiState.value.pendingRequests.size)
        assertEquals(1, viewModel.uiState.value.confirmedFriends.size)
        assertEquals("Aisha Sen", viewModel.uiState.value.confirmedFriends.first().name)
        assertEquals("You and Aisha Sen are now friends!", viewModel.uiState.value.successMessage)
    }

    @Test
    fun declineFriendRequest_removesFromPending() = runTest {
        val incomingRequest = FriendRequest(
            id = "req_102",
            requesterId = "user_incoming",
            recipientId = "user_me",
            otherUserId = "user_incoming",
            otherUserName = "Stranger",
            isIncoming = true
        )
        fakeFriendRepository.setInitialRequests(listOf(incomingRequest))
        viewModel = createViewModel()
        advanceUntilIdle()

        viewModel.declineFriendRequest(incomingRequest)
        advanceUntilIdle()

        assertTrue(viewModel.uiState.value.pendingRequests.isEmpty())
        assertTrue(viewModel.uiState.value.confirmedFriends.isEmpty())
        assertEquals("Request declined.", viewModel.uiState.value.successMessage)
    }

    @Test
    fun cancelFriendRequest_removesFromPending() = runTest {
        val outgoingRequest = FriendRequest(
            id = "req_103",
            requesterId = "user_me",
            recipientId = "user_target",
            otherUserId = "user_target",
            otherUserName = "Target User",
            isIncoming = false
        )
        fakeFriendRepository.setInitialRequests(listOf(outgoingRequest))
        viewModel = createViewModel()
        advanceUntilIdle()

        viewModel.cancelFriendRequest(outgoingRequest)
        advanceUntilIdle()

        assertTrue(viewModel.uiState.value.pendingRequests.isEmpty())
        assertEquals("Request cancelled.", viewModel.uiState.value.successMessage)
    }

    @Test
    fun localSearchFilter_filtersConfirmedFriendsLocallyWithoutGlobalQuery() = runTest {
        val friends = listOf(
            Contact(id = "1", name = "Aisha Sen", relationship = RelationshipType.LOVER),
            Contact(id = "2", name = "Rahul Sharma", relationship = RelationshipType.BESTFRIENDS),
            Contact(id = "3", name = "Aryan Verma", relationship = RelationshipType.FRIENDS)
        )
        fakeFriendRepository.setInitialFriends(friends)
        viewModel = createViewModel()
        advanceUntilIdle()

        assertEquals(3, viewModel.uiState.value.filteredFriends.size)

        // Filter by "Rahul"
        viewModel.onSearchQueryChanged("Rahul")
        assertEquals(1, viewModel.uiState.value.filteredFriends.size)
        assertEquals("Rahul Sharma", viewModel.uiState.value.filteredFriends.first().name)

        // Filter by "a" matches all
        viewModel.onSearchQueryChanged("a")
        assertEquals(3, viewModel.uiState.value.filteredFriends.size)

        // Filter by non-existent friend
        viewModel.onSearchQueryChanged("Zack")
        assertEquals(0, viewModel.uiState.value.filteredFriends.size)
    }

    @Test
    fun backendFailure_displaysErrorMessageGracefully() = runTest {
        fakeContactReader.hasPermission = true
        fakeContactReader.contacts = listOf(
            ContactPerson("1", "Aisha Sen", listOf("+15550192834"))
        )
        fakeFriendRepository.shouldFail = true
        fakeFriendRepository.failureMessage = "Backend database connection timeout"

        viewModel = createViewModel()
        advanceUntilIdle()

        assertEquals("Backend database connection timeout", viewModel.uiState.value.errorMessage)
        assertFalse(viewModel.uiState.value.isMatchingContacts)
    }
}
