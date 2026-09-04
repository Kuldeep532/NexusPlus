#include <jni.h>

#include <string>
#include "nexus_filter_core.hpp"

extern "C" JNIEXPORT jint JNICALL
Java_com_nexuswavetech_nexusplus_NexusNativeSecurityModule_classifyText(
    JNIEnv* env, jclass, jstring text) {
    if (text == nullptr) return static_cast<jint>(nexus::filter::Verdict::kAllow);
    const char* chars = env->GetStringUTFChars(text, nullptr);
    if (chars == nullptr) return static_cast<jint>(nexus::filter::Verdict::kAllow);
    const auto decision = nexus::filter::classify_text(chars);
    env->ReleaseStringUTFChars(text, chars);
    return static_cast<jint>(decision.verdict);
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_nexuswavetech_nexusplus_NexusNativeSecurityModule_runtimeIntegrityOk(
    JNIEnv*, jclass) {
    return nexus::filter::runtime_integrity_ok() ? JNI_TRUE : JNI_FALSE;
}
