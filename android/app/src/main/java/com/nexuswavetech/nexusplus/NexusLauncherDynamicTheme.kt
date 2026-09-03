package com.nexuswavetech.nexusplus

import android.content.Context
import android.os.Build

/** Reads Android 12+ system dynamic-color roles with stable fallbacks on older devices. */
object NexusLauncherDynamicTheme {
    data class Palette(
        val background: Int,
        val surface: Int,
        val primary: Int,
        val onPrimary: Int,
        val primaryContainer: Int,
        val onPrimaryContainer: Int,
        val secondaryContainer: Int,
        val onSurface: Int,
        val outline: Int,
    )

    fun read(context: Context): Palette {
        val resources = context.resources
        fun color(name: String, fallback: Int): Int = runCatching {
            val id = resources.getIdentifier(name, "color", "android")
            if (id == 0) fallback else resources.getColor(id, context.theme)
        }.getOrDefault(fallback)

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return Palette(
                background = 0xFFF8F8F8.toInt(),
                surface = 0xFFFFFFFF.toInt(),
                primary = 0xFF315F90.toInt(),
                onPrimary = 0xFFFFFFFF.toInt(),
                primaryContainer = 0xFFD2E4FF.toInt(),
                onPrimaryContainer = 0xFF001C38.toInt(),
                secondaryContainer = 0xFFD5E3F7.toInt(),
                onSurface = 0xFF191C20.toInt(),
                outline = 0xFF74777F.toInt(),
            )
        }

        return Palette(
            background = color("system_neutral1_10", 0xFFF8F8F8.toInt()),
            surface = color("system_neutral1_50", 0xFFFFFFFF.toInt()),
            primary = color("system_accent1_600", 0xFF315F90.toInt()),
            onPrimary = color("system_accent1_0", 0xFFFFFFFF.toInt()),
            primaryContainer = color("system_accent1_100", 0xFFD2E4FF.toInt()),
            onPrimaryContainer = color("system_accent1_900", 0xFF001C38.toInt()),
            secondaryContainer = color("system_accent2_100", 0xFFD5E3F7.toInt()),
            onSurface = color("system_neutral1_900", 0xFF191C20.toInt()),
            outline = color("system_neutral2_500", 0xFF74777F.toInt()),
        )
    }

    fun readableForTheme(base: Palette, dark: Boolean): Palette = if (!dark) {
        base
    } else {
        Palette(
            background = colorBlend(base.background, 0xFF101418.toInt(), 0.82f),
            surface = colorBlend(base.surface, 0xFF1A1D21.toInt(), 0.72f),
            primary = colorBlend(base.primary, 0xFFB6D2FF.toInt(), 0.68f),
            onPrimary = 0xFF001C38.toInt(),
            primaryContainer = colorBlend(base.primaryContainer, 0xFF234A73.toInt(), 0.66f),
            onPrimaryContainer = 0xFFD2E4FF.toInt(),
            secondaryContainer = colorBlend(base.secondaryContainer, 0xFF3B4756.toInt(), 0.64f),
            onSurface = 0xFFE1E2E5.toInt(),
            outline = 0xFF8E9199.toInt(),
        )
    }

    private fun colorBlend(from: Int, to: Int, amount: Float): Int {
        val inv = 1f - amount
        val r = (((from shr 16) and 0xFF) * inv + ((to shr 16) and 0xFF) * amount).toInt()
        val g = (((from shr 8) and 0xFF) * inv + ((to shr 8) and 0xFF) * amount).toInt()
        val b = ((from and 0xFF) * inv + (to and 0xFF) * amount).toInt()
        return (0xFF shl 24) or (r shl 16) or (g shl 8) or b
    }
}
