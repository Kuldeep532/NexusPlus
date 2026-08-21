#include "VocalRemover.h"
#include "AudioDecoder.h"
#include "AudioSeparator.h"
#include "AudioWriter.h"

namespace nexus::vocal {

VocalRemover::VocalRemover() = default;
VocalRemover::~VocalRemover() = default;

bool VocalRemover::separate(const std::string& inputPath,
                            const std::string& outputPath,
                            const Options& options,
                            const ProgressCallback& callback,
                            std::string* error) {
  cancelled_.store(false);
  if (callback) callback({0.02f, "preparing"});

  AudioDecoder decoder;
  PcmAudio input;
  if (!decoder.decode(inputPath, &input, error)) {
    return false;
  }

  AudioSeparator separator;
  PcmAudio output;
  if (!separator.separate(input, &output, options, callback, cancelled_, error)) {
    return false;
  }

  AudioWriter writer;
  if (!writer.writeWav(outputPath, output, error)) {
    return false;
  }

  if (callback) callback({1.0f, "complete"});
  return true;
}

void VocalRemover::cancel() {
  cancelled_.store(true);
}

bool VocalRemover::isCancelled() const {
  return cancelled_.load();
}

}  // namespace nexus::vocal
