#pragma once

#include <atomic>
#include <cstdint>
#include <functional>
#include <string>

namespace nexus::vocal {

struct Options {
  enum class Stem { Instrumental, Vocals, Both };
  enum class Quality { Fast, Balanced, High };

  Stem outputStem = Stem::Instrumental;
  Quality quality = Quality::Balanced;
  bool preserveBass = true;
  bool preserveStereo = true;
};

struct Progress {
  float value = 0.0f;
  std::string stage;
};

using ProgressCallback = std::function<void(const Progress&)>;

class VocalRemover {
 public:
  VocalRemover();
  ~VocalRemover();

  VocalRemover(const VocalRemover&) = delete;
  VocalRemover& operator=(const VocalRemover&) = delete;

  bool separate(const std::string& inputPath,
                const std::string& outputPath,
                const Options& options,
                const ProgressCallback& callback,
                std::string* error);

  void cancel();
  bool isCancelled() const;

 private:
  std::atomic<bool> cancelled_{false};
};

}  // namespace nexus::vocal
