#include "nexus_filter_core.hpp"
#include "nexus_filter_trie.hpp"
#include <array>
#include <cctype>
#include <fstream>
#include <string>
#include <string_view>

namespace {
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

std::string decode(std::size_t offset, std::size_t length) {
    std::string out;
    out.reserve(length);
    for (std::size_t i = 0; i < length; ++i) {
        out.push_back(static_cast<char>(kEncoded[offset + i] ^ kMask));
    }
    return out;
}

std::string lower(std::string_view in) {
    std::string out;
    out.reserve(in.size());
    for (unsigned char c : in) out.push_back(static_cast<char>(std::tolower(c)));
    return out;
}

bool isDomainBoundaryPrefix(std::string_view host, std::string_view domain) {
    if (host == domain) return true;
    return host.size() > domain.size() &&
           host.compare(host.size() - domain.size(), domain.size(), domain) == 0 &&
           host[host.size() - domain.size() - 1] == '.';
}
} // namespace

namespace nexus::filter {
Decision classify_text(std::string_view input) noexcept {
    auto normalized = lower(input);
    TokenTrie trie;
    trie.insert(decode(0, 4));
    trie.insert(decode(8, 4));
    trie.insert(decode(12, 4));
    trie.insert(decode(16, 3));
    trie.insert(decode(19, 3));
    return trie.contains_in(normalized)
        ? Decision{Verdict::kProtected, 100}
        : Decision{Verdict::kAllow, 0};
}

Decision classify_domain(std::string_view input) noexcept {
    auto normalized = lower(input);
    if (normalized.empty()) return Decision{Verdict::kAllow, 0};
    TokenTrie trie;
    trie.insert(decode(0, 4));
    trie.insert(decode(8, 4));
    trie.insert(decode(12, 4));
    trie.insert(decode(16, 3));
    trie.insert(decode(19, 3));
    if (trie.contains_in(normalized)) return Decision{Verdict::kProtected, 100};
    return Decision{Verdict::kAllow, 0};
}

bool runtime_integrity_ok() noexcept {
    std::ifstream status("/proc/self/status");
    if (!status.good()) return true;
    std::string line;
    while (std::getline(status, line)) {
        if (line.rfind("TracerPid:", 0) != 0) continue;
        auto sep = line.find_first_of(" \t");
        if (sep == std::string::npos) return true;
        try {
            return std::stoul(line.substr(sep + 1)) == 0U;
        } catch (...) {
            return true;
        }
    }
    return true;
}
} // namespace nexus::filter
