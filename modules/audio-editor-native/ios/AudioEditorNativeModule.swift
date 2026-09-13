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
      let formatDescriptions = try await audioTrack.load(.formatDescriptions)
      var sampleRate = 0
      var channels = 0
      if let formatDescription = formatDescriptions.first,
         let streamDescription = CMAudioFormatDescriptionGetStreamBasicDescription(formatDescription) {
        sampleRate = Int(streamDescription.pointee.mSampleRate)
        channels = Int(streamDescription.pointee.mChannelsPerFrame)
      }
      return [
        "durationMs": duration.seconds * 1000,
        "sampleRate": sampleRate,
        "channels": channels,
        "mimeType": audioTrack.mediaSubtypes.first.map { $0 as String }
      ]
    }

    AsyncFunction("trim") { (inputPath: String, outputPath: String, startMs: Double, endMs: Double) throws -> Void in
      throw NSError(domain: "AudioEditorNative", code: 2, userInfo: [NSLocalizedDescriptionKey: "The native trim/export stage is not enabled until the verified export pipeline is linked."])
    }
  }
}
