#pragma once

#include <atomic>
#include <cstdint>
#include <string>

namespace nexus::audio {

enum class Stem {
  Vocals,
  Instrumental,
};

enum class Quality {
  Preview,
  Balanced,
  Studio,
};

struct Options {
  Stem stem = Stem::Instrumental;
  Quality quality = Quality::Balanced;
  bool preserve_bass = true;
  bool preserve_stereo = true;
  int chunk_seconds = 12;
};

using ProgressCallback = void (*)(int stage, float progress, const char* message, void* user);

class VocalRemover {
 public:
  VocalRemover();
  ~VocalRemover();

  VocalRemover(const VocalRemover&) = delete;
  VocalRemover& operator=(const VocalRemover&) = delete;

  bool is_available() const;

  bool separate_file(const std::string& input_path,
                     const std::string& output_path,
                     const Options& options,
                     ProgressCallback callback,
                     void* user,
                     std::string* error);

  void cancel();
  void dispose();

 private:
  std::atomic<bool> cancelled_{false};
};

}  // namespace nexus::audio
