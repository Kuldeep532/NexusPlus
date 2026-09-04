package com.nexuswavetech.nexusplus

/**
 * One shared vocabulary for the Nexus Gate decision layer.
 * The keywords are signals, not direct proof that content is harmful.
 * Essential apps are explicitly protected from accidental blocking.
 */
object NexusProtectionPolicy {
    val addictiveActivityKeywords: Set<String> = setOf(
        "block shorts",
        "block reels",
        "stop doomscrolling",
        "anti-scroll",
        "app usage limit",
        "screen time blocker",
        "block addictive features",
        "prevent impulse scrolling",
        "restrict social media",
        "focus lock",
        "habit control",
        "distraction blocker",
        "stop phone addiction",
        "block time waste apps",
        "control screen addiction",
        "anti-distraction shield",
        "disable feeds",
        "block infinite scroll",
        "stop urge scrolling",
        "restrict short videos",
        "block adult content",
        "mute notifications",
        "lock app usage",
        "limit social feeds",
        "stop compulsive scrolling",
        "block doom scrolling",
        "pause addictive apps",
        "prevent app overuse",
        "screen time restrictor",
        "block endless scroll",
        "app lock focus",
        "stop phone distraction",
        "impulse control blocker",
        "digital habit breaker",
        "strict app blocker",
        "limit reel watching",
        "block video feeds",
        "disable shorts tab",
        "self control blocker",
        "digital detox lock",
    )

    private val essentialPackagePrefixes = setOf(
        "com.android.settings",
        "com.android.phone",
        "com.android.contacts",
        "com.android.dialer",
        "com.google.android.dialer",
        "com.google.android.apps.messaging",
        "com.google.android.apps.walletnfcrel",
        "com.google.android.apps.nbu.paisa.user",
        "com.phonepe.app",
        "net.one97.paytm",
        "in.org.npci.upiapp",
    )

    private val essentialPackageExact = setOf(
        "com.whatsapp",
    )

    fun isEssentialPackage(packageName: String): Boolean {
        val normalized = packageName.trim().lowercase()
        return normalized in essentialPackageExact ||
            essentialPackagePrefixes.any { normalized == it || normalized.startsWith("$it.") }
    }

    fun canApplyAddictionProtection(packageName: String): Boolean =
        packageName.isNotBlank() && !isEssentialPackage(packageName)
}
