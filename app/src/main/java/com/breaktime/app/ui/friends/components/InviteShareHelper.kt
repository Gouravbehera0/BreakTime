package com.breaktime.app.ui.friends.components

import android.content.Context
import android.content.Intent

/**
 * Helper to share an invitation via Android's native share sheet.
 *
 * Requirements:
 * - Uses native Android sharing functionality.
 * - Does NOT send automatic SMS or messages.
 * - Leaves destination choice completely to the user.
 */
object InviteShareHelper {

    private const val DEFAULT_INVITE_MESSAGE =
        "Hey! I'm using BreakTime to make spontaneous plans with friends. Join me and let's take a break together!\n\nhttps://breaktime.app/download"

    fun shareInvite(context: Context, contactName: String? = null) {
        val message = if (!contactName.isNullOrBlank()) {
            "Hey $contactName! I'm using BreakTime to make spontaneous plans with friends. Join me and let's take a break together!\n\nhttps://breaktime.app/download"
        } else {
            DEFAULT_INVITE_MESSAGE
        }

        val sendIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, message)
            type = "text/plain"
        }

        val shareIntent = Intent.createChooser(sendIntent, "Invite to BreakTime")
        context.startActivity(shareIntent)
    }
}
