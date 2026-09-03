package com.nexuswavetech.nexusplus

import android.content.Context
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class NexusLauncherRecommendationEngineTest {
    @Test
    fun `time preferences receive priority over unrelated apps`() {
        val context = newContext()
        val apps = listOf(
            app("com.google.android.apps.walletnfcrel", "Google Wallet"),
            app("com.whatsapp", "WhatsApp"),
        )
        val recommended = NexusLauncherRecommendationEngine.recommend(
            context,
            apps,
            preferredPackages = mapOf(9..11 to setOf("com.google.android.apps.walletnfcrel")),
            currentTimeMillis = time(10),
        )
        assertEquals("com.google.android.apps.walletnfcrel", recommended.first().packageName)
    }

    @Test
    fun `moving context boosts maps`() {
        val context = newContext()
        val apps = listOf(
            app("com.google.android.apps.maps", "Google Maps"),
            app("com.whatsapp", "WhatsApp"),
        )
        val location = android.location.Location("test").apply {
            speed = 12f
        }
        val recommended = NexusLauncherRecommendationEngine.recommend(
            context,
            apps,
            currentTimeMillis = time(15),
            location = location,
        )
        assertTrue(recommended.first().packageName.contains("maps"))
    }

    private fun app(packageName: String, label: String) =
        NexusLauncherActivity.AppEntry(label, packageName, "MainActivity", android.graphics.drawable.ColorDrawable())

    private fun time(hour: Int): Long =
        java.util.Calendar.getInstance().apply {
            set(java.util.Calendar.HOUR_OF_DAY, hour)
            set(java.util.Calendar.MINUTE, 0)
            set(java.util.Calendar.SECOND, 0)
            set(java.util.Calendar.MILLISECOND, 0)
        }.timeInMillis

    private fun newContext(): Context =
        androidx.test.core.app.ApplicationProvider.getApplicationContext()
}
