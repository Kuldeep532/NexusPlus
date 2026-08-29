#include "nexus_vocal_remover.h"

#include <string>

namespace nexus::audio {

VocalRemover::VocalRemover() = default;
VocalRemover::~VocalRemover() = default;

bool VocalRemover::is_available() const {
  return false;
}

bool VocalRemover::separate_file(const std::string& input_path,
                                 const std::string& output_path,
                                 const Options& options,
                                 ProgressCallback callback,
                                 void* user,
                                 std::string* error) {
  (void)input_path;
  (void)output_path;
  (void)options;
  (void)callback;
  (void)user;
  if (error) {
    *error = "Native vocal-removal engine is not bundled in this Android build.";
  }
  return false;
}

void VocalRemover::cancel() {
  cancelled_.store(true);
}

void VocalRemover::dispose() {
  cancelled_.store(false);
}

}  // namespace nexus::audio
