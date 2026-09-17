package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import java.io.File
import java.nio.ByteBuffer

internal object AudioEffectProcessor {
  fun validate(effectStartMs: Double, effectEndMs: Double, volume: Double) {
    require(effectStartMs.isFinite() && effectEndMs.isFinite()) { "Sound effect bounds must be finite." }
    require(effectStartMs >= 0.0 && effectEndMs > effectStartMs) { "Sound effect range is invalid." }
    require(volume.isFinite() && volume >= 0.0 && volume <= 2.0) { "Sound effect volume must be between 0 and 2." }
  }

  /**
   * Stage 4 will replace this transport-level processor with decoded PCM mixing.
   * It is intentionally not exposed to JS until true mixing is linked.
   */
  fun ensureSupportedInput(context: Context, inputPath: String, effectPath: String) {
    require(File(inputPath).isFile || inputPath.startsWith("content://") || inputPath.startsWith("file://")) { "Base audio source was not found." }
    require(File(effectPath).isFile || effectPath.startsWith("content://") || effectPath.startsWith("file://")) { "Sound effect source was not found." }
  }
}
