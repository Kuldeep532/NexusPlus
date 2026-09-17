#include <jni.h>
#include <string>
#include <stdexcept>
#include <fstream>

namespace {

bool hasExtension(const std::string& path, const std::string& ext) {
    if (path.size() < ext.size()) return false;
    return path.compare(path.size() - ext.size(), ext.size(), ext) == 0;
}

// The LibreOfficeKit Android core must expose a JNI-safe conversion entry point.
// This shim intentionally fails closed until that entry point is linked into the
// engine artifact. It prevents the app from ever claiming a fake conversion.
void convertDocument(JNIEnv* env, jstring inputPath, jstring outputPath,
                     jstring inputExtension, jstring outputExtension) {
    (void)inputExtension;
    (void)outputExtension;
    const char* inChars = env->GetStringUTFChars(inputPath, nullptr);
    const char* outChars = env->GetStringUTFChars(outputPath, nullptr);
    const std::string input(inChars ? inChars : "");
    const std::string output(outChars ? outChars : "");
    if (inChars) env->ReleaseStringUTFChars(inputPath, inChars);
    if (outChars) env->ReleaseStringUTFChars(outputPath, outChars);

    if (input.empty() || output.empty()) {
        throw std::runtime_error("LibreOfficeKit conversion paths are empty.");
    }
    if (!hasExtension(output, ".pdf") && !hasExtension(output, ".docx")) {
        throw std::runtime_error("Unsupported output document format.");
    }
    throw std::runtime_error(
        "LibreOfficeKit conversion symbol is not linked into the bundled engine artifact.");
}

} // namespace

extern "C" JNIEXPORT void JNICALL
Java_com_nexuswavetech_nexusplus_LibreOfficeEngine_nativeConvert(
        JNIEnv* env, jclass, jstring inputPath, jstring outputPath,
        jstring inputExtension, jstring outputExtension) {
    try {
        convertDocument(env, inputPath, outputPath, inputExtension, outputExtension);
    } catch (const std::exception& error) {
        jclass exceptionClass = env->FindClass("java/io/IOException");
        if (exceptionClass) env->ThrowNew(exceptionClass, error.what());
    }
}
