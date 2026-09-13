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
  }
}
