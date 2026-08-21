#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace nexus::video_editor {

enum class OperationType : std::int32_t {
    Trim = 0,
    Split = 1,
    Merge = 2,
    SilenceRemoval = 3,
    Speed = 4,
    Crop = 5,
    Rotate = 6,
    Flip = 7,
    ExtractAudio = 8,
    Reverse = 9,
    FreezeFrame = 10,
    Volume = 11,
    AudioDenoise = 12,
    NormalizeLoudness = 13,
};

struct Operation {
    OperationType type{OperationType::Trim};
    std::string input;
    std::string output;
    std::int64_t startUs{0};
    std::int64_t endUs{0};
    double value{0.0};
    std::int32_t rotation{0};
    std::int32_t width{0};
    std::int32_t height{0};
    bool horizontal{false};
    bool vertical{false};
};

struct Result {
    bool success{false};
    std::string output;
    std::string error;
};

Result execute(const Operation& operation);

}  // namespace nexus::video_editor
