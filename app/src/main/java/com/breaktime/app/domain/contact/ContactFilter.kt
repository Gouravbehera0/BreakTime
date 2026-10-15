package com.breaktime.app.domain.contact

/**
 * Filter categories for the "Your People" contact dashboard.
 */
enum class ContactFilter(val displayName: String) {
    ALL("All"),
    ONLINE("Online"),
    OFFLINE("Offline"),
    PINNED("Pinned")
}
