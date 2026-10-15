package com.breaktime.app.domain.contact

/**
 * Result representing the outcome of an instant one-tap or activity Break invitation.
 */
sealed interface InvitationResult {

    /**
     * Successfully queued or delivered an invitation.
     *
     * @param invitationId Unique identifier for this invitation attempt.
     * @param contactId Recipient contact identifier.
     * @param activityId Identifier of the selected activity.
     * @param activityTitle Human-readable name of the selected activity.
     * @param message User-facing status summary.
     * @param isLiveBackendDelivery True if confirmed by a live backend, false if operating in safe development simulation.
     */
    data class Success(
        val invitationId: String,
        val contactId: String,
        val activityId: String = "default_break",
        val activityTitle: String = "Break",
        val message: String,
        val isLiveBackendDelivery: Boolean = false
    ) : InvitationResult

    /**
     * Invitation operation failed.
     *
     * @param contactId Recipient contact identifier.
     * @param errorMessage Descriptive explanation of why the action could not be completed.
     * @param cause Underlying exception if available.
     */
    data class Failure(
        val contactId: String,
        val errorMessage: String,
        val cause: Throwable? = null
    ) : InvitationResult
}
