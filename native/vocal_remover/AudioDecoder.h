#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace nexus::vocal {

struct PcmAudio {
  int sampleRate = 0;
  int channels = 0;
  std::vector<float> samples;
};

class AudioDecoder {
 public:
  bool decode(const std::string& inputPath, PcmAudio* audio, std::string* error) const;
};

}  // namespace nexus::vocal
