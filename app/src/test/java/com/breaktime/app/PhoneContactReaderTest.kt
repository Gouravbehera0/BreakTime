package com.breaktime.app

import com.breaktime.app.data.friends.PhoneContactReader
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PhoneContactReaderTest {

    @Test
    fun normalizePhoneNumber_standardUSFormat_returnsNormalizedE164() {
        val raw = "(555) 019-2834"
        val normalized = PhoneContactReader.normalizePhoneNumber(raw, "+1")
        assertEquals("+15550192834", normalized)
    }

    @Test
    fun normalizePhoneNumber_withDashesAndSpaces_returnsNormalized() {
        val raw = "555-014-9921"
        val normalized = PhoneContactReader.normalizePhoneNumber(raw, "+1")
        assertEquals("+15550149921", normalized)
    }

    @Test
    fun normalizePhoneNumber_withExistingPlusPrefix_preservesInternationalCode() {
        val raw = "+44 7911 123456"
        val normalized = PhoneContactReader.normalizePhoneNumber(raw, "+1")
        assertEquals("+447911123456", normalized)
    }

    @Test
    fun normalizePhoneNumber_withIndiaCountryCode_returnsCorrectFormat() {
        val raw = "+91 98765 43210"
        val normalized = PhoneContactReader.normalizePhoneNumber(raw, "+1")
        assertEquals("+919876543210", normalized)
    }

    @Test
    fun normalizePhoneNumber_withDoubleZeroPrefix_convertsToPlus() {
        val raw = "00447911123456"
        val normalized = PhoneContactReader.normalizePhoneNumber(raw, "+1")
        assertEquals("+447911123456", normalized)
    }

    @Test
    fun normalizePhoneNumber_elevenDigitsStartingWithOneInUS_returnsPlusOneFormat() {
        val raw = "15550187743"
        val normalized = PhoneContactReader.normalizePhoneNumber(raw, "+1")
        assertEquals("+15550187743", normalized)
    }

    @Test
    fun normalizePhoneNumber_tooShort_returnsNull() {
        val raw = "12345"
        val normalized = PhoneContactReader.normalizePhoneNumber(raw, "+1")
        assertNull(normalized)
    }

    @Test
    fun normalizePhoneNumber_emptyOrWhitespace_returnsNull() {
        assertNull(PhoneContactReader.normalizePhoneNumber("", "+1"))
        assertNull(PhoneContactReader.normalizePhoneNumber("    ", "+1"))
    }

    @Test
    fun normalizePhoneNumber_alphabeticGarbage_returnsNull() {
        assertNull(PhoneContactReader.normalizePhoneNumber("abcdefgh", "+1"))
    }
}
