import ExpoModulesCore
import AVFoundation

public final class AudioEditorNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AudioEditorNative")

    AsyncFunction("probe") { (inputPath: String) -> [String: Any?] in
      let asset = AVURLAsset(url: URL(fileURLWithPath: inputPath))
      let tracks = try await asset.load(.tracks)
      guard let audioTrack = tracks.first(where: { $0.mediaType == .audio }) else {
        throw NSError(domain: "AudioEditorNative", code: 1, userInfo: [NSLocalizedDescriptionKey: "No supported audio track was found."])
      }
      let duration = try await asset.load(.duration)
      let descriptions = try await audioTrack.load(.formatDescriptions)
      var sampleRate = 0
      var channels = 0
      if let description = descriptions.first,
         let stream = CMAudioFormatDescriptionGetStreamBasicDescription(description) {
        sampleRate = Int(stream.pointee.mSampleRate)
        channels = Int(stream.pointee.mChannelsPerFrame)
      }
      return [
        "durationMs": duration.seconds * 1000,
        "sampleRate": sampleRate,
        "channels": channels,
      ]
    }

    AsyncFunction("trim") { (inputPath: String, outputPath: String, startMs: Double, endMs: Double) async throws -> [String: Any?] in
      guard startMs.isFinite, endMs.isFinite, startMs >= 0, endMs > startMs else {
        throw NSError(domain: "AudioEditorNative", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid trim range."])
      }
      let inputURL = URL(fileURLWithPath: inputPath)
      let outputURL = URL(fileURLWithPath: outputPath)
      let asset = AVURLAsset(url: inputURL)
      let tracks = try await asset.load(.tracks)
      guard let audioTrack = tracks.first(where: { $0.mediaType == .audio }) else {
        throw NSError(domain: "AudioEditorNative", code: 3, userInfo: [NSLocalizedDescriptionKey: "No supported audio track was found."])
      }
      if FileManager.default.fileExists(atPath: outputURL.path) {
        try FileManager.default.removeItem(at: outputURL)
      }
      try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)

      guard let exporter = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetAppleM4A) else {
        throw NSError(domain: "AudioEditorNative", code: 4, userInfo: [NSLocalizedDescriptionKey: "Audio export is unavailable on this device."])
      }
      exporter.outputURL = outputURL
      exporter.outputFileType = .m4a
      exporter.shouldOptimizeForNetworkUse = false
      exporter.timeRange = CMTimeRange(
        start: CMTime(seconds: startMs / 1000.0, preferredTimescale: 600),
        duration: CMTime(seconds: (endMs - startMs) / 1000.0, preferredTimescale: 600)
      )
      await exporter.export()
      switch exporter.status {
      case .completed:
        return [
          "outputPath": outputURL.path,
          "startMs": startMs,
          "endMs": endMs,
          "durationMs": endMs - startMs,
          "mimeType": "audio/mp4",
        ]
      case .failed, .cancelled:
        throw exporter.error ?? NSError(domain: "AudioEditorNative", code: 5, userInfo: [NSLocalizedDescriptionKey: "Audio export failed."])
      default:
        throw NSError(domain: "AudioEditorNative", code: 6, userInfo: [NSLocalizedDescriptionKey: "Audio export did not complete."])
      }
    }
  }
}
