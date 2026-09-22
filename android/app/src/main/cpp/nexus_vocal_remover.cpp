#include "nexus_vocal_remover.h"

#include <fstream>
#include <vector>
#include <algorithm>
#include <cmath>

namespace nexus::audio {

namespace {
struct PcmAudio {
  int sample_rate = 0;
  int channels = 0;
  std::vector<float> samples;
};

static std::uint32_t readU32(std::ifstream& in) {
  unsigned char b[4]{};
  in.read(reinterpret_cast<char*>(b), 4);
  return static_cast<std::uint32_t>(b[0]) |
         (static_cast<std::uint32_t>(b[1]) << 8u) |
         (static_cast<std::uint32_t>(b[2]) << 16u) |
         (static_cast<std::uint32_t>(b[3]) << 24u);
}

static std::uint16_t readU16(std::ifstream& in) {
  unsigned char b[2]{};
  in.read(reinterpret_cast<char*>(b), 2);
  return static_cast<std::uint16_t>(b[0]) | (static_cast<std::uint16_t>(b[1]) << 8u);
}

static bool decodeWav(const std::string& path, PcmAudio* out, std::string* error) {
  if (!out) {
    if (error) *error = "Audio output buffer is null.";
    return false;
  }

  std::ifstream in(path, std::ios::binary);
  if (!in.is_open()) {
    if (error) *error = "Unable to open input audio.";
    return false;
  }

  char riff[4]{};
  char wave[4]{};
  in.read(riff, 4);
  (void)readU32(in);
  in.read(wave, 4);
  if (std::string(riff, 4) != "RIFF" || std::string(wave, 4) != "WAVE") {
    if (error) *error = "Only PCM WAV input is supported by the native fallback decoder.";
    return false;
  }

  int channels = 0;
  int sample_rate = 0;
  int bits_per_sample = 0;
  std::uint32_t data_size = 0;
  std::streamoff data_offset = 0;

  while (in.good() && !data_offset) {
    char chunkId[4]{};
    in.read(chunkId, 4);
    if (!in.good()) break;
    const auto chunkSize = readU32(in);
    const std::string id(chunkId, 4);

    if (id == "fmt ") {
      const auto format = readU16(in);
      channels = static_cast<int>(readU16(in));
      sample_rate = static_cast<int>(readU32(in));
      (void)readU32(in);
      (void)readU16(in);
      bits_per_sample = static_cast<int>(readU16(in));
      if (format != 1 || bits_per_sample != 16 || channels < 1 || channels > 2 || sample_rate < 1) {
        if (error) *error = "Input WAV must be 16-bit PCM mono or stereo.";
        return false;
      }
      if (chunkSize > 16) in.seekg(static_cast<std::streamoff>(chunkSize - 16), std::ios::cur);
    } else if (id == "data") {
      data_offset = in.tellg();
      data_size = chunkSize;
      in.seekg(static_cast<std::streamoff>(chunkSize), std::ios::cur);
    } else {
      in.seekg(static_cast<std::streamoff>(chunkSize), std::ios::cur);
    }
  }

  if (!data_offset || channels < 1 || sample_rate < 1 || data_size == 0) {
    if (error) *error = "No valid PCM data was found in the WAV input.";
    return false;
  }

  const std::size_t sampleCount = data_size / sizeof(std::int16_t);
  out->sample_rate = sample_rate;
  out->channels = channels;
  out->samples.resize(sampleCount);

  in.clear();
  in.seekg(data_offset);
  for (std::size_t i = 0; i < sampleCount; ++i) {
    const auto sample = static_cast<std::int16_t>(readU16(in));
    out->samples[i] = static_cast<float>(sample) / 32768.0f;
  }
  return true;
}

static void writeU16(std::ofstream& out, std::uint16_t value) {
  const char bytes[2] = {
      static_cast<char>(value & 0xFFu),
      static_cast<char>((value >> 8u) & 0xFFu),
  };
  out.write(bytes, 2);
}

static void writeU32(std::ofstream& out, std::uint32_t value) {
  const char bytes[4] = {
      static_cast<char>(value & 0xFFu),
      static_cast<char>((value >> 8u) & 0xFFu),
      static_cast<char>((value >> 16u) & 0xFFu),
      static_cast<char>((value >> 24u) & 0xFFu),
  };
  out.write(bytes, 4);
}

static bool writeWav(const std::string& path, const PcmAudio& audio, std::string* error) {
  if (audio.sample_rate < 1 || audio.channels < 1 || audio.samples.empty()) {
    if (error) *error = "Invalid processed audio.";
    return false;
  }
  const std::uint64_t dataBytes64 = audio.samples.size() * sizeof(std::int16_t);
  if (dataBytes64 > 0xFFFFFFFFu - 44u) {
    if (error) *error = "Processed audio is too large for WAV output.";
    return false;
  }

  const auto dataBytes = static_cast<std::uint32_t>(dataBytes64);
  const auto blockAlign = static_cast<std::uint16_t>(audio.channels * 2);
  const auto byteRate = static_cast<std::uint32_t>(audio.sample_rate * blockAlign);

  std::ofstream out(path, std::ios::binary | std::ios::trunc);
  if (!out.is_open()) {
    if (error) *error = "Unable to create vocal-removal output.";
    return false;
  }

  out.write("RIFF", 4);
  writeU32(out, 36u + dataBytes);
  out.write("WAVE", 4);
  out.write("fmt ", 4);
  writeU32(out, 16u);
  writeU16(out, 1u);
  writeU16(out, static_cast<std::uint16_t>(audio.channels));
  writeU32(out, static_cast<std::uint32_t>(audio.sample_rate));
  writeU32(out, byteRate);
  writeU16(out, blockAlign);
  writeU16(out, 16u);
  out.write("data", 4);
  writeU32(out, dataBytes);

  for (float sample : audio.samples) {
    const float clamped = std::max(-1.0f, std::min(1.0f, sample));
    writeU16(out, static_cast<std::uint16_t>(static_cast<std::int16_t>(clamped * 32767.0f)));
  }

  if (!out.good()) {
    if (error) *error = "Failed while writing vocal-removal output.";
    return false;
  }
  return true;
}

static const char* stageName(int stage) {
  switch (stage) {
    case 0: return "preparing";
    case 1: return "separating";
    default: return "complete";
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
  if (callback) callback(0, 0.02f, "Loading audio", user);

  PcmAudio input;
  if (!decodeWav(input_path, &input, error)) return false;

  PcmAudio output = input;
  if (input.channels == 2) {
    const std::size_t frames = input.samples.size() / 2u;
    const float preserveCenter = options.preserve_bass ? 0.12f : 0.0f;

    for (std::size_t frame = 0; frame < frames; ++frame) {
      if (cancelled_.load()) {
        if (error) *error = "Operation cancelled.";
        return false;
      }

      const std::size_t base = frame * 2u;
      const float left = input.samples[base];
      const float right = input.samples[base + 1];
      const float mid = 0.5f * (left + right);
      const float side = 0.5f * (left - right);

      if (options.stem == Stem::Vocals) {
        output.samples[base] = mid;
        output.samples[base + 1] = mid;
      } else {
        output.samples[base] = side + preserveCenter * mid;
        output.samples[base + 1] = -side + preserveCenter * mid;
      }

      if ((frame & 0x3FFFu) == 0u && callback) {
        const float progress = 0.05f + 0.88f * static_cast<float>(frame) /
            static_cast<float>(std::max<std::size_t>(1, frames));
        callback(1, progress, stageName(1), user);
      }
    }
  } else {
    if (options.stem == Stem::Instrumental) {
      if (callback) callback(1, 0.5f, "Mono source cannot isolate vocals reliably; preserving source", user);
    }
  }

  if (callback) callback(2, 0.94f, "Writing output", user);
  if (!writeWav(output_path, output, error)) return false;
  if (callback) callback(2, 1.0f, "complete", user);
  return true;
}

void VocalRemover::cancel() {
  cancelled_.store(true);
}

void VocalRemover::dispose() {
  cancelled_.store(false);
}

}  // namespace nexus::audio
