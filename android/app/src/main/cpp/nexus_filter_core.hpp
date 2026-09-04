#pragma once

#include <cstdint>
#include <string>
#include <string_view>
#include <vector>

namespace nexus::filter {

enum class Verdict : std::int32_t {
    kAllow = 0,
    kProtected = 1,
    kTamperDetected = 2,
};

struct Decision {
    Verdict verdict;
    std::int32_t score;
};

// Native-only decision surface. Callers should never persist the plaintext
// signal table; the implementation materializes protected tokens transiently.
Decision classify_text(std::string_view input) noexcept;
Decision classify_domain(std::string_view input) noexcept;
bool runtime_integrity_ok() noexcept;

}  // namespace nexus::filter
