#include "nexus_filter_core.hpp"

#include <algorithm>
#include <array>
#include <cstring>
#include <fstream>
#include <limits>
#include <string>

namespace {

// Encoded with a per-build compile-time mask. Plaintext is materialized only
// during comparison and is never placed in Kotlin/Java/XML resources.
constexpr std::uint8_t kMask = 0xA7;

constexpr std::array<std::uint8_t, 14> kSignals = {
    static_cast<std::uint8_t>('p' ^ kMask), static_cast<std::uint8_t>('o' ^ kMask),
    static_cast<std::uint8_t>('r' ^ kMask), static_cast<std::uint8_t>('n' ^ kMask),
    static_cast<std::uint8_t>('x' ^ kMask), static_cast<std::uint8_t>('x' ^ kMask),
    static_cast<std::uint8_t>('x' ^ kMask), static_cast<std::uint8_t>('n' ^ kMask),
    static_cast<std::uint8_t>('s' ^ kMask), static_cast<std::uint8_t>('f' ^ kMask),
    static_cast<std::uint8_t>('w' ^ kMask), static_cast<std::uint8_t>('r' ^ kMask),
    static_cast<std::uint8_t>('e' ^ kMask), static_cast<std::uint8_t>('e' ^ kMask),
};

std::string decode_signal(const std::size_t offset, const std::size_t length) noexcept {
    std::string value;
    value.reserve(length);
    for (std::size_t i = 0; i < length; ++i) {
        const auto index = offset + i;
        if (index >= kSignals.size()) return {};
        value.push_back(static_cast<char>(kSignals[index] ^ kMask));
    }
    return value;
}

std::string lower_copy(std::string_view value) {
    std::string out;
    out.reserve(value.size());
    for (const unsigned char c : value) {
        out.push_back(static_cast<char>(std::tolower(c)));
    }
    return out;
}

bool contains_token(std::string_view input, std::string_view token) {
    return input.find(token) != std::string_view::npos;
}

}  // namespace

namespace nexus::filter {

Decision classify_text(const std::string_view input) noexcept {
    const auto normalized = lower_copy(input);
    // The signal table is intentionally tiny in Stage 1. More sophisticated
    // contextual classification belongs to the later permission-gated layer.
    if (contains_token(normalized, decode_signal(0, 4))) {
        return {Verdict::kProtected, 100};
    }
    if (contains_token(normalized, decode_signal(4, 3)) ||
        contains_token(normalized, decode_signal(7, 4))) {
        return {Verdict::kProtected, 90};
    }
    return {Verdict::kAllow, 0};
}

Decision classify_domain(const std::string_view input) noexcept {
    return classify_text(input);
}

bool runtime_integrity_ok() noexcept {
    // Stage 1 performs conservative, non-destructive checks only. A missing
    // /proc/self/status field or restricted procfs must not brick the app.
    std::ifstream status("/proc/self/status");
    if (!status.good()) return true;

    std::string line;
    while (std::getline(status, line)) {
        if (line.rfind("TracerPid:", 0) == 0) {
            const auto separator = line.find('\t');
            if (separator != std::string::npos) {
                try {
                    const auto tracer = std::stoul(line.substr(separator + 1));
                    if (tracer != 0U) return false;
                } catch (...) {
                    return true;
                }
            }
        }
    }
    return true;
}

}  // namespace nexus::filter
