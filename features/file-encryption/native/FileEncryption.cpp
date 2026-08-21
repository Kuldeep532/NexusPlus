#include "FileEncryption.h"

#include <algorithm>
#include <fstream>
#include <random>
#include <sstream>
#include <limits>

namespace nexus::crypto {
namespace {

constexpr char kMagic[] = "NEXUSENC";
constexpr std::uint8_t kVersion = 1;
constexpr std::size_t kSaltBytes = 16;
constexpr std::size_t kIvBytes = 12;
constexpr std::size_t kKeyBytes = 32;
constexpr std::size_t kTagBytes = 16;
constexpr std::uint32_t kCanonicalIterations = 600000;
constexpr std::uint64_t kMaxFileBytes = 256ULL * 1024ULL * 1024ULL;

std::vector<std::uint8_t> readAll(const std::string& path) {
  std::ifstream input(path, std::ios::binary);
  if (!input) throw std::runtime_error("Cannot open input file");
  input.seekg(0, std::ios::end);
  const auto size = input.tellg();
  if (size < 0) throw std::runtime_error("Cannot determine input file size");
  const auto fileSize = static_cast<std::uint64_t>(size);
  if (fileSize > kMaxFileBytes) throw std::runtime_error("File is too large for secure encryption processing");
  input.seekg(0, std::ios::beg);
  std::vector<std::uint8_t> bytes(static_cast<std::size_t>(fileSize));
  if (!bytes.empty()) {
    input.read(reinterpret_cast<char*>(bytes.data()), static_cast<std::streamsize>(bytes.size()));
    if (!input) throw std::runtime_error("Failed reading input file");
  }
  return bytes;
}

void writeAll(const std::string& path, const std::vector<std::uint8_t>& bytes) {
  std::ofstream output(path, std::ios::binary | std::ios::trunc);
  if (!output) throw std::runtime_error("Cannot create output file");
  if (!bytes.empty()) output.write(reinterpret_cast<const char*>(bytes.data()), static_cast<std::streamsize>(bytes.size()));
  output.flush();
  if (!output) throw std::runtime_error("Failed writing encrypted file");
}

void randomBytes(std::vector<std::uint8_t>& bytes) {
  std::random_device rd;
  for (auto& value : bytes) value = static_cast<std::uint8_t>(rd());
}

bool validIterations(std::uint32_t iterations) {
  return iterations == kCanonicalIterations;
}

// Cryptographic primitives are intentionally isolated behind this layer.
bool sealAesGcm(const std::vector<std::uint8_t>& plaintext,
                const std::vector<std::uint8_t>& key,
                const std::vector<std::uint8_t>& iv,
                std::vector<std::uint8_t>& ciphertext,
                std::vector<std::uint8_t>& tag,
                std::string* error);

bool openAesGcm(const std::vector<std::uint8_t>& ciphertext,
                const std::vector<std::uint8_t>& key,
                const std::vector<std::uint8_t>& iv,
                const std::vector<std::uint8_t>& tag,
                std::vector<std::uint8_t>& plaintext,
                std::string* error);

bool deriveKeyPbkdf2(const std::string& password,
                     const std::vector<std::uint8_t>& salt,
                     std::uint32_t iterations,
                     std::vector<std::uint8_t>& key,
                     std::string* error);

}  // namespace

bool FileEncryption::lock(const std::string& inputPath,
                          const std::string& outputPath,
                          const Options& options,
                          std::string* error) const {
  try {
    if (options.password.size() < 8) throw std::runtime_error("Password must contain at least 8 characters");
    if (!validIterations(options.iterations)) throw std::runtime_error("Unsupported encryption KDF parameters");

    auto plaintext = readAll(inputPath);
    std::vector<std::uint8_t> salt(kSaltBytes);
    std::vector<std::uint8_t> iv(kIvBytes);
    randomBytes(salt);
    randomBytes(iv);

    std::vector<std::uint8_t> key;
    if (!deriveKeyPbkdf2(options.password, salt, options.iterations, key, error)) return false;

    std::vector<std::uint8_t> ciphertext;
    std::vector<std::uint8_t> tag;
    if (!sealAesGcm(plaintext, key, iv, ciphertext, tag, error)) return false;

    std::vector<std::uint8_t> container;
    container.reserve(8 + 1 + salt.size() + iv.size() + 4 + tag.size() + ciphertext.size());
    container.insert(container.end(), kMagic, kMagic + 8);
    container.push_back(kVersion);
    container.insert(container.end(), salt.begin(), salt.end());
    container.insert(container.end(), iv.begin(), iv.end());
    const auto add32 = [&](std::uint32_t value) {
      for (int i = 0; i < 4; ++i) container.push_back(static_cast<std::uint8_t>((value >> (24 - i * 8)) & 0xFF));
    };
    add32(options.iterations);
    container.insert(container.end(), tag.begin(), tag.end());
    container.insert(container.end(), ciphertext.begin(), ciphertext.end());
    writeAll(outputPath, container);
    return true;
  } catch (const std::exception& exception) {
    if (error) *error = exception.what();
    return false;
  }
}

bool FileEncryption::unlock(const std::string& inputPath,
                            const std::string& outputPath,
                            const Options& options,
                            std::string* error) const {
  try {
    if (options.password.size() < 8) throw std::runtime_error("Password must contain at least 8 characters");

    const auto container = readAll(inputPath);
    constexpr std::size_t headerBytes = 8 + 1 + kSaltBytes + kIvBytes + 4 + kTagBytes;
    if (container.size() < headerBytes) throw std::runtime_error("Invalid Nexus encrypted file");
    if (!std::equal(container.begin(), container.begin() + 8, kMagic)) throw std::runtime_error("Unsupported encrypted file");
    if (container[8] != kVersion) throw std::runtime_error("Unsupported encryption version");

    std::vector<std::uint8_t> salt(container.begin() + 9, container.begin() + 9 + kSaltBytes);
    std::vector<std::uint8_t> iv(container.begin() + 9 + kSaltBytes, container.begin() + 9 + kSaltBytes + kIvBytes);
    const std::size_t iterationsOffset = 9 + kSaltBytes + kIvBytes;
    std::uint32_t iterations = 0;
    for (std::size_t i = 0; i < 4; ++i) iterations = (iterations << 8) | container[iterationsOffset + i];
    if (!validIterations(iterations)) throw std::runtime_error("Unsupported encryption KDF parameters");

    std::vector<std::uint8_t> tag(container.begin() + iterationsOffset + 4,
                                  container.begin() + iterationsOffset + 4 + kTagBytes);
    std::vector<std::uint8_t> ciphertext(container.begin() + headerBytes, container.end());

    std::vector<std::uint8_t> key;
    if (!deriveKeyPbkdf2(options.password, salt, iterations, key, error)) return false;
    std::vector<std::uint8_t> plaintext;
    if (!openAesGcm(ciphertext, key, iv, tag, plaintext, error)) {
      if (error && error->empty()) *error = "Wrong password or corrupted file";
      return false;
    }
    writeAll(outputPath, plaintext);
    return true;
  } catch (const std::exception& exception) {
    if (error) *error = exception.what();
    return false;
  }
}

}  // namespace nexus::crypto
