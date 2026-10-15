package com.breaktime.app

import com.breaktime.app.data.activity.DefaultActivityRepository
import com.breaktime.app.domain.activity.ActivityIconType
import com.breaktime.app.domain.contact.Contact
import com.breaktime.app.domain.contact.RelationshipType
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class ActivityFilteringTest {

    private lateinit var activityRepository: DefaultActivityRepository

    @Before
    fun setup() {
        // Pass null sharedPreferences for pure in-memory unit testing
        activityRepository = DefaultActivityRepository(sharedPreferences = null)
    }

    @Test
    fun testLoverRelationship_IncludesIntimateActivities() = runTest {
        val loverContact = Contact(
            id = "lover_1",
            name = "Aisha",
            relationship = RelationshipType.LOVER
        )

        val activities = activityRepository.getActivitiesForContact(loverContact).first()

        assertTrue(
            "LOVER relationship must allow KISS activity",
            activities.any { it.iconType == ActivityIconType.KISS }
        )
        assertTrue(
            "LOVER relationship must allow CUDDLE activity",
            activities.any { it.iconType == ActivityIconType.CUDDLE }
        )
    }

    @Test
    fun testBhaiRelationship_FiltersOutIntimateActivities() = runTest {
        val bhaiContact = Contact(
            id = "bhai_1",
            name = "Rohan",
            relationship = RelationshipType.BHAI
        )

        val activities = activityRepository.getActivitiesForContact(bhaiContact).first()

        assertFalse(
            "BHAI relationship must never show KISS activity",
            activities.any { it.iconType == ActivityIconType.KISS }
        )
        assertFalse(
            "BHAI relationship must never show CUDDLE activity",
            activities.any { it.iconType == ActivityIconType.CUDDLE }
        )

        // General activities must still be present
        assertTrue(activities.any { it.iconType == ActivityIconType.NIGHT_RIDE })
        assertTrue(activities.any { it.iconType == ActivityIconType.EVENING_CHAI })
    }

    @Test
    fun testFriendsRelationship_FiltersOutIntimateActivities() = runTest {
        val friendContact = Contact(
            id = "friend_1",
            name = "Aryan",
            relationship = RelationshipType.FRIENDS
        )

        val activities = activityRepository.getActivitiesForContact(friendContact).first()

        assertFalse(activities.any { it.iconType == ActivityIconType.KISS })
        assertFalse(activities.any { it.iconType == ActivityIconType.CUDDLE })
        assertTrue(activities.any { it.iconType == ActivityIconType.GAMING })
    }

    @Test
    fun testFamilyRelationship_FiltersOutIntimateActivities() = runTest {
        val familyContact = Contact(
            id = "fam_1",
            name = "Vikram",
            relationship = RelationshipType.FAMILY
        )

        val activities = activityRepository.getActivitiesForContact(familyContact).first()

        assertFalse(activities.any { it.iconType == ActivityIconType.KISS })
        assertFalse(activities.any { it.iconType == ActivityIconType.CUDDLE })
    }
}
