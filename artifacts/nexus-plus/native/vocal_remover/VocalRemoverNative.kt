package com.nexuswavetech.nexusplus.vocal

object VocalRemoverNative {
    init {
        System.loadLibrary("nexus_vocal_remover")
    }

    @JvmStatic
    external fun nativeIsAvailable(): Boolean

    @JvmStatic
    external fun nativeSeparate(
        inputPath: String,
        outputPath: String,
        quality: Int,
        preserveBass: Boolean,
        preserveStereo: Boolean,
    ): String?

    @JvmStatic
    external fun nativeCancel()

    @JvmStatic
    external fun nativeDispose()
}
