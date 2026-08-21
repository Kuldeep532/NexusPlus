cmake_minimum_required(VERSION 3.22.1)
project(nexusplus_native LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

add_library(nexusplus_native SHARED
  vocal_remover/VocalRemover.cpp
  vocal_remover/WavIO.cpp
  vocal_remover/VocalRemoverJni.cpp
  file_encryption/FileEncryption.cpp
  file_encryption/FileEncryptionCrypto.cpp
  file_encryption/FileEncryptionJni.cpp
)

target_include_directories(nexusplus_native PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}/vocal_remover
  ${CMAKE_CURRENT_SOURCE_DIR}/file_encryption
)

find_library(log-lib log)
find_library(android-lib android)

find_package(OpenSSL QUIET)
if (OpenSSL_FOUND)
  target_link_libraries(nexusplus_native PRIVATE OpenSSL::Crypto)
  target_compile_definitions(nexusplus_native PRIVATE NEXUS_HAS_OPENSSL=1)
else()
  message(FATAL_ERROR "OpenSSL crypto provider is required for File Encryption native build")
endif()

target_link_libraries(nexusplus_native PRIVATE ${log-lib} ${android-lib})

# Third-party media/audio backends are optional and must be added as pinned
# native dependencies in the Android build. The core library intentionally
# does not embed large model files so APK size remains controlled.
