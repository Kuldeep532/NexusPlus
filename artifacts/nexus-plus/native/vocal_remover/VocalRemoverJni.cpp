#include "VocalRemover.h"

#include <jni.h>
#include <mutex>
#include <string>

namespace {
std::mutex gMutex;
nexus::vocal::VocalRemover* gEngine = nullptr;

nexus::vocal::Options parseOptions(jint quality, jboolean preserveBass, jboolean preserveStereo) {
  nexus::vocal::Options options;
  if (quality <= 0) {
    options.quality = nexus::vocal::Options::Quality::Fast;
  } else if (quality == 1) {
    options.quality = nexus::vocal::Options::Quality::Balanced;
  } else {
    options.quality = nexus::vocal::Options::Quality::High;
  }
  options.outputStem = nexus::vocal::Options::Stem::Instrumental;
  options.preserveBass = preserveBass == JNI_TRUE;
  options.preserveStereo = preserveStereo == JNI_TRUE;
  return options;
}

jstring makeString(JNIEnv* env, const std::string& value) {
  return env->NewStringUTF(value.c_str());
}
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_nexuswavetech_nexusplus_vocal_VocalRemoverNative_nativeIsAvailable(
    JNIEnv*, jclass) {
  return JNI_TRUE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_nexuswavetech_nexusplus_vocal_VocalRemoverNative_nativeSeparate(
    JNIEnv* env,
    jclass,
    jstring inputPath,
    jstring outputPath,
    jint quality,
    jboolean preserveBass,
    jboolean preserveStereo) {
  if (!inputPath || !outputPath) return nullptr;

  const char* inputChars = env->GetStringUTFChars(inputPath, nullptr);
  const char* outputChars = env->GetStringUTFChars(outputPath, nullptr);
  if (!inputChars || !outputChars) {
    if (inputChars) env->ReleaseStringUTFChars(inputPath, inputChars);
    if (outputChars) env->ReleaseStringUTFChars(outputPath, outputChars);
    return nullptr;
  }

  const std::string inputPathCopy(inputChars);
  const std::string outputPathCopy(outputChars);
  env->ReleaseStringUTFChars(inputPath, inputChars);
  env->ReleaseStringUTFChars(outputPath, outputChars);

  std::lock_guard<std::mutex> lock(gMutex);
  delete gEngine;
  gEngine = new nexus::vocal::VocalRemover();

  std::string error;
  const auto options = parseOptions(quality, preserveBass, preserveStereo);
  const bool ok = gEngine->separate(inputPathCopy, outputPathCopy, options, nullptr, &error);
  if (!ok) return makeString(env, std::string("ERROR:") + error);
  return makeString(env, outputPathCopy);
}

extern "C" JNIEXPORT void JNICALL
Java_com_nexuswavetech_nexusplus_vocal_VocalRemoverNative_nativeCancel(
    JNIEnv*, jclass) {
  std::lock_guard<std::mutex> lock(gMutex);
  if (gEngine) gEngine->cancel();
}

extern "C" JNIEXPORT void JNICALL
Java_com_nexuswavetech_nexusplus_vocal_VocalRemoverNative_nativeDispose(
    JNIEnv*, jclass) {
  std::lock_guard<std::mutex> lock(gMutex);
  delete gEngine;
  gEngine = nullptr;
}
