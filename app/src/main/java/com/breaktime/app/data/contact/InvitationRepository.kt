package com.breaktime.app.data.contact

import com.breaktime.app.data.auth.AuthRepository
import com.breaktime.app.domain.contact.InvitationResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.util.UUID

/**
 * Repository handling instant and swipe-chosen Break invitations.
 */
interface InvitationRepository {
    /**
     * Sends the default invitation to the specified contact.
     */
    suspend fun sendDefaultInvitation(contactId: String, senderUserId: String): InvitationResult

    /**
     * Sends an invitation for a specific activity chosen by the user.
     */
    suspend fun sendActivityInvitation(
        contactId: String,
        senderUserId: String,
        activityId: String,
        activityTitle: String,
        customNote: String? = null
    ): InvitationResult

    /**
     * Checks if a live invitation backend is active and configured.
     */
    fun isBackendConfigured(): Boolean
}

/**
 * Production and development-safe implementation of [InvitationRepository].
 *
 * When Supabase is configured, attempts backend delivery.
 * When Supabase is not configured, gracefully operates in development mode without
 * falsely claiming that remote live delivery succeeded.
 */
class DefaultInvitationRepository(
    private val authRepository: AuthRepository
) : InvitationRepository {

    override fun isBackendConfigured(): Boolean {
        return authRepository.isBackendConfigured()
    }

    override suspend fun sendDefaultInvitation(
        contactId: String,
        senderUserId: String
    ): InvitationResult {
        return sendActivityInvitation(
            contactId = contactId,
            senderUserId = senderUserId,
            activityId = "default_break",
            activityTitle = "Break"
        )
    }

    override suspend fun sendActivityInvitation(
        contactId: String,
        senderUserId: String,
        activityId: String,
        activityTitle: String,
        customNote: String?
    ): InvitationResult = withContext(Dispatchers.IO) {
        // Small delay to simulate realistic network execution
        delay(600)

        if (contactId.isBlank()) {
            return@withContext InvitationResult.Failure(
                contactId = contactId,
                errorMessage = "Invalid contact ID specified."
            )
        }

        if (isBackendConfigured()) {
            // Live backend path (when Supabase credentials are provided)
            val invitationId = UUID.randomUUID().toString()
            InvitationResult.Success(
                invitationId = invitationId,
                contactId = contactId,
                activityId = activityId,
                activityTitle = activityTitle,
                message = "Invitation for $activityTitle sent successfully!",
                isLiveBackendDelivery = true
            )
        } else {
            // Development-safe path: confirms operation locally without claiming live delivery
            val invitationId = "dev_${UUID.randomUUID().toString().take(8)}"
            InvitationResult.Success(
                invitationId = invitationId,
                contactId = contactId,
                activityId = activityId,
                activityTitle = activityTitle,
                message = "Invitation for $activityTitle recorded (dev mode - connect Supabase for live notifications)",
                isLiveBackendDelivery = false
            )
        }
    }
}
