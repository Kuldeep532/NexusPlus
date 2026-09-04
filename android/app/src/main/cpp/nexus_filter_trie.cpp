#include "nexus_filter_trie.hpp"

#include <algorithm>
#include <cctype>
#include <memory>

namespace nexus::filter {

TokenTrie::TokenTrie() : root_(std::make_unique<Node>()) {}

TokenTrie::~TokenTrie() = default;

void TokenTrie::insert(const std::string_view token) {
    Node* node = root_.get();
    for (const unsigned char raw : token) {
        const auto c = static_cast<unsigned char>(std::tolower(raw));
        if (c >= 128U) return;
        if (!node->child[c]) node->child[c] = std::make_unique<Node>();
        node = node->child[c].get();
    }
    node->terminal = !token.empty();
}

bool TokenTrie::contains(const std::string_view token) const noexcept {
    const Node* node = root_.get();
    for (const unsigned char raw : token) {
        const auto c = static_cast<unsigned char>(std::tolower(raw));
        if (c >= 128U || !node->child[c]) return false;
        node = node->child[c].get();
    }
    return node->terminal;
}

bool TokenTrie::contains_in(const std::string_view text) const noexcept {
    for (std::size_t start = 0; start < text.size(); ++start) {
        const Node* node = root_.get();
        for (std::size_t i = start; i < text.size(); ++i) {
            const auto c = static_cast<unsigned char>(std::tolower(static_cast<unsigned char>(text[i])));
            if (c >= 128U || !node->child[c]) break;
            node = node->child[c].get();
            if (node->terminal) return true;
        }
    }
    return false;
}

}  // namespace nexus::filter
