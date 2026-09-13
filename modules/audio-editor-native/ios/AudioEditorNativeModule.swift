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
        "mimeType": "audio/unknown",
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
      guard tracks.contains(where: { $0.mediaType == .audio }) else {
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

    AsyncFunction("mix") { (input: [String: Any?]) async throws -> [String: Any?] in
      guard let inputPath = input["inputPath"] as? String, !inputPath.isEmpty else {
        throw NSError(domain: "AudioEditorNative", code: 10, userInfo: [NSLocalizedDescriptionKey: "Base audio path is required."])
      }
      guard let overlayPath = input["overlayPath"] as? String, !overlayPath.isEmpty else {
        throw NSError(domain: "AudioEditorNative", code: 11, userInfo: [NSLocalizedDescriptionKey: "Overlay audio path is required."])
      }
      guard let outputPath = input["outputPath"] as? String, !outputPath.isEmpty else {
        throw NSError(domain: "AudioEditorNative", code: 12, userInfo: [NSLocalizedDescriptionKey: "Output audio path is required."])
      }
      let startMs = (input["overlayStartMs"] as? NSNumber)?.doubleValue ?? 0
      let volume = (input["overlayVolume"] as? NSNumber)?.doubleValue ?? 1
      guard startMs.isFinite, startMs >= 0 else {
        throw NSError(domain: "AudioEditorNative", code: 13, userInfo: [NSLocalizedDescriptionKey: "Overlay start time must be valid."])
      }
      guard volume.isFinite, volume >= 0, volume <= 2 else {
        throw NSError(domain: "AudioEditorNative", code: 14, userInfo: [NSLocalizedDescriptionKey: "Overlay volume must be between 0 and 2."])
      }

      let base = AVURLAsset(url: URL(fileURLWithPath: inputPath))
      let overlay = AVURLAsset(url: URL(fileURLWithPath: overlayPath))
      let baseTracks = try await base.load(.tracks)
      let overlayTracks = try await overlay.load(.tracks)
      guard let baseTrack = baseTracks.first(where: { $0.mediaType == .audio }) else {
        throw NSError(domain: "AudioEditorNative", code: 15, userInfo: [NSLocalizedDescriptionKey: "No supported base audio track was found."])
      }
      guard let overlayTrack = overlayTracks.first(where: { $0.mediaType == .audio }) else {
        throw NSError(domain: "AudioEditorNative", code: 16, userInfo: [NSLocalizedDescriptionKey: "No supported overlay audio track was found."])
      }

      let baseDuration = try await base.load(.duration)
      let overlayDuration = try await overlay.load(.duration)
      let baseDescriptions = try await baseTrack.load(.formatDescriptions)
      let overlayDescriptions = try await overlayTrack.load(.formatDescriptions)
      guard let baseDescription = baseDescriptions.first,
            let overlayDescription = overlayDescriptions.first,
            let baseStream = CMAudioFormatDescriptionGetStreamBasicDescription(baseDescription),
            let overlayStream = CMAudioFormatDescriptionGetStreamBasicDescription(overlayDescription) else {
        throw NSError(domain: "AudioEditorNative", code: 17, userInfo: [NSLocalizedDescriptionKey: "Unable to read audio format information."])
      }
      let baseSampleRate = baseStream.pointee.mSampleRate
      let overlaySampleRate = overlayStream.pointee.mSampleRate
      let baseChannels = Int(baseStream.pointee.mChannelsPerFrame)
      let overlayChannels = Int(overlayStream.pointee.mChannelsPerFrame)
      guard abs(baseSampleRate - overlaySampleRate) < 0.5 else {
        throw NSError(domain: "AudioEditorNative", code: 18, userInfo: [NSLocalizedDescriptionKey: "Base and overlay sample rates must match."])
      }
      guard baseChannels == overlayChannels else {
        throw NSError(domain: "AudioEditorNative", code: 19, userInfo: [NSLocalizedDescriptionKey: "Base and overlay channel counts must match."])
      }

      let composition = AVMutableComposition()
      guard let compositionBase = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid),
            let compositionOverlay = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
        throw NSError(domain: "AudioEditorNative", code: 20, userInfo: [NSLocalizedDescriptionKey: "Unable to create audio composition."])
      }
      try compositionBase.insertTimeRange(
        CMTimeRange(start: .zero, duration: baseDuration),
        of: baseTrack,
        at: .zero
      )
      let overlayInsertDuration = CMTimeMinimum(overlayDuration, CMTimeSubtract(baseDuration, CMTime(seconds: startMs / 1000.0, preferredTimescale: 600)))
      guard overlayInsertDuration.isValid, overlayInsertDuration.seconds > 0 else {
        throw NSError(domain: "AudioEditorNative", code: 21, userInfo: [NSLocalizedDescriptionKey: "Overlay starts after the base audio ends."])
      }
      try compositionOverlay.insertTimeRange(
        CMTimeRange(start: .zero, duration: overlayInsertDuration),
        of: overlayTrack,
        at: CMTime(seconds: startMs / 1000.0, preferredTimescale: 600)
      )

      let audioMix = AVMutableAudioMix()
      let baseParameters = AVMutableAudioMixInputParameters(track: compositionBase)
      let overlayParameters = AVMutableAudioMixInputParameters(track: compositionOverlay)
      overlayParameters.setVolume(Float(volume), at: .zero)
      audioMix.inputParameters = [baseParameters, overlayParameters]

      if FileManager.default.fileExists(atPath: outputPath) {
        try FileManager.default.removeItem(atPath: outputPath)
      }
      let outputURL = URL(fileURLWithPath: outputPath)
      try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)

      guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetAppleM4A) else {
        throw NSError(domain: "AudioEditorNative", code: 22, userInfo: [NSLocalizedDescriptionKey: "Audio mix export is unavailable on this device."])
      }
      exporter.outputURL = outputURL
      exporter.outputFileType = .m4a
      exporter.audioMix = audioMix
      exporter.shouldOptimizeForNetworkUse = false
      await exporter.export()
      guard exporter.status == .completed else {
        throw exporter.error ?? NSError(domain: "AudioEditorNative", code: 23, userInfo: [NSLocalizedDescriptionKey: "Audio mix export failed."])
      }

      return [
        "outputPath": outputURL.path,
        "durationMs": baseDuration.seconds * 1000,
        "sampleRate": Int(baseSampleRate),
        "channels": baseChannels,
        "mimeType": "audio/mp4",
      ]
    }
  }
}
