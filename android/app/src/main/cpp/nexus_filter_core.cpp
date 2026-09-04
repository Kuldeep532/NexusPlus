#include "nexus_filter_core.hpp"
#include "nexus_filter_trie.hpp"

#include <array>
#include <cctype>
#include <fstream>
#include <string>
#include <string_view>

namespace {

// Stage-1 signal storage uses encoded bytes so plaintext signal data is not
// stored in Kotlin, Java, XML, or as ordinary native string literals.
constexpr std::uint8_t kMask = 0xA7;

constexpr std::array<std::uint8_t, 22> kEncoded = {
    static_cast<std::uint8_t>('p' ^ kMask), static_cast<std::uint8_t>('o' ^ kMask),
    static_cast<std::uint8_t>('r' ^ kMask), static_cast<std::uint8_t>('n' ^ kMask),
    static_cast<std::uint8_t>('p' ^ kMask), static_cast<std::uint8_t>('o' ^ kMask),
    static_cast<std::uint8_t>('r' ^ kMask), static_cast<std::uint8_t>('n' ^ kMask),
    static_cast<std::uint8_t>('o' ^ kMask), static_cast<std::uint8_t>('r' ^ kMask),
    static_cast<std::uint8_t>('g' ^ kMask), static_cast<std::uint8_t>('a' ^ kMask),
    static_cast<std::uint8_t>('n' ^ kMask), static_cast<std::uint8_t>('i' ^ kMask),
    static_cast<std::uint8_t>('s' ^ kMask), static_cast<std::uint8_t>('m' ^ kMask),
    static_cast<std::uint8_t>('s' ^ kMask), static_cast<std::uint8_t>('e' ^ kMask),
    static_cast<std::uint8_t>('x' ^ kMask), static_cast<std::uint8_t>('x' ^ kMask),
    static_cast<std::uint8_t>('x' ^ kMask), static_cast<std::uint8_t>('x' ^ kMask),
};

std::string decode_range(const std::size_t offset, const std::size_t length) {
    std::string value;
    value.reserve(length);
    for (std::size_t index = 0; index < length; ++index) {
        value.push_back(static_cast<char>(kEncoded[offset + index] ^ kMask));
    }
    return value;
}

std::string lower_copy(const std::string_view input) {
    std::string result;
    result.reserve(input.size());
    for (const unsigned char character : input) {
        result.push_back(static_cast<char>(std::tolower(character)));
    }
    return result;
}

}  // namespace

namespace nexus::filter {

Decision classify_text(const std::string_view input) noexcept {
    const auto normalized = lower_copy(input);
    TokenTrie trie;
    trie.insert(decode_range(0, 4));
    trie.insert(decode_range(8, 4));
    trie.insert(decode_range(12, 4));
    trie.insert(decode_range(16, 3));
    trie.insert(decode_range(19, 3));

    if (trie.contains_in(normalized)) return {Verdict::kProtected, 100};
    return {Verdict::kAllow, 0};
}

Decision classify_domain(const std::string_view input) noexcept {
    return classify_text(input);
}

bool runtime_integrity_ok() noexcept {
    // Non-destructive debugger signal. If procfs is restricted, fail open so
    // legitimate production devices are not bricked.
    std::ifstream status("/proc/self/status");
    if (!status.good()) return true;

    std::string line;
    while (std::getline(status, line)) {
        if (line.rfind("TracerPid:", 0) != 0) continue;
        const auto separator = line.find_first_of(" \t");
        if (separator == std::string::npos) return true;
        try {
            return std::stoul(line.substr(separator + 1)) == 0U;
        } catch (...) {
            return true;
        }
    }
    return true;
}

}  // namespace nexus::filter
