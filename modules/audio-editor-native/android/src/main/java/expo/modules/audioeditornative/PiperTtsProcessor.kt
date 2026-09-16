package expo.modules.audioeditornative

import android.content.Context
import java.io.File

/**
 * Piper native adapter boundary. The actual Piper/sherpa-onnx runtime is injected at build time.
 * This class deliberately fails closed when the runtime is absent instead of creating fake audio.
 */
object PiperTtsProcessor {
    interface Runtime {
        fun synthesize(
            text: String,
            modelPath: String,
            configPath: String,
            outputPath: String,
            lengthScale: Double,
            pitchScale: Double,
            emotion: String,
        )

        fun synthesizeClone(
            text: String,
            modelPath: String,
            configPath: String,
            outputPath: String,
            lengthScale: Double,
            pitchScale: Double,
            emotion: String,
        )
    }

    @Volatile
    var runtime: Runtime? = null

    fun synthesize(
        context: Context?,
        text: String,
        modelPath: String,
        configPath: String,
        outputPath: String,
        lengthScale: Double,
        pitchScale: Double,
        emotion: String,
        clone: Boolean,
    ): String {
        require(context != null) { "Audio editor context is unavailable." }
        require(text.isNotBlank()) { "Text is required." }
        require(File(modelPath).exists() && File(modelPath).length() > 0) { "Piper voice model is unavailable." }
        require(File(configPath).exists() && File(configPath).length() > 0) { "Piper voice configuration is unavailable." }
        val engine = runtime ?: error("Piper TTS runtime is not bundled in this Android build.")
        File(outputPath).parentFile?.mkdirs()
        if (clone) {
            engine.synthesizeClone(text, modelPath, configPath, outputPath, lengthScale, pitchScale, emotion)
        } else {
            engine.synthesize(text, modelPath, configPath, outputPath, lengthScale, pitchScale, emotion)
        }
        require(File(outputPath).exists() && File(outputPath).length() > 0) { "Piper did not produce a valid audio file." }
        return outputPath
    }
}
