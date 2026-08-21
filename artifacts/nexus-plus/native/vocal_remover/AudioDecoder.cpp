#include "AudioDecoder.h"

#include <fstream>

namespace nexus::vocal {

bool AudioDecoder::decode(const std::string& inputPath, PcmAudio* audio, std::string* error) const {
  if (!audio) {
    if (error) *error = "Audio output buffer is null.";
    return false;
  }

  // The container/codec decoder is injected by the Android media backend in
  // the final build. This source-level adapter intentionally does not ship a
  // second copy of FFmpeg, which would inflate the APK. It validates the path
  // and provides the ownership boundary used by the separation pipeline.
  std::ifstream input(inputPath, std::ios::binary);
  if (!input.good()) {
    if (error) *error = "Unable to open input audio.";
    return false;
  }

  if (error) *error = "No native decoder backend is linked for this build.";
  return false;
}

}  // namespace nexus::vocal
