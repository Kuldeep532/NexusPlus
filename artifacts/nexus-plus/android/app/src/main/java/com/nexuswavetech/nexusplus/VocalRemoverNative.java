package com.nexuswavetech.nexusplus;

/**
 * Minimal JNI surface for the native C++ vocal-removal engine.
 * JS/TS should call this layer only from a development/native Android build.
 */
public final class VocalRemoverNative {
  static {
    System.loadLibrary("nexus_vocal_remover");
  }

  private VocalRemoverNative() {}

  public static native boolean isAvailable();

  /** Returns output path on success or an error message on failure. */
  public static native String separate(
      String inputPath,
      String outputPath,
      String stem,
      String quality,
      boolean preserveBass,
      boolean preserveStereo,
      int chunkSeconds
  );

  public static native void cancel();
  public static native void dispose();
}
