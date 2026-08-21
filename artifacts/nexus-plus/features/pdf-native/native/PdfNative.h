#pragma once

#include <string>
#include <vector>

namespace nexus::pdf {
class PdfNative {
 public:
  bool merge(const std::vector<std::string>& inputPaths, const std::string& outputPath, std::string* error = nullptr) const;
  bool imageToPdf(const std::vector<std::string>& imagePaths, const std::string& outputPath, int quality, std::string* error = nullptr) const;
  bool protect(const std::string& inputPath, const std::string& outputPath, const std::string& password, std::string* error = nullptr) const;
  bool unlock(const std::string& inputPath, const std::string& outputPath, const std::string& password, std::string* error = nullptr) const;
  bool compress(const std::string& inputPath, const std::string& outputPath, int quality, std::string* error = nullptr) const;
};
}
