cmake_minimum_required(VERSION 3.22.1)
project(nexus_vocal_remover LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Keep both the native implementation and JNI bridge in the release target.
# The implementation is currently a safe stub until the heavyweight engine is bundled.
add_library(nexus_vocal_remover SHARED
  nexus_vocal_remover.cpp
  nexus_vocal_remover_jni.cpp
)

target_include_directories(nexus_vocal_remover PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

target_compile_definitions(nexus_vocal_remover PRIVATE NEXUS_VOCAL_REMOVER_STUB=1)

find_library(log-lib log)
target_link_libraries(nexus_vocal_remover ${log-lib})
