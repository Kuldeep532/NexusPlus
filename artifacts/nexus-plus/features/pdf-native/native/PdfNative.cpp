#include "PdfNative.h"

namespace nexus::pdf {

namespace {
void unavailable(std::string* error) {
  if (error) *error = "Native PDF backend is not linked in this build";
}
}

bool PdfNative::merge(const std::vector<std::string>&, const std::string&, std::string* error) const { unavailable(error); return false; }
bool PdfNative::imageToPdf(const std::vector<std::string>&, const std::string&, int, std::string* error) const { unavailable(error); return false; }
bool PdfNative::protect(const std::string&, const std::string&, const std::string&, std::string* error) const { unavailable(error); return false; }
bool PdfNative::unlock(const std::string&, const std::string&, const std::string&, std::string* error) const { unavailable(error); return false; }
bool PdfNative::compress(const std::string&, const std::string&, int, std::string* error) const { unavailable(error); return false; }

}  // namespace nexus::pdf
