#include "AudioWriter.h"

#include <algorithm>
#include <cstdint>
#include <fstream>
#include <limits>

namespace nexus::vocal {
namespace {

void writeU16(std::ofstream& out, std::uint16_t value) {
  const char bytes[2] = {
      static_cast<char>(value & 0xFFu),
      static_cast<char>((value >> 8u) & 0xFFu),
  };
  out.write(bytes, 2);
}

void writeU32(std::ofstream& out, std::uint32_t value) {
  const char bytes[4] = {
      static_cast<char>(value & 0xFFu),
      static_cast<char>((value >> 8u) & 0xFFu),
      static_cast<char>((value >> 16u) & 0xFFu),
      static_cast<char>((value >> 24u) & 0xFFu),
  };
  out.write(bytes, 4);
}

}  // namespace

bool AudioWriter::writeWav(const std::string& outputPath, const PcmAudio& audio, std::string* error) const {
  if (audio.sampleRate < 1 || audio.channels < 1 || audio.channels > 8 || audio.samples.empty()) {
    if (error) *error = "Invalid PCM data for WAV output.";
    return false;
  }

  const std::uint64_t sampleCount = audio.samples.size();
  const std::uint64_t byteCount64 = sampleCount * sizeof(std::int16_t);
  if (byteCount64 > std::numeric_limits<std::uint32_t>::max() - 44u) {
    if (error) *error = "Output is too large for the WAV writer.";
    return false;
  }

  const auto byteCount = static_cast<std::uint32_t>(byteCount64);
  const auto dataRate = static_cast<std::uint32_t>(audio.sampleRate * audio.channels * sizeof(std::int16_t));
  const auto blockAlign = static_cast<std::uint16_t>(audio.channels * sizeof(std::int16_t));

  std::ofstream out(outputPath, std::ios::binary | std::ios::trunc);
  if (!out.is_open()) {
    if (error) *error = "Unable to create WAV output.";
    return false;
  }

  out.write("RIFF", 4);
  writeU32(out, 36u + byteCount);
  out.write("WAVE", 4);
  out.write("fmt ", 4);
  writeU32(out, 16u);
  writeU16(out, 1u);
  writeU16(out, static_cast<std::uint16_t>(audio.channels));
  writeU32(out, static_cast<std::uint32_t>(audio.sampleRate));
  writeU32(out, dataRate);
  writeU16(out, blockAlign);
  writeU16(out, 16u);
  out.write("data", 4);
  writeU32(out, byteCount);

  for (float value : audio.samples) {
    value = std::max(-1.0f, std::min(1.0f, value));
    const auto pcm = static_cast<std::int16_t>(value * 32767.0f);
    writeU16(out, static_cast<std::uint16_t>(pcm));
  }

  if (!out.good()) {
    if (error) *error = "Failed while writing WAV output.";
    return false;
  }
  return true;
}

}  // namespace nexus::vocal
