#include "nexus_filter_trie.hpp"
#include <algorithm>
#include <cctype>
namespace nexus::filter {
TokenTrie::TokenTrie() : root_(std::make_unique<Node>()) {}
TokenTrie::~TokenTrie() = default;
void TokenTrie::insert(std::string_view token) {
    Node* node = root_.get();
    for (unsigned char c : token) {
        if (c >= 128) continue;
        if (!node->child[c]) node->child[c] = std::make_unique<Node>();
        node = node->child[c].get();
    }
    node->terminal = true;
}
bool TokenTrie::contains(std::string_view token) const noexcept {
    const Node* node = root_.get();
    for (unsigned char c : token) {
        if (c >= 128 || !node->child[c]) return false;
        node = node->child[c].get();
    }
    return node->terminal;
}
bool TokenTrie::contains_in(std::string_view text) const noexcept {
    for (std::size_t start = 0; start < text.size(); ++start) {
        const Node* node = root_.get();
        for (std::size_t i = start; i < text.size(); ++i) {
            const unsigned char c = text[i];
            if (c >= 128 || !node->child[c]) break;
            node = node->child[c].get();
            if (node->terminal) return true;
        }
    }
    return false;
}
}
