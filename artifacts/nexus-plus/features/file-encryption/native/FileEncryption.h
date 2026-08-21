#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace nexus::crypto {

struct Options {
  std::string password;
  std::uint32_t iterations = 600000;
};

class FileEncryption {
 public:
  bool lock(const std::string& inputPath,
            const std::string& outputPath,
            const Options& options,
            std::string* error = nullptr) const;

  bool unlock(const std::string& inputPath,
              const std::string& outputPath,
              const Options& options,
              std::string* error = nullptr) const;
};

}  // namespace nexus::crypto
