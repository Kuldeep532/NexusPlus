#include "VideoEditorNative.hpp"

#include <cstdlib>
#include <filesystem>
#include <sstream>

namespace nexus::video_editor {

namespace {

std::string quote(const std::string& value) {
    std::string result = "'";
    for (char c : value) {
        if (c == '\'') result += "'\\''";
        else result += c;
    }
    result += "'";
    return result;
}

std::string makeScaleFilter(const Operation& op) {
    std::ostringstream filter;
    bool first = true;
    auto append = [&](const std::string& item) {
        if (!first) filter << ',';
        filter << item;
        first = false;
    };
    if (op.width > 0 && op.height > 0) {
        append("scale=" + std::to_string(op.width) + ":" + std::to_string(op.height));
    }
    if (op.horizontal) append("hflip");
    if (op.vertical) append("vflip");
    switch (op.rotation) {
        case 90: append("transpose=1"); break;
        case 180: append("hflip,vflip"); break;
        case 270: append("transpose=2"); break;
        default: break;
    }
    return filter.str();
}

Result run(const std::string& command, const std::string& output) {
    const int status = std::system(command.c_str());
    if (status != 0) {
        return {false, output, "FFmpeg operation failed"};
    }
    return {true, output, {}};
}

}  // namespace

Result execute(const Operation& operation) {
    if (operation.input.empty() || operation.output.empty()) {
        return {false, {}, "Input and output paths are required"};
    }

    const auto in = quote(operation.input);
    const auto out = quote(operation.output);
    const auto overwrite = " -y ";

    switch (operation.type) {
        case OperationType::Trim: {
            std::ostringstream cmd;
            cmd << "ffmpeg" << overwrite << "-ss " << (operation.startUs / 1'000'000.0)
                << " -to " << (operation.endUs / 1'000'000.0)
                << " -i " << in << " -map 0 -c copy " << out;
            return run(cmd.str(), operation.output);
        }
        case OperationType::Speed: {
            const double speed = operation.value > 0.05 ? operation.value : 1.0;
            std::ostringstream cmd;
            cmd << "ffmpeg" << overwrite << "-i " << in
                << " -filter_complex \"[0:v]setpts=" << (1.0 / speed)
                << "*PTS[v];[0:a]atempo=" << std::min(speed, 2.0) << "[a]\""
                << " -map \"[v]\" -map \"[a]\" -c:v libx264 -c:a aac " << out;
            return run(cmd.str(), operation.output);
        }
        case OperationType::Crop:
        case OperationType::Rotate:
        case OperationType::Flip: {
            const std::string filter = makeScaleFilter(operation);
            if (filter.empty()) return {false, {}, "No video transform requested"};
            std::ostringstream cmd;
            cmd << "ffmpeg" << overwrite << "-i " << in
                << " -vf " << quote(filter) << " -c:v libx264 -c:a copy " << out;
            return run(cmd.str(), operation.output);
        }
        case OperationType::ExtractAudio: {
            std::ostringstream cmd;
            cmd << "ffmpeg" << overwrite << "-i " << in
                << " -vn -c:a aac " << out;
            return run(cmd.str(), operation.output);
        }
        case OperationType::Reverse: {
            std::ostringstream cmd;
            cmd << "ffmpeg" << overwrite << "-i " << in
                << " -vf reverse -af areverse -c:v libx264 -c:a aac " << out;
            return run(cmd.str(), operation.output);
        }
        case OperationType::FreezeFrame: {
            const double duration = operation.value > 0.0 ? operation.value : 2.0;
            std::ostringstream cmd;
            cmd << "ffmpeg" << overwrite << "-sseof -1 -i " << in
                << " -vf tpad=stop_mode=clone:stop_duration=" << duration
                << " -c:v libx264 -c:a copy " << out;
            return run(cmd.str(), operation.output);
        }
        case OperationType::Volume:
        case OperationType::AudioDenoise:
        case OperationType::NormalizeLoudness: {
            std::string af;
            if (operation.type == OperationType::Volume) {
                const double gain = operation.value;
                af = "volume=" + std::to_string(gain);
            } else if (operation.type == OperationType::AudioDenoise) {
                af = "afftdn";
            } else {
                af = "loudnorm=I=-16:TP=-1.5:LRA=11";
            }
            std::ostringstream cmd;
            cmd << "ffmpeg" << overwrite << "-i " << in
                << " -af " << quote(af) << " -c:v copy -c:a aac " << out;
            return run(cmd.str(), operation.output);
        }
        default:
            return {false, {}, "Operation requires a timeline/native implementation"};
    }
}

}  // namespace nexus::video_editor
