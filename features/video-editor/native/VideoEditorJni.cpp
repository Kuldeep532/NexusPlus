#include "VideoEditorNative.hpp"

#include <jni.h>

#include <string>

namespace {

std::string toString(JNIEnv* env, jstring value) {
    if (!value) return {};
    const char* chars = env->GetStringUTFChars(value, nullptr);
    if (!chars) return {};
    std::string result(chars);
    env->ReleaseStringUTFChars(value, chars);
    return result;
}

jobject makeResult(JNIEnv* env, bool success, const std::string& output, const std::string& error) {
    jclass cls = env->FindClass("com/nexuswavetech/nexusplus/videoeditor/NativeVideoResult");
    if (!cls) return nullptr;
    jmethodID ctor = env->GetMethodID(cls, "<init>", "(ZLjava/lang/String;Ljava/lang/String;)V");
    if (!ctor) return nullptr;
    jstring out = env->NewStringUTF(output.c_str());
    jstring err = env->NewStringUTF(error.c_str());
    jobject result = env->NewObject(cls, ctor, success, out, err);
    env->DeleteLocalRef(out);
    env->DeleteLocalRef(err);
    return result;
}

}  // namespace

extern "C" JNIEXPORT jobject JNICALL
Java_com_nexuswavetech_nexusplus_videoeditor_NativeVideoEditor_execute(
    JNIEnv* env,
    jclass,
    jint operationType,
    jstring input,
    jstring output,
    jlong startUs,
    jlong endUs,
    jdouble value,
    jint rotation,
    jint width,
    jint height,
    jboolean horizontal,
    jboolean vertical) {

    nexus::video_editor::Operation operation;
    operation.type = static_cast<nexus::video_editor::OperationType>(operationType);
    operation.input = toString(env, input);
    operation.output = toString(env, output);
    operation.startUs = startUs;
    operation.endUs = endUs;
    operation.value = value;
    operation.rotation = rotation;
    operation.width = width;
    operation.height = height;
    operation.horizontal = horizontal == JNI_TRUE;
    operation.vertical = vertical == JNI_TRUE;

    const auto result = nexus::video_editor::execute(operation);
    return makeResult(env, result.success, result.output, result.error);
}
