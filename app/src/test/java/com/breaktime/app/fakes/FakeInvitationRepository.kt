package com.breaktime.app.fakes

import com.breaktime.app.data.contact.InvitationRepository
import com.breaktime.app.domain.contact.InvitationResult
import kotlinx.coroutines.delay

class FakeInvitationRepository : InvitationRepository {

    var isConfigured: Boolean = true
    var shouldFail: Boolean = false
    var failureMessage: String = "Invitation delivery failed"
    var delayMs: Long = 0L

    val sentInvitations = mutableListOf<String>()
    val sentActivities = mutableListOf<Pair<String, String>>()

    override suspend fun sendDefaultInvitation(contactId: String, senderUserId: String): InvitationResult {
        return sendActivityInvitation(contactId, senderUserId, "default_break", "Break")
    }

    override suspend fun sendActivityInvitation(
        contactId: String,
        senderUserId: String,
        activityId: String,
        activityTitle: String,
        customNote: String?
    ): InvitationResult {
        if (delayMs > 0) {
            delay(delayMs)
        }

        return if (shouldFail) {
            InvitationResult.Failure(contactId, failureMessage)
        } else {
            sentInvitations.add(contactId)
            sentActivities.add(Pair(contactId, activityId))
            InvitationResult.Success(
                invitationId = "fake_inv_${sentInvitations.size}",
                contactId = contactId,
                activityId = activityId,
                activityTitle = activityTitle,
                message = "Invitation for $activityTitle sent successfully!",
                isLiveBackendDelivery = isConfigured
            )
        }
    }

    override fun isBackendConfigured(): Boolean = isConfigured
}
