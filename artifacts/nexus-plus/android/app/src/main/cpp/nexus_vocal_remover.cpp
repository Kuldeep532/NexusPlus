#include "nexus_vocal_remover.h"

#include <algorithm>
#include <cmath>
#include <fstream>
#include <vector>

namespace nexus::audio {
namespace {

constexpr int kStagePreparing = 0;
constexpr int kStageSeparating = 1;
constexpr int kStageEncoding = 2;
constexpr int kStageComplete = 3;
constexpr int kStageError = 4;

void report(ProgressCallback callback, void* user, int stage, float progress, const char* message) {
  if (callback) callback(stage, std::clamp(progress, 0.0f, 1.0f), message, user);
}

// Native DSP fallback for stereo material. It is intentionally simple and
// deterministic: center-channel cancellation derives instrumental audio from
// Mid/Side, while the vocals stem is reconstructed from the center component.
// A model-backed separator can replace this processor without changing JNI.
void phase_split(const float* interleaved, std::size_t frames, float* output, Stem stem) {
  for (std::size_t i = 0; i < frames; ++i) {
    const float left = interleaved[i * 2];
    const float right = interleaved[i * 2 + 1];
    const float mid = 0.5f * (left + right);
    const float side = 0.5f * (left - right);

    float out_l = 0.0f;
    float out_r = 0.0f;
    if (stem == Stem::Vocals) {
      out_l = mid;
      out_r = mid;
    } else {
      out_l = side;
      out_r = -side;
    }

    output[i * 2] = out_l;
    output[i * 2 + 1] = out_r;
  }
}

}  // namespace

VocalRemover::VocalRemover() = default;
VocalRemover::~VocalRemover() = default;

bool VocalRemover::is_available() const {
  return true;
}

bool VocalRemover::separate_file(const std::string& input_path,
                                 const std::string& output_path,
                                 const Options& options,
                                 ProgressCallback callback,
                                 void* user,
                                 std::string* error) {
  cancelled_.store(false);
  report(callback, user, kStagePreparing, 0.02f, "Preparing native audio processor");

  // The current core expects PCM float32 stereo WAV input. Codec conversion
  // should be handled by the Android media/codec layer before calling this
  // function. This keeps the DSP core independent of Java/Kotlin and codecs.
  std::ifstream input(input_path, std::ios::binary);
  std::ofstream output(output_path, std::ios::binary | std::ios::trunc);
  if (!input || !output) {
    if (error) *error = "Unable to open native audio input/output.";
    report(callback, user, kStageError, 1.0f, "Unable to open audio files");
    return false;
  }

  input.seekg(0, std::ios::end);
  const auto end = input.tellg();
  input.seekg(0, std::ios::beg);
  if (end <= 0) {
    if (error) *error = "Empty audio input.";
    report(callback, user, kStageError, 1.0f, "Empty audio input");
    return false;
  }

  const std::size_t total_bytes = static_cast<std::size_t>(end);
  const std::size_t frame_bytes = sizeof(float) * 2;
  std::vector<float> input_buffer(4096 * 2);
  std::vector<float> output_buffer(4096 * 2);
  std::size_t processed = 0;

  while (input && processed < total_bytes) {
    if (cancelled_.load()) {
      if (error) *error = "Vocal-removal job cancelled.";
      return false;
    }

    input.read(reinterpret_cast<char*>(input_buffer.data()),
               static_cast<std::streamsize>(input_buffer.size() * sizeof(float)));
    const auto bytes = static_cast<std::size_t>(input.gcount());
    if (bytes == 0) break;
    const auto frames = bytes / frame_bytes;

    phase_split(input_buffer.data(), frames, output_buffer.data(), options.stem);
    output.write(reinterpret_cast<const char*>(output_buffer.data()),
                 static_cast<std::streamsize>(frames * frame_bytes));
    if (!output) {
      if (error) *error = "Failed to write native vocal-removal output.";
      report(callback, user, kStageError, 1.0f, "Failed to write output");
      return false;
    }

    processed += frames * frame_bytes;
    report(callback, user, kStageSeparating,
           total_bytes == 0 ? 0.5f : static_cast<float>(processed) / static_cast<float>(total_bytes),
           "Processing audio natively");
  }

  report(callback, user, kStageEncoding, 0.95f, "Finalizing native audio output");
  report(callback, user, kStageComplete, 1.0f, "Native vocal separation complete");
  return true;
}

void VocalRemover::cancel() {
  cancelled_.store(true);
}

void VocalRemover::dispose() {
  cancelled_.store(true);
}

}  // namespace nexus::audio
