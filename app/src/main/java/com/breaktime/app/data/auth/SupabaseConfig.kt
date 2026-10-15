package com.breaktime.app.data.auth

import com.breaktime.app.BuildConfig

/**
 * Holder and validator for Supabase credentials.
 */
object SupabaseConfig {

    val supabaseUrl: String
        get() = BuildConfig.SUPABASE_URL.trim()

    val supabaseAnonKey: String
        get() = BuildConfig.SUPABASE_ANON_KEY.trim()

    /**
     * Checks if both URL and Anon Key are present and appear valid.
     */
    fun isConfigured(): Boolean {
        val url = supabaseUrl
        val key = supabaseAnonKey
        return url.isNotEmpty() &&
                key.isNotEmpty() &&
                url.startsWith("https://") &&
                !url.contains("your-project-id")
    }

    const val CONFIGURATION_INSTRUCTIONS =
        "Supabase credentials are not configured.\n\n" +
        "To enable authentication:\n" +
        "1. Open or create local.properties in the project root.\n" +
        "2. Add your credentials:\n" +
        "   SUPABASE_URL=https://<your-project>.supabase.co\n" +
        "   SUPABASE_ANON_KEY=<your-anon-key>\n" +
        "3. Sync Gradle and rebuild the app."
}
