package com.breaktime.app

import com.breaktime.app.data.contact.DefaultInvitationRepository
import com.breaktime.app.domain.contact.InvitationResult
import com.breaktime.app.fakes.FakeAuthRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class InvitationRepositoryTest {

    private lateinit var fakeAuthRepository: FakeAuthRepository
    private lateinit var invitationRepository: DefaultInvitationRepository

    @Before
    fun setup() {
        fakeAuthRepository = FakeAuthRepository()
        invitationRepository = DefaultInvitationRepository(fakeAuthRepository)
    }

    @Test
    fun testUnconfiguredBackend_returnsDevelopmentSafeResultWithoutClaimingLiveDelivery() = runTest {
        fakeAuthRepository.isConfigured = false

        val result = invitationRepository.sendDefaultInvitation("contact_1", "user_123")

        assertTrue(result is InvitationResult.Success)
        val success = result as InvitationResult.Success
        assertEquals("contact_1", success.contactId)
        assertFalse(
            "Must not claim live backend delivery when backend is unconfigured",
            success.isLiveBackendDelivery
        )
        assertTrue(success.message.contains("dev mode"))
    }

    @Test
    fun testConfiguredBackend_returnsLiveDeliverySuccess() = runTest {
        fakeAuthRepository.isConfigured = true

        val result = invitationRepository.sendDefaultInvitation("contact_2", "user_123")

        assertTrue(result is InvitationResult.Success)
        val success = result as InvitationResult.Success
        assertEquals("contact_2", success.contactId)
        assertTrue(success.isLiveBackendDelivery)
    }

    @Test
    fun testBlankContactId_returnsFailure() = runTest {
        val result = invitationRepository.sendDefaultInvitation("", "user_123")

        assertTrue(result is InvitationResult.Failure)
        val failure = result as InvitationResult.Failure
        assertEquals("Invalid contact ID specified.", failure.errorMessage)
    }
}
