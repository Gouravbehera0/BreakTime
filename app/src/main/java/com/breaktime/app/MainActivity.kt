package com.breaktime.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.lifecycleScope
import com.breaktime.app.data.activity.DefaultActivityRepository
import com.breaktime.app.data.auth.SupabaseAuthRepository
import com.breaktime.app.data.contact.DefaultContactRepository
import com.breaktime.app.data.contact.DefaultInvitationRepository
import com.breaktime.app.data.contact.SharedPrefsPinPreferencesRepository
import com.breaktime.app.data.friends.DefaultFriendRepository
import com.breaktime.app.data.friends.PhoneContactReader
import com.breaktime.app.navigation.AppNavGraph
import com.breaktime.app.ui.theme.BreakTimeTheme

class MainActivity : ComponentActivity() {

    private val authRepository by lazy {
        SupabaseAuthRepository(lifecycleScope)
    }

    private val pinPreferencesRepository by lazy {
        SharedPrefsPinPreferencesRepository(applicationContext)
    }

    private val contactRepository by lazy {
        DefaultContactRepository(pinPreferencesRepository)
    }

    private val invitationRepository by lazy {
        DefaultInvitationRepository(authRepository)
    }

    private val activityRepository by lazy {
        DefaultActivityRepository(applicationContext)
    }

    private val friendRepository by lazy {
        DefaultFriendRepository()
    }

    private val phoneContactReader by lazy {
        PhoneContactReader(applicationContext)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            BreakTimeTheme {
                AppNavGraph(
                    authRepository = authRepository,
                    contactRepository = contactRepository,
                    invitationRepository = invitationRepository,
                    activityRepository = activityRepository,
                    friendRepository = friendRepository,
                    phoneContactReader = phoneContactReader
                )
            }
        }
    }
}
