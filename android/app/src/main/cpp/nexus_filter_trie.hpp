#pragma once
#include <array>
#include <cstddef>
#include <memory>
#include <string_view>
namespace nexus::filter {
class TokenTrie {
public:
    TokenTrie();
    ~TokenTrie();
    TokenTrie(const TokenTrie&) = delete;
    TokenTrie& operator=(const TokenTrie&) = delete;
    void insert(std::string_view token);
    bool contains(std::string_view token) const noexcept;
    bool contains_in(std::string_view text) const noexcept;
private:
    struct Node { std::array<std::unique_ptr<Node>, 128> child{}; bool terminal=false; };
    std::unique_ptr<Node> root_;
};
}
