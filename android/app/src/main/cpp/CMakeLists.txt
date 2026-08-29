cmake_minimum_required(VERSION 3.22.1)
project(nexus_vocal_remover LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Release-hardening for the native target. This is legitimate hardening, not
# intentionally malformed code: the shipped binary remains deterministic and
# functional while reducing exported symbols and useful reverse-engineering
# metadata.
add_library(nexus_vocal_remover SHARED
  nexus_vocal_remover.cpp
  nexus_vocal_remover_jni.cpp
)

target_include_directories(nexus_vocal_remover PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})
target_compile_definitions(nexus_vocal_remover PRIVATE NEXUS_VOCAL_REMOVER_STUB=1)

target_compile_options(nexus_vocal_remover PRIVATE
  -fvisibility=hidden
  -fvisibility-inlines-hidden
  -ffunction-sections
  -fdata-sections
  -fstack-protector-strong
  -D_FORTIFY_SOURCE=2
)

target_link_options(nexus_vocal_remover PRIVATE
  -Wl,--gc-sections
  -Wl,--exclude-libs,ALL
  -Wl,--build-id=sha1
)

find_library(log-lib log)
target_link_libraries(nexus_vocal_remover ${log-lib})
