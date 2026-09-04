cmake_minimum_required(VERSION 3.22.1)
project(nexus_vocal_remover LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

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

add_library(nexus_security SHARED
  nexus_filter_core.cpp
  nexus_filter_core_jni.cpp
  nexus_filter_trie.cpp
)

target_include_directories(nexus_security PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})
target_compile_options(nexus_security PRIVATE
  -fvisibility=hidden
  -fvisibility-inlines-hidden
  -ffunction-sections
  -fdata-sections
  -fstack-protector-strong
  -D_FORTIFY_SOURCE=2
)
target_link_options(nexus_security PRIVATE
  -Wl,--gc-sections
  -Wl,--exclude-libs,ALL
  -Wl,--build-id=sha1
)

find_library(log-lib log)
target_link_libraries(nexus_vocal_remover ${log-lib})
target_link_libraries(nexus_security ${log-lib})
