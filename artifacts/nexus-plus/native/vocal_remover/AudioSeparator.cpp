#include "AudioSeparator.h"

#include <algorithm>
#include <cmath>

namespace nexus::vocal {

bool AudioSeparator::separate(const PcmAudio& input,
                              PcmAudio* output,
                              const Options& options,
                              const ProgressCallback& callback,
                              const std::atomic<bool>& cancelled,
                              std::string* error) const {
  if (!output || input.channels < 1 || input.sampleRate < 1 || input.samples.empty()) {
    if (error) *error = "Invalid PCM input.";
    return false;
  }

  output->sampleRate = input.sampleRate;
  output->channels = input.channels;
  output->samples.resize(input.samples.size());

  // Lightweight, deterministic stereo center-channel suppression. This is a
  // useful CPU-only fallback and keeps the APK free of a large neural model.
  // For mono content, the signal is copied rather than destroyed.
  const bool stereo = input.channels == 2;
  const size_t frameCount = input.samples.size() / static_cast<size_t>(input.channels);

  for (size_t frame = 0; frame < frameCount; ++frame) {
    if (cancelled.load()) {
      if (error) *error = "Operation cancelled.";
      return false;
    }

    const size_t base = frame * static_cast<size_t>(input.channels);
    if (stereo) {
      const float left = input.samples[base];
      const float right = input.samples[base + 1];
      const float mid = 0.5f * (left + right);
      const float side = 0.5f * (left - right);

      // Vocal-heavy material is often centered. Preserve side energy and
      // optionally preserve some low-frequency center content for bass.
      const float bassMix = options.preserveBass ? 0.35f : 0.0f;
      output->samples[base] = side + bassMix * mid;
      output->samples[base + 1] = -side + bassMix * mid;
    } else {
      output->samples[base] = input.samples[base];
    }

    if ((frame & 0x1FFFu) == 0) {
      const float progress = 0.1f + 0.75f * static_cast<float>(frame) / static_cast<float>(std::max<size_t>(1, frameCount));
      if (callback) callback({progress, "separating"});
    }
  }

  if (callback) callback({0.92f, "post-processing"});
  if (callback) callback({1.0f, "complete"});
  return true;
}

}  // namespace nexus::vocal
