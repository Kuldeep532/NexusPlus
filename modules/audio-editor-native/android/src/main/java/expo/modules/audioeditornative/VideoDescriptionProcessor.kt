package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaMetadataRetriever
import java.util.Locale

object VideoDescriptionProcessor {
  fun describeFrame(context: Context?, videoUri: String, timestampMs: Double, language: String): Map<String, Any?>? {
    val safeContext = requireNotNull(context) { "Video description context is unavailable." }
    val retriever = MediaMetadataRetriever()
    try {
      val uri = android.net.Uri.parse(videoUri)
      if (videoUri.startsWith("content://")) {
        safeContext.contentResolver.openFileDescriptor(uri, "r").use { descriptor ->
          requireNotNull(descriptor) { "Unable to open video content." }
          retriever.setDataSource(descriptor.fileDescriptor)
        }
      } else {
        retriever.setDataSource(videoUri.removePrefix("file://"))
      }

      val bitmap = retriever.getFrameAtTime(
        (timestampMs.coerceAtLeast(0.0) * 1000.0).toLong(),
        MediaMetadataRetriever.OPTION_CLOSEST,
      ) ?: return null

      val width = bitmap.width
      val height = bitmap.height
      val orientation = when {
        width > height * 1.6 -> "wide"
        height > width * 1.25 -> "portrait"
        else -> "landscape"
      }

      val isHindi = language.lowercase(Locale.ROOT).startsWith("hi")
      val text = if (isHindi) "वीडियो का दृश्य $orientation फ्रेम है।"
      else "The video is showing a $orientation frame."

      bitmap.recycle()
      return mapOf("text" to text, "confidence" to 0.1)
    } finally {
      retriever.release()
    }
  }
}
