#include "PdfNative.h"

#include <fstream>
#include <string>

namespace nexus::pdf {

namespace {
void unavailable(std::string* error) {
  if (error) *error = "Native PDF backend is not linked in this build";
}

bool copyFile(const std::string& inputPath, const std::string& outputPath, std::string* error) {
  std::ifstream input(inputPath, std::ios::binary);
  if (!input) {
    if (error) *error = "Unable to open input PDF";
    return false;
  }
  std::ofstream output(outputPath, std::ios::binary | std::ios::trunc);
  if (!output) {
    if (error) *error = "Unable to open output PDF";
    return false;
  }
  output << input.rdbuf();
  if (!output.good()) {
    if (error) *error = "Failed to write output PDF";
    return false;
  }
  return true;
}
}

bool PdfNative::merge(const std::vector<std::string>&, const std::string&, std::string* error) const {
  unavailable(error);
  return false;
}

bool PdfNative::imageToPdf(const std::vector<std::string>&, const std::string&, int, std::string* error) const {
  unavailable(error);
  return false;
}

bool PdfNative::protect(const std::string&, const std::string&, const std::string&, std::string* error) const {
  unavailable(error);
  return false;
}

bool PdfNative::unlock(const std::string&, const std::string&, const std::string&, std::string* error) const {
  unavailable(error);
  return false;
}

bool PdfNative::compress(const std::string&, const std::string&, int, std::string* error) const {
  unavailable(error);
  return false;
}

}  // namespace nexus::pdf
