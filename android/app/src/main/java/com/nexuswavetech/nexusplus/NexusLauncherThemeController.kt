package com.nexuswavetech.nexusplus

import android.app.UiModeManager
import android.content.Context
import android.graphics.drawable.ColorDrawable
import android.os.Build
import android.view.View
import android.widget.TextView

/** Applies the current system/wallpaper-derived palette to the native launcher surface. */
object NexusLauncherThemeController {
    fun apply(context: Context, root: View, textViews: List<TextView> = emptyList()) {
        val dark = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val ui = context.getSystemService(UiModeManager::class.java)
            ui?.nightMode == UiModeManager.MODE_NIGHT_YES
        } else {
            (context.resources.configuration.uiMode and 0x30) == 0x20
        }
        val palette = NexusLauncherDynamicTheme.read(context).let {
            NexusLauncherDynamicTheme.readableForTheme(it, dark)
        }
        root.background = ColorDrawable(palette.background)
        textViews.forEach { it.setTextColor(palette.onSurface) }
    }
}
