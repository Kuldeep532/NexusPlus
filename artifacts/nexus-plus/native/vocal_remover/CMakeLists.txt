cmake_minimum_required(VERSION 3.22.1)
project(nexus_vocal_remover LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

add_library(nexus_vocal_remover SHARED
    VocalRemover.cpp
    VocalRemoverJni.cpp
    AudioDecoder.cpp
    AudioSeparator.cpp
    AudioWriter.cpp
)

target_compile_definitions(nexus_vocal_remover PRIVATE
    NEXUS_VOCAL_REMOVER_VERSION=1
    NEXUS_ENABLE_PHASE_SEPARATION=1
)

target_compile_options(nexus_vocal_remover PRIVATE
    -O3
    -ffast-math
    -fvisibility=hidden
)

# The Android build is intentionally based on platform/JNI NDK APIs plus
# dynamically linked media-processing backends supplied by the host build.
# No heavyweight ML model is embedded in this library.
target_link_libraries(nexus_vocal_remover
    android
    log
    dl
)

if (ANDROID)
    target_compile_definitions(nexus_vocal_remover PRIVATE ANDROID=1)
endif()
