cmake_minimum_required(VERSION 3.22.1)
project(nexus_vocal_remover LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# The checked-in Android bridge currently provides the JNI/native boundary,
# but the heavyweight vocal-removal engine is not part of the Android source
# tree. Keep the native target buildable without referencing a missing source.
add_library(nexus_vocal_remover SHARED
  nexus_vocal_remover_jni.cpp
)

target_include_directories(nexus_vocal_remover PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

target_compile_definitions(nexus_vocal_remover PRIVATE NEXUS_VOCAL_REMOVER_STUB=1)

find_library(log-lib log)
target_link_libraries(nexus_vocal_remover ${log-lib})
