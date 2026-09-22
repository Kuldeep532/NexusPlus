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
      if FileManager.default.fileExists(atPath: outputURL.path) { try FileManager.default.removeItem(at: outputURL) }
      try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)
      guard let exporter = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetAppleM4A) else {
        throw NSError(domain: "AudioEditorNative", code: 4, userInfo: [NSLocalizedDescriptionKey: "Audio export is unavailable on this device."])
      }
      exporter.outputURL = outputURL
      exporter.outputFileType = .m4a
      exporter.shouldOptimizeForNetworkUse = false
      exporter.timeRange = CMTimeRange(start: CMTime(seconds: startMs / 1000.0, preferredTimescale: 600), duration: CMTime(seconds: (endMs - startMs) / 1000.0, preferredTimescale: 600))
      await exporter.export()
      switch exporter.status {
      case .completed:
        return ["outputPath": outputURL.path, "startMs": startMs, "endMs": endMs, "durationMs": endMs - startMs, "mimeType": "audio/mp4"]
      case .failed, .cancelled:
        throw exporter.error ?? NSError(domain: "AudioEditorNative", code: 5, userInfo: [NSLocalizedDescriptionKey: "Audio export failed."])
      default:
        throw NSError(domain: "AudioEditorNative", code: 6, userInfo: [NSLocalizedDescriptionKey: "Audio export did not complete."])
      }
    }

    AsyncFunction("mix") { (input: [String: Any?]) async throws -> [String: Any?] in
      guard let inputPath = input["inputPath"] as? String, !inputPath.isEmpty else { throw NSError(domain: "AudioEditorNative", code: 10, userInfo: [NSLocalizedDescriptionKey: "Base audio path is required."]) }
      guard let overlayPath = input["overlayPath"] as? String, !overlayPath.isEmpty else { throw NSError(domain: "AudioEditorNative", code: 11, userInfo: [NSLocalizedDescriptionKey: "Overlay audio path is required."]) }
      guard let outputPath = input["outputPath"] as? String, !outputPath.isEmpty else { throw NSError(domain: "AudioEditorNative", code: 12, userInfo: [NSLocalizedDescriptionKey: "Output audio path is required."]) }
      let startMs = (input["overlayStartMs"] as? NSNumber)?.doubleValue ?? 0
      let volume = (input["overlayVolume"] as? NSNumber)?.doubleValue ?? 1
      let result = try await mixProjectInternal(basePath: inputPath, overlays: [["path": overlayPath, "startMs": startMs, "volume": volume]], outputPath: outputPath)
      return result
    }

    AsyncFunction("mixProject") { (input: [String: Any?]) async throws -> [String: Any?] in
      guard let basePath = input["basePath"] as? String, !basePath.isEmpty else { throw NSError(domain: "AudioEditorNative", code: 30, userInfo: [NSLocalizedDescriptionKey: "Base audio path is required."]) }
      guard let outputPath = input["outputPath"] as? String, !outputPath.isEmpty else { throw NSError(domain: "AudioEditorNative", code: 31, userInfo: [NSLocalizedDescriptionKey: "Output audio path is required."]) }
      let overlays = (input["overlays"] as? [[String: Any?]]) ?? []
      guard !overlays.isEmpty else { throw NSError(domain: "AudioEditorNative", code: 32, userInfo: [NSLocalizedDescriptionKey: "At least one overlay audio track is required."]) }
      return try await mixProjectInternal(basePath: basePath, overlays: overlays, outputPath: outputPath)
    }
  }


    AsyncFunction("compress") { (input: [String: Any?]) async throws -> [String: Any?] in
      guard let inputPath = input["inputPath"] as? String, !inputPath.isEmpty else {
        throw NSError(domain: "AudioEditorNative", code: 70, userInfo: [NSLocalizedDescriptionKey: "Input audio path is required."])
      }
      guard let outputPath = input["outputPath"] as? String, !outputPath.isEmpty else {
        throw NSError(domain: "AudioEditorNative", code: 71, userInfo: [NSLocalizedDescriptionKey: "Output audio path is required."])
      }
      guard let bitrateKbps = (input["bitrateKbps"] as? NSNumber)?.intValue, (16...320).contains(bitrateKbps) else {
        throw NSError(domain: "AudioEditorNative", code: 72, userInfo: [NSLocalizedDescriptionKey: "Target bitrate must be between 16 and 320 kbps."])
      }
      guard let sampleRateHz = (input["sampleRateHz"] as? NSNumber)?.intValue,
            [8000, 12000, 16000, 22050, 24000, 32000, 44100, 48000].contains(sampleRateHz) else {
        throw NSError(domain: "AudioEditorNative", code: 73, userInfo: [NSLocalizedDescriptionKey: "Target sample rate is not supported."])
      }

      let inputURL = URL(fileURLWithPath: inputPath)
      let outputURL = URL(fileURLWithPath: outputPath)
      let asset = AVURLAsset(url: inputURL)
      let tracks = try await asset.load(.tracks)
      guard let audioTrack = tracks.first(where: { $0.mediaType == .audio }) else {
        throw NSError(domain: "AudioEditorNative", code: 74, userInfo: [NSLocalizedDescriptionKey: "No supported audio track was found."])
      }
      let descriptions = try await audioTrack.load(.formatDescriptions)
      guard let description = descriptions.first,
            let stream = CMAudioFormatDescriptionGetStreamBasicDescription(description) else {
        throw NSError(domain: "AudioEditorNative", code: 75, userInfo: [NSLocalizedDescriptionKey: "Unable to read source audio format."])
      }
      let channels = max(1, Int(stream.pointee.mChannelsPerFrame))
      guard channels <= 2 else {
        throw NSError(domain: "AudioEditorNative", code: 76, userInfo: [NSLocalizedDescriptionKey: "The compressor supports mono and stereo audio."])
      }

      if FileManager.default.fileExists(atPath: outputURL.path) {
        try FileManager.default.removeItem(at: outputURL)
      }
      try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)

      guard let reader = try? AVAssetReader(asset: asset) else {
        throw NSError(domain: "AudioEditorNative", code: 77, userInfo: [NSLocalizedDescriptionKey: "Audio reader is unavailable on this device."])
      }
      let readerOutput = AVAssetReaderTrackOutput(track: audioTrack, outputSettings: [
        AVFormatIDKey: kAudioFormatLinearPCM,
        AVSampleRateKey: sampleRateHz,
        AVNumberOfChannelsKey: channels,
        AVLinearPCMBitDepthKey: 16,
        AVLinearPCMIsFloatKey: false,
        AVLinearPCMIsBigEndianKey: false,
        AVLinearPCMIsNonInterleaved: false,
      ])
      reader.add(readerOutput)

      guard let writer = try? AVAssetWriter(outputURL: outputURL, fileType: .m4a) else {
        throw NSError(domain: "AudioEditorNative", code: 78, userInfo: [NSLocalizedDescriptionKey: "Audio writer is unavailable on this device."])
      }
      let writerInput = AVAssetWriterInput(mediaType: .audio, outputSettings: [
        AVFormatIDKey: kAudioFormatMPEG4AAC,
        AVSampleRateKey: sampleRateHz,
        AVNumberOfChannelsKey: channels,
        AVEncoderBitRateKey: bitrateKbps * 1000,
      ])
      writerInput.expectsMediaDataInRealTime = false
      writer.add(writerInput)

      reader.startReading()
      writer.startWriting()
      writer.startSession(atSourceTime: .zero)

      while writerInput.isReadyForMoreMediaData {
        guard let sample = readerOutput.copyNextSampleBuffer() else {
          writerInput.markAsFinished()
          break
        }
        if !writerInput.append(sample) {
          sample.withUnsafeMutablePointerToMemory { pointer, size, _ in
            _ = pointer
            _ = size
          }
          throw NSError(domain: "AudioEditorNative", code: 79, userInfo: [NSLocalizedDescriptionKey: "Audio compression failed while encoding."])
        }
      }

      await withCheckedContinuation { continuation in
        writer.finishWriting { continuation.resume() }
      }

      guard writer.status == .completed else {
        throw writer.error ?? NSError(domain: "AudioEditorNative", code: 80, userInfo: [NSLocalizedDescriptionKey: "Audio compression export failed."])
      }

      let inputBytes = (try? FileManager.default.attributesOfItem(atPath: inputURL.path)[.size] as? NSNumber)?.int64Value ?? -1
      let outputBytes = (try? FileManager.default.attributesOfItem(atPath: outputURL.path)[.size] as? NSNumber)?.int64Value ?? -1
      let duration = try await asset.load(.duration)

      return [
        "outputPath": outputURL.path,
        "durationMs": duration.seconds * 1000,
        "sampleRate": sampleRateHz,
        "channels": channels,
        "mimeType": "audio/mp4",
        "bitrateKbps": bitrateKbps,
        "inputSizeBytes": inputBytes,
        "outputSizeBytes": outputBytes,
      ]
    }

    AsyncFunction("applyEffect") { (input: [String: Any?]) async throws -> [String: Any?] in
      guard let inputPath = input["inputPath"] as? String, !inputPath.isEmpty else { throw NSError(domain: "AudioEditorNative", code: 50, userInfo: [NSLocalizedDescriptionKey: "Input audio path is required."]) }
      guard let outputPath = input["outputPath"] as? String, !outputPath.isEmpty else { throw NSError(domain: "AudioEditorNative", code: 51, userInfo: [NSLocalizedDescriptionKey: "Output audio path is required."]) }
      guard let effect = input["effect"] as? String, !effect.isEmpty else { throw NSError(domain: "AudioEditorNative", code: 52, userInfo: [NSLocalizedDescriptionKey: "Audio effect is required."]) }
      let startMs = (input["startMs"] as? NSNumber)?.doubleValue ?? 0
      let endMs = (input["endMs"] as? NSNumber)?.doubleValue
      let amount = (input["amount"] as? NSNumber)?.doubleValue ?? 0.95
      guard startMs.isFinite, startMs >= 0, (endMs == nil || endMs!.isFinite) else { throw NSError(domain: "AudioEditorNative", code: 53, userInfo: [NSLocalizedDescriptionKey: "Effect range is invalid."]) }
      let normalizedEffect = effect.lowercased()
      guard ["volume", "fade-in", "fade-out", "normalize"].contains(normalizedEffect) else { throw NSError(domain: "AudioEditorNative", code: 54, userInfo: [NSLocalizedDescriptionKey: "Unsupported audio effect."]) }
      if normalizedEffect == "volume" { guard amount.isFinite, amount >= 0, amount <= 2 else { throw NSError(domain: "AudioEditorNative", code: 55, userInfo: [NSLocalizedDescriptionKey: "Volume amount must be between 0 and 2."]) } }

      let inputURL = URL(fileURLWithPath: inputPath)
      let outputURL = URL(fileURLWithPath: outputPath)
      let asset = AVURLAsset(url: inputURL)
      let tracks = try await asset.load(.tracks)
      guard let track = tracks.first(where: { $0.mediaType == .audio }) else { throw NSError(domain: "AudioEditorNative", code: 57, userInfo: [NSLocalizedDescriptionKey: "No supported audio track was found."]) }
      let duration = try await asset.load(.duration)
      let durationMs = duration.seconds * 1000
      let safeStart = min(max(startMs, 0), durationMs)
      let safeEnd = min(max(endMs ?? durationMs, safeStart), durationMs)
      guard safeEnd > safeStart else { throw NSError(domain: "AudioEditorNative", code: 58, userInfo: [NSLocalizedDescriptionKey: "Effect range is invalid."]) }

      if FileManager.default.fileExists(atPath: outputURL.path) { try FileManager.default.removeItem(at: outputURL) }
      try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)

      let composition = AVMutableComposition()
      guard let outputTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
        throw NSError(domain: "AudioEditorNative", code: 61, userInfo: [NSLocalizedDescriptionKey: "Unable to create audio composition track."])
      }
      try outputTrack.insertTimeRange(CMTimeRange(start: .zero, duration: duration), of: track, at: .zero)

      if normalizedEffect == "normalize" {
        throw NSError(domain: "AudioEditorNative", code: 63, userInfo: [NSLocalizedDescriptionKey: "Normalize is not supported on this iOS audio backend yet."])
      }

      let mix = AVMutableAudioMix()
      let params = AVMutableAudioMixInputParameters(track: outputTrack)
      let effectStart = CMTime(seconds: safeStart / 1000, preferredTimescale: 600)
      let effectDuration = CMTime(seconds: (safeEnd - safeStart) / 1000, preferredTimescale: 600)
      switch normalizedEffect {
      case "volume":
        params.setVolumeRamp(fromStartVolume: 1, toEndVolume: Float(amount), timeRange: CMTimeRange(start: effectStart, duration: effectDuration))
      case "fade-in":
        params.setVolumeRamp(fromStartVolume: 0, toEndVolume: 1, timeRange: CMTimeRange(start: effectStart, duration: effectDuration))
      case "fade-out":
        params.setVolumeRamp(fromStartVolume: 1, toEndVolume: 0, timeRange: CMTimeRange(start: effectStart, duration: effectDuration))
      default:
        break
      }
      mix.inputParameters = [params]

      guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetAppleM4A) else {
        throw NSError(domain: "AudioEditorNative", code: 60, userInfo: [NSLocalizedDescriptionKey: "Audio export is unavailable on this device."])
      }
      exporter.audioMix = mix
      exporter.outputURL = outputURL
      exporter.outputFileType = .m4a
      exporter.shouldOptimizeForNetworkUse = false
      await exporter.export()
      guard exporter.status == .completed else {
        throw exporter.error ?? NSError(domain: "AudioEditorNative", code: 62, userInfo: [NSLocalizedDescriptionKey: "Audio effect export failed."])
      }
      return ["outputPath": outputURL.path, "durationMs": durationMs, "sampleRate": 0, "channels": 0, "mimeType": "audio/mp4"]
    }

  private func mixProjectInternal(basePath: String, overlays: [[String: Any?]], outputPath: String) async throws -> [String: Any?] {
    let base = AVURLAsset(url: URL(fileURLWithPath: basePath))
    let baseTracks = try await base.load(.tracks)
    guard let baseTrack = baseTracks.first(where: { $0.mediaType == .audio }) else {
      throw NSError(domain: "AudioEditorNative", code: 33, userInfo: [NSLocalizedDescriptionKey: "No supported base audio track was found."])
    }
    let baseDuration = try await base.load(.duration)
    let baseDescriptions = try await baseTrack.load(.formatDescriptions)
    guard let baseDescription = baseDescriptions.first,
          let baseStream = CMAudioFormatDescriptionGetStreamBasicDescription(baseDescription) else {
      throw NSError(domain: "AudioEditorNative", code: 34, userInfo: [NSLocalizedDescriptionKey: "Unable to read base audio format information."])
    }
    let baseSampleRate = baseStream.pointee.mSampleRate
    let baseChannels = Int(baseStream.pointee.mChannelsPerFrame)

    let composition = AVMutableComposition()
    guard let compositionBase = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
      throw NSError(domain: "AudioEditorNative", code: 35, userInfo: [NSLocalizedDescriptionKey: "Unable to create base audio composition track."])
    }
    try compositionBase.insertTimeRange(CMTimeRange(start: .zero, duration: baseDuration), of: baseTrack, at: .zero)

    var compositionTracks: [AVMutableCompositionTrack] = [compositionBase]
    for (index, raw) in overlays.enumerated() {
      guard let path = raw["path"] as? String, !path.isEmpty else { throw NSError(domain: "AudioEditorNative", code: 36, userInfo: [NSLocalizedDescriptionKey: "Audio track \(index + 1) path is required."]) }
      let startMs = (raw["startMs"] as? NSNumber)?.doubleValue ?? 0
      let volume = (raw["volume"] as? NSNumber)?.doubleValue ?? 1
      guard startMs.isFinite, startMs >= 0, volume.isFinite, volume >= 0, volume <= 2 else { throw NSError(domain: "AudioEditorNative", code: 37, userInfo: [NSLocalizedDescriptionKey: "Audio track \(index + 1) settings are invalid."]) }

      let overlay = AVURLAsset(url: URL(fileURLWithPath: path))
      let overlayTracks = try await overlay.load(.tracks)
      guard let overlayTrack = overlayTracks.first(where: { $0.mediaType == .audio }) else { throw NSError(domain: "AudioEditorNative", code: 38, userInfo: [NSLocalizedDescriptionKey: "No supported audio track found for item \(index + 1)."]) }
      let overlayDescriptions = try await overlayTrack.load(.formatDescriptions)
      guard let description = overlayDescriptions.first,
            let stream = CMAudioFormatDescriptionGetStreamBasicDescription(description) else { throw NSError(domain: "AudioEditorNative", code: 39, userInfo: [NSLocalizedDescriptionKey: "Unable to read audio format for item \(index + 1)."] ) }
      guard abs(baseSampleRate - stream.pointee.mSampleRate) < 0.5 else { throw NSError(domain: "AudioEditorNative", code: 40, userInfo: [NSLocalizedDescriptionKey: "Audio track \(index + 1) sample rate does not match the base audio."]) }
      guard baseChannels == Int(stream.pointee.mChannelsPerFrame) else { throw NSError(domain: "AudioEditorNative", code: 41, userInfo: [NSLocalizedDescriptionKey: "Audio track \(index + 1) channel count does not match the base audio."]) }
      let overlayDuration = try await overlay.load(.duration)
      guard overlayDuration.seconds > 0 else { throw NSError(domain: "AudioEditorNative", code: 42, userInfo: [NSLocalizedDescriptionKey: "Audio track \(index + 1) is empty."]) }
      let compositionTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!
      try compositionTrack.insertTimeRange(CMTimeRange(start: .zero, duration: overlayDuration), of: overlayTrack, at: CMTime(seconds: startMs / 1000.0, preferredTimescale: 600))
      compositionTracks.append(compositionTrack)
    }

    let audioMix = AVMutableAudioMix()
    let baseParameters = AVMutableAudioMixInputParameters(track: compositionBase)
    var parameters: [AVAudioMixInputParameters] = [baseParameters]
    for (index, raw) in overlays.enumerated() {
      let volume = (raw["volume"] as? NSNumber)?.floatValue ?? 1
      let parameter = AVMutableAudioMixInputParameters(track: compositionTracks[index + 1])
      parameter.setVolume(volume, at: .zero)
      parameters.append(parameter)
    }
    audioMix.inputParameters = parameters

    if FileManager.default.fileExists(atPath: outputPath) { try FileManager.default.removeItem(atPath: outputPath) }
    let outputURL = URL(fileURLWithPath: outputPath)
    try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)
    guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetAppleM4A) else { throw NSError(domain: "AudioEditorNative", code: 43, userInfo: [NSLocalizedDescriptionKey: "Audio mix export is unavailable on this device."]) }
    exporter.outputURL = outputURL
    exporter.outputFileType = .m4a
    exporter.audioMix = audioMix
    exporter.shouldOptimizeForNetworkUse = false
    await exporter.export()
    guard exporter.status == .completed else { throw exporter.error ?? NSError(domain: "AudioEditorNative", code: 44, userInfo: [NSLocalizedDescriptionKey: "Audio mix export failed."]) }

    return ["outputPath": outputURL.path, "durationMs": composition.duration.seconds * 1000, "sampleRate": Int(baseSampleRate), "channels": baseChannels, "mimeType": "audio/mp4"]
  }
}
