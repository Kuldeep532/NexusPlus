package expo.modules.audioeditornative

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import java.io.File
import kotlin.math.abs
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min

internal object RemoveSilenceProcessor {
  data class Result(
    val outputPath: String,
    val durationMs: Double,
    val sampleRate: Int,
    val channels: Int,
    val mimeType: String,
    val removedSilenceMs: Double,
  )

  private data class Decoded(val sampleRate: Int, val channels: Int, val samples: FloatArray)
  private data class Range(val startFrame: Int, val endFrame: Int)

  fun process(
    context: Context,
    inputPath: String,
    outputPath: String,
    thresholdDb: Double,
    minSilenceMs: Double,
    paddingMs: Double,
  ): Result {
    require(thresholdDb.isFinite() && thresholdDb in -70.0..-12.0) { "Silence threshold must be between -70 and -12 dB." }
    require(minSilenceMs.isFinite() && minSilenceMs in 50.0..3000.0) { "Minimum silence duration must be between 50 and 3000 ms." }
    require(paddingMs.isFinite() && paddingMs in 0.0..500.0) { "Silence padding must be between 0 and 500 ms." }

    val decoded = decode(context, inputPath)
    require(decoded.samples.isNotEmpty()) { "The selected audio contains no decodable samples." }

    val keepRanges = findKeepRanges(
      decoded.samples,
      decoded.sampleRate,
      decoded.channels,
      dbToLinear(thresholdDb),
      minSilenceMs,
      paddingMs,
    )
    val compacted = compact(decoded.samples, decoded.channels, keepRanges)
    val out = encodeAac(compacted, decoded.sampleRate, decoded.channels, outputPath)
    val originalFrames = decoded.samples.size / decoded.channels
    val keptFrames = compacted.size / decoded.channels
    val removedFrames = max(0, originalFrames - keptFrames)
    return Result(
      out,
      keptFrames.toDouble() / decoded.sampleRate * 1000.0,
      decoded.sampleRate,
      decoded.channels,
      "audio/mp4",
      removedFrames.toDouble() / decoded.sampleRate * 1000.0,
    )
  }

  private fun dbToLinear(db: Double): Double = 10.0.powDb(db)

  private fun findKeepRanges(
    samples: FloatArray,
    sampleRate: Int,
    channels: Int,
    threshold: Double,
    minSilenceMs: Double,
    paddingMs: Double,
  ): List<Range> {
    val frameCount = samples.size / channels
    val minSilentFrames = max(1, (minSilenceMs * sampleRate / 1000.0).toInt())
    val paddingFrames = max(0, (paddingMs * sampleRate / 1000.0).toInt())
    val windowFrames = max(1, sampleRate / 100)
    val silent = BooleanArray(frameCount)

    var frame = 0
    while (frame < frameCount) {
      val end = min(frameCount, frame + windowFrames)
      var peak = 0.0
      var f = frame
      while (f < end) {
        var channel = 0
        var framePeak = 0.0
        while (channel < channels) {
          framePeak = max(framePeak, abs(samples[f * channels + channel].toDouble()))
          channel++
        }
        peak = max(peak, framePeak)
        f++
      }
      val isSilent = peak < threshold
      var mark = frame
      while (mark < end) {
        silent[mark] = isSilent
        mark++
      }
      frame = end
    }

    val runs = ArrayList<Range>()
    var cursor = 0
    while (cursor < frameCount) {
      if (!silent[cursor]) {
        cursor++
        continue
      }
      val start = cursor
      while (cursor < frameCount && silent[cursor]) cursor++
      val end = cursor
      if (end - start >= minSilentFrames) {
        runs.add(Range(start, end))
      }
    }

    if (runs.isEmpty()) return listOf(Range(0, frameCount))

    val keep = ArrayList<Range>()
    var cursorFrame = 0
    for (run in runs) {
      val cutStart = min(run.endFrame, run.startFrame + max(0, run.endFrame - run.startFrame - paddingFrames))
      val cutEnd = max(run.startFrame, run.endFrame - max(0, run.endFrame - run.startFrame - paddingFrames))
      val leftKeepEnd = max(cursorFrame, run.startFrame + paddingFrames)
      if (leftKeepEnd > cursorFrame) keep.add(Range(cursorFrame, leftKeepEnd))
      cursorFrame = max(cursorFrame, cutEnd)
      if (cutStart > cursorFrame) cursorFrame = cutStart
    }
    if (cursorFrame < frameCount) keep.add(Range(cursorFrame, frameCount))

    return mergeRanges(keep, frameCount)
  }

  private fun mergeRanges(ranges: List<Range>, frameCount: Int): List<Range> {
    val sorted = ranges.filter { it.endFrame > it.startFrame }.sortedBy { it.startFrame }
    if (sorted.isEmpty()) return listOf(Range(0, frameCount))
    val merged = ArrayList<Range>()
    var current = sorted.first()
    for (next in sorted.drop(1)) {
      if (next.startFrame <= current.endFrame) {
        current = Range(current.startFrame, max(current.endFrame, next.endFrame))
      } else {
        merged.add(current)
        current = next
      }
    }
    merged.add(current)
    return merged
  }

  private fun compact(samples: FloatArray, channels: Int, ranges: List<Range>): FloatArray {
    var totalFrames = 0
    for (range in ranges) totalFrames += range.endFrame - range.startFrame
    if (totalFrames <= 0) return FloatArray(0)
    val output = FloatArray(totalFrames * channels)
    var offset = 0
    for (range in ranges) {
      val start = range.startFrame * channels
      val end = range.endFrame * channels
      samples.copyInto(output, offset, start, end)
      offset += end - start
    }
    return output
  }

  private fun decode(context: Context, inputPath: String): Decoded {
    val extractor = MediaExtractor()
    try {
      setDataSource(context, extractor, inputPath)
      var audioTrack = -1
      var inputFormat: MediaFormat? = null
      for (index in 0 until extractor.trackCount) {
        val candidate = extractor.getTrackFormat(index)
        val mime = candidate.getString(MediaFormat.KEY_MIME) ?: continue
        if (mime.startsWith("audio/")) {
          audioTrack = index
          inputFormat = candidate
          break
        }
      }
      require(audioTrack >= 0 && inputFormat != null) { "No supported audio track was found." }

      val format = inputFormat!!
      val mime = format.getString(MediaFormat.KEY_MIME) ?: error("Audio codec MIME type is missing.")
      val sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
      val channels = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
      require(sampleRate > 0 && channels > 0) { "Audio format has invalid sample rate or channel count." }

      extractor.selectTrack(audioTrack)
      val decoder = MediaCodec.createDecoderByType(mime)
      decoder.configure(format, null, null, 0)
      decoder.start()
      val samples = ArrayList<Float>()
      val info = MediaCodec.BufferInfo()
      var inputDone = false
      var outputDone = false
      try {
        while (!outputDone) {
          if (!inputDone) {
            val inputIndex = decoder.dequeueInputBuffer(10_000)
            if (inputIndex >= 0) {
              val inputBuffer = decoder.getInputBuffer(inputIndex) ?: error("Decoder input buffer unavailable.")
              inputBuffer.clear()
              val size = extractor.readSampleData(inputBuffer, 0)
              if (size < 0) {
                decoder.queueInputBuffer(inputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                inputDone = true
              } else {
                decoder.queueInputBuffer(inputIndex, 0, size, extractor.sampleTime.coerceAtLeast(0), extractor.sampleFlags)
                extractor.advance()
              }
            }
          }

          when (val outputIndex = decoder.dequeueOutputBuffer(info, 10_000)) {
            MediaCodec.INFO_TRY_AGAIN_LATER, MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> Unit
            else -> if (outputIndex >= 0) {
              val outputBuffer = decoder.getOutputBuffer(outputIndex) ?: error("Decoder output buffer unavailable.")
              if (info.size > 0) {
                outputBuffer.position(info.offset)
                outputBuffer.limit(info.offset + info.size)
                while (outputBuffer.remaining() >= 2) samples.add(outputBuffer.short.toInt() / 32768.0f)
              }
              decoder.releaseOutputBuffer(outputIndex, false)
              if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) outputDone = true
            }
          }
        }
      } finally {
        decoder.stop()
        decoder.release()
      }
      return Decoded(sampleRate, channels, samples.toFloatArray())
    } finally {
      extractor.release()
    }
  }

  private fun setDataSource(context: Context, extractor: MediaExtractor, inputPath: String) {
    when {
      inputPath.startsWith("content://") || inputPath.startsWith("file://") -> {
        val descriptor = context.contentResolver.openFileDescriptor(Uri.parse(inputPath), "r")
        requireNotNull(descriptor) { "Unable to open selected audio file." }
        descriptor.use { extractor.setDataSource(it.fileDescriptor) }
      }
      File(inputPath).isFile -> extractor.setDataSource(inputPath)
      else -> error("Input audio file was not found.")
    }
  }

  private fun encodeAac(samples: FloatArray, rate: Int, channels: Int, path: String): String {
    require(samples.isNotEmpty()) { "Removing silence would leave no audio. Lower the threshold or minimum silence duration." }
    val file = File(path)
    file.parentFile?.mkdirs()
    val format = MediaFormat.createAudioFormat("audio/mp4a-latm", rate, channels)
    format.setInteger(MediaFormat.KEY_BIT_RATE, min(192_000, max(64_000, 64_000 * channels)))
    format.setInteger(MediaFormat.KEY_AAC_PROFILE, android.media.MediaCodecInfo.CodecProfileLevel.AACObjectLC)
    val encoder = MediaCodec.createEncoderByType("audio/mp4a-latm")
    val muxer = MediaMuxer(file.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    val info = MediaCodec.BufferInfo()
    var track = -1
    var started = false
    var offset = 0
    var eos = false
    try {
      encoder.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      encoder.start()
      var done = false
      while (!done) {
        if (!eos) {
          val inputIndex = encoder.dequeueInputBuffer(10_000)
          if (inputIndex >= 0) {
            val inputBuffer = encoder.getInputBuffer(inputIndex) ?: error("Encoder input buffer unavailable.")
            inputBuffer.clear()
            val capacityFrames = inputBuffer.remaining() / (2 * channels)
            val totalFrames = samples.size / channels
            val remaining = totalFrames - offset
            val count = min(capacityFrames, remaining)
            if (count <= 0) {
              encoder.queueInputBuffer(inputIndex, 0, 0, offset.toLong() * 1_000_000L / rate, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
              eos = true
            } else {
              var bytes = 0
              for (frame in 0 until count) {
                for (channel in 0 until channels) {
                  val sample = (samples[(offset + frame) * channels + channel].coerceIn(-1f, 1f) * 32767f).toInt().toShort()
                  inputBuffer.put((sample.toInt() and 0xff).toByte())
                  inputBuffer.put(((sample.toInt() shr 8) and 0xff).toByte())
                  bytes += 2
                }
              }
              encoder.queueInputBuffer(inputIndex, 0, bytes, offset.toLong() * 1_000_000L / rate, 0)
              offset += count
            }
          }
        }

        when (val outputIndex = encoder.dequeueOutputBuffer(info, 10_000)) {
          MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
          MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> if (!started) {
            track = muxer.addTrack(encoder.outputFormat)
            muxer.start()
            started = true
          }
          else -> if (outputIndex >= 0) {
            val outputBuffer = encoder.getOutputBuffer(outputIndex) ?: error("Encoder output buffer unavailable.")
            if ((info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0) info.size = 0
            if (info.size > 0) {
              outputBuffer.position(info.offset)
              outputBuffer.limit(info.offset + info.size)
              require(started)
              muxer.writeSampleData(track, outputBuffer, info)
            }
            encoder.releaseOutputBuffer(outputIndex, false)
            if ((info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) done = true
          }
        }
      }
    } finally {
      runCatching { encoder.stop() }
      encoder.release()
      if (started) runCatching { muxer.stop() }
      muxer.release()
    }
    return file.absolutePath
  }

  private fun Double.powDb(value: Double): Double = kotlin.math.exp(value * ln(10.0) / 20.0)
}
