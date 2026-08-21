export type PiperAssetConfig = {
  englishModelUrl: string;
  englishConfigUrl: string;
  hindiModelUrl: string;
  hindiConfigUrl: string;
};

const HF_BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0';

export const DEFAULT_PIPER_ASSETS: PiperAssetConfig = {
  englishModelUrl: `${HF_BASE}/en/en_US/lessac/medium/en_US-lessac-medium.onnx?download=true`,
  englishConfigUrl: `${HF_BASE}/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json?download=true`,
  hindiModelUrl: `${HF_BASE}/hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx?download=true`,
  hindiConfigUrl: `${HF_BASE}/hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx.json?download=true`,
};

/**
 * Optional private/self-hosted override. Do not put GitHub PATs or other
 * long-lived secrets in this file or in the APK. A public URL, expiring
 * signed URL, or authenticated proxy can be supplied at build/runtime.
 */
export function getPiperAssets(): PiperAssetConfig {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  return {
    englishModelUrl: env?.EXPO_PUBLIC_PIPER_EN_MODEL_URL || DEFAULT_PIPER_ASSETS.englishModelUrl,
    englishConfigUrl: env?.EXPO_PUBLIC_PIPER_EN_CONFIG_URL || DEFAULT_PIPER_ASSETS.englishConfigUrl,
    hindiModelUrl: env?.EXPO_PUBLIC_PIPER_HI_MODEL_URL || DEFAULT_PIPER_ASSETS.hindiModelUrl,
    hindiConfigUrl: env?.EXPO_PUBLIC_PIPER_HI_CONFIG_URL || DEFAULT_PIPER_ASSETS.hindiConfigUrl,
  };
}
