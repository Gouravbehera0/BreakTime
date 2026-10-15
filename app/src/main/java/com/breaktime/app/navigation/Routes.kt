package com.breaktime.app.navigation

/**
 * Screen destination route definitions.
 */
object Routes {
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val FORGOT_PASSWORD = "forgot_password"
    const val OTP_VERIFY = "otp_verify/{phone}"
    const val PROFILE_SETUP = "profile_setup"
    const val HOME = "home"
    const val EXPLORE = "explore"
    const val CIRCLES = "circles"
    const val PROFILE = "profile"
    const val INVITATION = "invitation/{contactId}"

    fun createInvitationRoute(contactId: String): String = "invitation/$contactId"
    fun createOtpVerifyRoute(phone: String): String = "otp_verify/${java.net.URLEncoder.encode(phone, "UTF-8")}"
}
