#pragma once

#include "AudioDecoder.h"
#include "VocalRemover.h"

namespace nexus::vocal {

class AudioSeparator {
 public:
  bool separate(const PcmAudio& input,
                PcmAudio* output,
                const Options& options,
                const ProgressCallback& callback,
                const std::atomic<bool>& cancelled,
                std::string* error) const;
};

}  // namespace nexus::vocal
