#include "FileEncryption.h"
#include <jni.h>
#include <string>

namespace {
std::string jstringToString(JNIEnv* env, jstring value) {
  if (!value) return {};
  const char* chars = env->GetStringUTFChars(value, nullptr);
  if (!chars) return {};
  std::string result(chars);
  env->ReleaseStringUTFChars(value, chars);
  return result;
}
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_nexuswavetech_nexusplus_encryption_FileEncryptionNative_nativeIsAvailable(JNIEnv*, jclass) {
  return JNI_TRUE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_nexuswavetech_nexusplus_encryption_FileEncryptionNative_nativeLockFile(
    JNIEnv* env, jclass, jstring input, jstring output, jstring password) {
  const auto inputPath = jstringToString(env, input);
  const auto outputPath = jstringToString(env, output);
  const auto secret = jstringToString(env, password);
  if (inputPath.empty() || outputPath.empty() || secret.empty()) return nullptr;

  nexus::crypto::FileEncryption engine;
  nexus::crypto::Options options;
  options.password = secret;
  std::string error;
  if (!engine.lock(inputPath, outputPath, options, &error)) {
    return env->NewStringUTF((std::string("ERROR:") + error).c_str());
  }
  return env->NewStringUTF(outputPath.c_str());
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_nexuswavetech_nexusplus_encryption_FileEncryptionNative_nativeUnlockFile(
    JNIEnv* env, jclass, jstring input, jstring output, jstring password) {
  const auto inputPath = jstringToString(env, input);
  const auto outputPath = jstringToString(env, output);
  const auto secret = jstringToString(env, password);
  if (inputPath.empty() || outputPath.empty() || secret.empty()) return nullptr;

  nexus::crypto::FileEncryption engine;
  nexus::crypto::Options options;
  options.password = secret;
  std::string error;
  if (!engine.unlock(inputPath, outputPath, options, &error)) {
    return env->NewStringUTF((std::string("ERROR:") + error).c_str());
  }
  return env->NewStringUTF(outputPath.c_str());
}
