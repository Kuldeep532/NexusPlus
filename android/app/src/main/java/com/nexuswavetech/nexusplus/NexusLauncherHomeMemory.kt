package com.nexuswavetech.nexusplus

import android.content.Context
import java.util.Calendar

/**
 * Launcher-only memory shelf. It remembers the user's explicit quick intents locally
 * and proposes the matching app without reading global UsageStats or sending data away.
 */
object NexusLauncherHomeMemory {
    private const val PREFS = "nexus_launcher_home_memory"
    private const val KEY_ENTRIES = "entries"
    private const val MAX_ENTRIES = 12

    data class MemoryItem(
        val id: String,
        val title: String,
        val packageName: String,
        val hourStart: Int,
        val hourEnd: Int,
    )

    fun save(context: Context, item: MemoryItem) {
        require(item.packageName.isNotBlank())
        val encoded = listOf(item.id, item.title, item.packageName, item.hourStart.toString(), item.hourEnd.toString())
            .joinToString("~")
        val current = load(context).filterNot { it.id == item.id }
        prefs(context).edit()
            .putString(KEY_ENTRIES, (current.map(::encode) + encoded).takeLast(MAX_ENTRIES).joinToString("|"))
            .apply()
    }

    fun load(context: Context): List<MemoryItem> =
        prefs(context).getString(KEY_ENTRIES, "")
            ?.split("|")
            ?.mapNotNull(::decode)
            .orEmpty()

    fun current(context: Context, hour: Int = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)): List<MemoryItem> =
        load(context).filter { isWithin(hour, it.hourStart, it.hourEnd) }

    private fun encode(item: MemoryItem): String =
        listOf(item.id, item.title, item.packageName, item.hourStart.toString(), item.hourEnd.toString()).joinToString("~")

    private fun decode(value: String): MemoryItem? {
        val p = value.split("~")
        if (p.size != 5) return null
        val start = p[3].toIntOrNull() ?: return null
        val end = p[4].toIntOrNull() ?: return null
        if (start !in 0..23 || end !in 0..23) return null
        return MemoryItem(p[0], p[1], p[2], start, end)
    }

    private fun isWithin(hour: Int, start: Int, end: Int): Boolean = when {
        start == end -> hour == start
        start < end -> hour in start until end
        else -> hour >= start || hour < end
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
