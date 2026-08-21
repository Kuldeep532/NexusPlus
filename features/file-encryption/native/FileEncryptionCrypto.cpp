#include "FileEncryption.h"

#include <openssl/evp.h>
#include <openssl/kdf.h>
#include <openssl/rand.h>
#include <cstring>

namespace nexus::crypto {
namespace {

bool deriveKeyPbkdf2(const std::string& password,
                     const std::vector<std::uint8_t>& salt,
                     std::uint32_t iterations,
                     std::vector<std::uint8_t>& key,
                     std::string* error) {
  key.resize(32);
  if (PKCS5_PBKDF2_HMAC(password.data(), static_cast<int>(password.size()), salt.data(), static_cast<int>(salt.size()), static_cast<int>(iterations), EVP_sha256(), static_cast<int>(key.size()), key.data()) != 1) {
    if (error) *error = "PBKDF2 key derivation failed";
    return false;
  }
  return true;
}

bool sealAesGcm(const std::vector<std::uint8_t>& plaintext,
                const std::vector<std::uint8_t>& key,
                const std::vector<std::uint8_t>& iv,
                std::vector<std::uint8_t>& ciphertext,
                std::vector<std::uint8_t>& tag,
                std::string* error) {
  EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
  if (!ctx) { if (error) *error = "EVP context allocation failed"; return false; }
  ciphertext.resize(plaintext.size());
  tag.resize(16);
  int written = 0;
  bool ok = EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, nullptr, nullptr) == 1 &&
            EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, static_cast<int>(iv.size()), nullptr) == 1 &&
            EVP_EncryptInit_ex(ctx, nullptr, nullptr, key.data(), iv.data()) == 1 &&
            EVP_EncryptUpdate(ctx, ciphertext.data(), &written, plaintext.data(), static_cast<int>(plaintext.size())) == 1 &&
            EVP_EncryptFinal_ex(ctx, ciphertext.data() + written, &written) == 1 &&
            EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, static_cast<int>(tag.size()), tag.data()) == 1;
  EVP_CIPHER_CTX_free(ctx);
  if (!ok) {
    if (error) *error = "AES-256-GCM encryption failed";
    ciphertext.clear();
    tag.clear();
  }
  return ok;
}

bool openAesGcm(const std::vector<std::uint8_t>& ciphertext,
                const std::vector<std::uint8_t>& key,
                const std::vector<std::uint8_t>& iv,
                const std::vector<std::uint8_t>& tag,
                std::vector<std::uint8_t>& plaintext,
                std::string* error) {
  EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
  if (!ctx) { if (error) *error = "EVP context allocation failed"; return false; }
  plaintext.resize(ciphertext.size());
  int written = 0;
  bool ok = EVP_DecryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, nullptr, nullptr) == 1 &&
            EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, static_cast<int>(iv.size()), nullptr) == 1 &&
            EVP_DecryptInit_ex(ctx, nullptr, nullptr, key.data(), iv.data()) == 1 &&
            EVP_DecryptUpdate(ctx, plaintext.data(), &written, ciphertext.data(), static_cast<int>(ciphertext.size())) == 1 &&
            EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, static_cast<int>(tag.size()), const_cast<std::uint8_t*>(tag.data())) == 1 &&
            EVP_DecryptFinal_ex(ctx, plaintext.data() + written, &written) == 1;
  EVP_CIPHER_CTX_free(ctx);
  if (!ok) {
    if (error) *error = "Wrong password or authentication failed";
    plaintext.clear();
  }
  return ok;
}

}  // namespace
}  // namespace nexus::crypto
