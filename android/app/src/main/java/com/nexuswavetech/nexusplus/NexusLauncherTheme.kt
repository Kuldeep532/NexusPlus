package com.nexuswavetech.nexusplus

import android.content.Context
import android.graphics.Color

/** Semantic launcher palette used by the native Home surface. */
data class NexusLauncherPalette(
    val background: Int,
    val surface: Int,
    val foreground: Int,
    val muted: Int,
    val accent: Int,
    val accentSurface: Int,
)

object NexusLauncherTheme {
    private const val PREFS = "nexus_launcher"
    private const val KEY_THEME = "theme_color"

    fun current(context: Context): NexusLauncherPalette {
        val theme = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_THEME, "ocean-blue") ?: "ocean-blue"
        return when (theme) {
            "classic" -> palette("#F5FAF6", "#FFFFFF", "#10251A", "#65766B", "#18864B", "#E4F5EB")
            "light" -> palette("#F7F7F7", "#FFFFFF", "#171717", "#666666", "#303030", "#EDEDED")
            "dark" -> palette("#101214", "#181B1F", "#F5F7FA", "#A7AFBA", "#8AB4F8", "#202A38")
            "system" -> palette("#F4F6F8", "#FFFFFF", "#17202A", "#63707D", "#4C6FFF", "#E9EDFF")
            else -> palette("#F4F8FC", "#FFFFFF", "#10233D", "#607086", "#1667C7", "#E4F0FF")
        }
    }

    fun semanticAccent(context: Context): Int = current(context).accent

    private fun palette(
        background: String,
        surface: String,
        foreground: String,
        muted: String,
        accent: String,
        accentSurface: String,
    ) = NexusLauncherPalette(
        Color.parseColor(background),
        Color.parseColor(surface),
        Color.parseColor(foreground),
        Color.parseColor(muted),
        Color.parseColor(accent),
        Color.parseColor(accentSurface),
    )
}
