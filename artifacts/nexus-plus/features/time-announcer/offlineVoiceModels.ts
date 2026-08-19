import { getPiperAssets } from './piperConfig';

export type OfflineVoiceModel = {
  id: 'en-US-lessac-medium' | 'hi-IN-priyamvada-medium';
  displayName: string;
  language: 'en-IN' | 'hi-IN';
  modelFileName: string;
  configFileName: string;
  sha256: string;
  sizeBytes: number;
  source: string;
  configSource: string;
};

/**
 * Large Piper ONNX models are intentionally not bundled into the APK.
 * They are downloaded after installation and kept in app-private storage.
 * This keeps the distributable APK independent of the large voice assets.
 */
export function getOfflineVoiceModels(): OfflineVoiceModel[] {
  const assets = getPiperAssets();
  return [
    {
      id: 'en-US-lessac-medium',
      displayName: 'English — Lessac Medium',
      language: 'en-IN',
      modelFileName: 'en_US-lessac-medium.onnx',
      configFileName: 'en_US-lessac-medium.onnx.json',
      sha256: '5efe09e69902187827af646e1a6e9d269dee769f9877d17b16b1b46eeaaf019f',
      sizeBytes: 63201294,
      source: assets.englishModelUrl,
      configSource: assets.englishConfigUrl,
    },
    {
      id: 'hi-IN-priyamvada-medium',
      displayName: 'Hindi — Priyamvada Medium',
      language: 'hi-IN',
      modelFileName: 'hi_IN-priyamvada-medium.onnx',
      configFileName: 'hi_IN-priyamvada-medium.onnx.json',
      sha256: 'aa63bcf2cd493b55a450f280e23cf77f03afc9af7015e6e5acd43b652f166c88',
      sizeBytes: 63516050,
      source: assets.hindiModelUrl,
      configSource: assets.hindiConfigUrl,
    },
  ];
}

export const OFFLINE_VOICE_MODELS = getOfflineVoiceModels();
