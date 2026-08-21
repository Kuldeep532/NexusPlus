cmake_minimum_required(VERSION 3.22.1)
project(nexus_video_editor LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(nexus_video_editor SHARED
    VideoEditorNative.cpp
    VideoEditorJni.cpp
)

target_compile_options(nexus_video_editor PRIVATE
    -Wall -Wextra -Wpedantic -Wconversion -Wshadow
)

target_link_libraries(nexus_video_editor
    android
    log
)

# FFmpeg is supplied by the Android native dependency package configured
# by the app build. The JNI layer resolves ffmpeg executable/library paths
# from the application-controlled native runtime.
