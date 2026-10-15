package com.breaktime.app.domain.auth

/**
 * Representation of a country calling code for phone authentication.
 */
data class CountryCode(
    val countryCode: String,
    val dialCode: String,
    val name: String,
    val flagEmoji: String,
    val minLength: Int,
    val maxLength: Int,
    val example: String
) {
    val displayLabel: String
        get() = "$flagEmoji $name ($dialCode)"
}

/**
 * Curated list of international country calling codes.
 * Default is India (+91) as required by project specification.
 */
object CountryCodeData {

    val DEFAULT_COUNTRY = CountryCode(
        countryCode = "IN",
        dialCode = "+91",
        name = "India",
        flagEmoji = "🇮🇳",
        minLength = 10,
        maxLength = 10,
        example = "98765 43210"
    )

    val ALL_COUNTRIES = listOf(
        DEFAULT_COUNTRY,
        CountryCode("US", "+1", "United States", "🇺🇸", 10, 10, "202 555 0199"),
        CountryCode("GB", "+44", "United Kingdom", "🇬🇧", 10, 11, "7911 123456"),
        CountryCode("CA", "+1", "Canada", "🇨🇦", 10, 10, "416 555 0199"),
        CountryCode("AU", "+61", "Australia", "🇦🇺", 9, 9, "412 345 678"),
        CountryCode("AE", "+971", "United Arab Emirates", "🇦🇪", 9, 9, "50 123 4567"),
        CountryCode("DE", "+49", "Germany", "🇩🇪", 10, 11, "1512 3456789"),
        CountryCode("FR", "+33", "France", "🇫🇷", 9, 9, "6 12 34 56 78"),
        CountryCode("SG", "+65", "Singapore", "🇸🇬", 8, 8, "8123 4567"),
        CountryCode("JP", "+81", "Japan", "🇯🇵", 10, 10, "90 1234 5678"),
        CountryCode("SA", "+966", "Saudi Arabia", "🇸🇦", 9, 9, "50 123 4567"),
        CountryCode("BR", "+55", "Brazil", "🇧🇷", 10, 11, "11 91234 5678"),
        CountryCode("ZA", "+27", "South Africa", "🇿🇦", 9, 9, "71 234 5678"),
        CountryCode("NZ", "+64", "New Zealand", "🇳🇿", 8, 10, "21 123 4567"),
        CountryCode("ID", "+62", "Indonesia", "🇮🇩", 9, 12, "812 3456 7890"),
        CountryCode("MY", "+60", "Malaysia", "🇲🇾", 9, 10, "12 345 6789"),
        CountryCode("NL", "+31", "Netherlands", "🇳🇱", 9, 9, "6 12345678"),
        CountryCode("ES", "+34", "Spain", "🇪🇸", 9, 9, "612 34 56 78"),
        CountryCode("IT", "+39", "Italy", "🇮🇹", 9, 10, "312 345 6789"),
        CountryCode("MX", "+52", "Mexico", "🇲🇽", 10, 10, "55 1234 5678"),
        CountryCode("NG", "+234", "Nigeria", "🇳🇬", 10, 10, "802 123 4567"),
        CountryCode("PH", "+63", "Philippines", "🇵🇭", 10, 10, "917 123 4567"),
        CountryCode("KR", "+82", "South Korea", "🇰🇷", 9, 10, "10 1234 5678"),
        CountryCode("SE", "+46", "Sweden", "🇸🇪", 9, 9, "70 123 4567"),
        CountryCode("CH", "+41", "Switzerland", "🇨🇭", 9, 9, "78 123 45 67"),
        CountryCode("TR", "+90", "Turkey", "🇹🇷", 10, 10, "532 123 4567"),
        CountryCode("BD", "+880", "Bangladesh", "🇧🇩", 10, 10, "1712 345678"),
        CountryCode("LK", "+94", "Sri Lanka", "🇱🇰", 9, 9, "71 234 5678"),
        CountryCode("NP", "+977", "Nepal", "🇳🇵", 10, 10, "984 1234567"),
        CountryCode("TH", "+66", "Thailand", "🇹🇭", 9, 9, "81 234 5678"),
        CountryCode("VN", "+84", "Vietnam", "🇻🇳", 9, 10, "91 234 5678")
    )
}
