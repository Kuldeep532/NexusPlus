#include <jni.h>

#include <memory>
#include <mutex>
#include <string>

#include "nexus_vocal_remover.h"

namespace {
std::mutex g_mutex;
std::unique_ptr<nexus::audio::VocalRemover> g_engine;

nexus::audio::Stem parse_stem(const std::string& value) {
  return value == "vocals" ? nexus::audio::Stem::Vocals : nexus::audio::Stem::Instrumental;
}

nexus::audio::Quality parse_quality(const std::string& value) {
  if (value == "preview") return nexus::audio::Quality::Preview;
  if (value == "studio") return nexus::audio::Quality::Studio;
  return nexus::audio::Quality::Balanced;
}

void progress_callback(int stage, float progress, const char* message, void* user) {
  JNIEnv* env = static_cast<JNIEnv*>(user);
  if (!env) return;
  (void)stage;
  (void)progress;
  (void)message;
  // The React Native/Expo wrapper can provide the callback transport. The
  // low-level JNI core remains independent of JS event mechanisms.
}

std::string jstring_to_string(JNIEnv* env, jstring value) {
  if (!value) return {};
  const char* chars = env->GetStringUTFChars(value, nullptr);
  const std::string result = chars ? chars : "";
  if (chars) env->ReleaseStringUTFChars(value, chars);
  return result;
}
}  // namespace

extern "C" JNIEXPORT jboolean JNICALL
Java_com_nexuswavetech_nexusplus_VocalRemoverNative_isAvailable(JNIEnv*, jclass) {
  std::scoped_lock lock(g_mutex);
  if (!g_engine) g_engine = std::make_unique<nexus::audio::VocalRemover>();
  return g_engine->is_available() ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_nexuswavetech_nexusplus_VocalRemoverNative_separate(JNIEnv* env,
                                                              jclass,
                                                              jstring inputPath,
                                                              jstring outputPath,
                                                              jstring stem,
                                                              jstring quality,
                                                              jboolean preserveBass,
                                                              jboolean preserveStereo,
                                                              jint chunkSeconds) {
  std::scoped_lock lock(g_mutex);
  if (!g_engine) g_engine = std::make_unique<nexus::audio::VocalRemover>();

  nexus::audio::Options options;
  options.stem = parse_stem(jstring_to_string(env, stem));
  options.quality = parse_quality(jstring_to_string(env, quality));
  options.preserve_bass = preserveBass == JNI_TRUE;
  options.preserve_stereo = preserveStereo == JNI_TRUE;
  options.chunk_seconds = static_cast<int>(chunkSeconds);

  std::string error;
  const auto ok = g_engine->separate_file(
      jstring_to_string(env, inputPath),
      jstring_to_string(env, outputPath),
      options,
      progress_callback,
      env,
      &error);

  if (!ok) return env->NewStringUTF(error.c_str());
  return env->NewStringUTF(outputPath ? jstring_to_string(env, outputPath).c_str() : "");
}

extern "C" JNIEXPORT void JNICALL
Java_com_nexuswavetech_nexusplus_VocalRemoverNative_cancel(JNIEnv*, jclass) {
  std::scoped_lock lock(g_mutex);
  if (g_engine) g_engine->cancel();
}

extern "C" JNIEXPORT void JNICALL
Java_com_nexuswavetech_nexusplus_VocalRemoverNative_dispose(JNIEnv*, jclass) {
  std::scoped_lock lock(g_mutex);
  if (g_engine) g_engine->dispose();
  g_engine.reset();
}
