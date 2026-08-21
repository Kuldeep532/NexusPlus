#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace nexus::crypto::android {

bool deriveKeyPbkdf2(const std::string& password,
                     const std::vector<std::uint8_t>& salt,
                     std::uint32_t iterations,
                     std::vector<std::uint8_t>& key,
                     std::string* error);

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

}  // namespace nexus::crypto::android
