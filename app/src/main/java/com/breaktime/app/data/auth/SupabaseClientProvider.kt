package com.breaktime.app.data.auth

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest

/**
 * Central provider for the shared Supabase client instance.
 * Ensures a single SupabaseClient is reused across Auth, Friends, and Invitation repositories.
 */
object SupabaseClientProvider {

    val client: SupabaseClient? by lazy {
        if (SupabaseConfig.isConfigured()) {
            try {
                createSupabaseClient(
                    supabaseUrl = SupabaseConfig.supabaseUrl,
                    supabaseKey = SupabaseConfig.supabaseAnonKey
                ) {
                    install(Auth)
                    install(Postgrest)
                }
            } catch (e: Exception) {
                null
            }
        } else {
            null
        }
    }
}
