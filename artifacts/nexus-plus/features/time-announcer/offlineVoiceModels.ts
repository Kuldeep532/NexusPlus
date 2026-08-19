export type OfflineVoiceModel = {
  id: 'en-US-lessac-medium' | 'hi-IN-priyamvada-medium';
  displayName: string;
  language: 'en-IN' | 'hi-IN';
  modelFileName: string;
  configFileName: string;
  sha256: string;
  sizeBytes: number;
  source: string;
};

/**
 * Large Piper ONNX models are intentionally not bundled into the APK.
 * They are first-run downloads stored in the app document directory.
 * This keeps the downloadable APK under the requested 70 MB ceiling while
 * retaining the models locally after installation.
 */
export const OFFLINE_VOICE_MODELS: OfflineVoiceModel[] = [
  {
    id: 'en-US-lessac-medium',
    displayName: 'English — Lessac Medium',
    language: 'en-IN',
    modelFileName: 'en_US-lessac-medium.onnx',
    configFileName: 'en_US-lessac-medium.onnx.json',
    sha256: '5efe09e69902187827af646e1a6e9d269dee769f9877d17b16b1b46eeaaf019f',
    sizeBytes: 63201294,
    source: 'https://github.com/Kuldeep532/NexusPlus/releases/download/tts-models-v1/en_US-lessac-medium.onnx',
  },
  {
    id: 'hi-IN-priyamvada-medium',
    displayName: 'Hindi — Priyamvada Medium',
    language: 'hi-IN',
    modelFileName: 'hi_IN-priyamvada-medium.onnx',
    configFileName: 'hi_IN-priyamvada-medium.onnx.json',
    sha256: 'aa63bcf2cd493b55a450f280e23cf77f03afc9af7016e5acd43b652f166c88',
    sizeBytes: 63516050,
    source: 'https://github.com/Kuldeep532/NexusPlus/releases/download/tts-models-v1/hi_IN-priyamvada-medium.onnx',
  },
];
