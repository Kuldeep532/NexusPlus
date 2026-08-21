#pragma once

#include "AudioDecoder.h"
#include <string>

namespace nexus::vocal {

class AudioWriter {
 public:
  bool writeWav(const std::string& outputPath, const PcmAudio& audio, std::string* error) const;
};

}  // namespace nexus::vocal
