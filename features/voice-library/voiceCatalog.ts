export type VoiceGender = 'female' | 'male';
export type VoiceQuality = 'high' | 'medium';

export type VoiceCatalogItem = {
  id: string;
  name: string;
  language: string;
  languageName: string;
  gender: VoiceGender;
  quality: VoiceQuality;
  modelUrl: string;
  configUrl: string;
  modelSizeBytes?: number;
  configSizeBytes?: number;
  sha256?: string;
  downloadable: boolean;
  roles?: Array<'live-call' | 'reader' | 'assistant' | 'payment' | 'reminder'>;
  canonicalGroupId?: string;
};

/**
 * Optional edge mirror. Keep empty for direct Hugging Face downloads.
 * Set EXPO_PUBLIC_VOICE_CDN_BASE_URL to the Cloudflare Worker/R2 hostname
 * when a mirror is deployed. The path after the base URL is the voice ID
 * directory, keeping one predictable object layout for model + config.
 */
export const VOICE_CDN_BASE_URL = (process.env.EXPO_PUBLIC_VOICE_CDN_BASE_URL || '').replace(/\/$/, '');

function withVoiceCdn(voiceId: string, filename: string, fallbackUrl: string): string {
  return VOICE_CDN_BASE_URL
    ? `${VOICE_CDN_BASE_URL}/${encodeURIComponent(voiceId)}/${filename}`
    : fallbackUrl;
}

const hf = (path: string) => `https://huggingface.co/rhasspy/piper-voices/resolve/main/${path}?download=true`;
const voice = (
  id: string,
  name: string,
  language: string,
  languageName: string,
  gender: VoiceGender,
  modelPath: string,
  configPath: string,
  roles: VoiceCatalogItem['roles'] = ['reader'],
  modelSizeBytes?: number,
): VoiceCatalogItem => ({
  id,
  name,
  language,
  languageName,
  gender,
  quality: 'high',
  modelUrl: withVoiceCdn(id, `${id}.onnx`, hf(modelPath)),
  configUrl: withVoiceCdn(id, `${id}.onnx.json`, hf(configPath)),
  ...(modelSizeBytes ? { modelSizeBytes } : {}),
  downloadable: true,
  roles,
  canonicalGroupId: id,
});

/**
 * Canonical voice registry. Duplicate IDs are removed below before any
 * downloader or screen consumes this list.
 */
export const VOICE_CATALOG: VoiceCatalogItem[] = [
  voice('en-us-lessac-medium', 'Lessac Medium', 'en-US', 'English (US)', 'female', 'en/en_US/lessac/medium/en_US-lessac-medium.onnx', 'en/en_US/lessac/medium/en_US-lessac-medium.onnx.json', ['assistant', 'payment', 'reminder'], 63201294),
  voice('en-us-ryan-medium', 'Ryan Medium', 'en-US', 'English (US)', 'male', 'en/en_US/ryan/medium/en_US-ryan-medium.onnx', 'en/en_US/ryan/medium/en_US-ryan-medium.onnx.json', ['assistant']),
  voice('en-us-amy-medium', 'Amy Medium', 'en-US', 'English (US)', 'female', 'en/en_US/amy/medium/en_US-amy-medium.onnx', 'en/en_US/amy/medium/en_US-amy-medium.onnx.json', ['live-call']),
  voice('en-in-priyanka-medium', 'Priyanka Medium', 'en-IN', 'English (India)', 'female', 'en/en_IN/priyanka/medium/en_IN-priyanka-medium.onnx', 'en/en_IN/priyanka/medium/en_IN-priyanka-medium.onnx.json', ['reader']),
  voice('en-in-rohan-medium', 'Rohan Medium', 'en-IN', 'English (India)', 'male', 'en/en_IN/rohan/medium/en_IN-rohan-medium.onnx', 'en/en_IN/rohan/medium/en_IN-rohan-medium.onnx.json', ['reader']),
  voice('hi-in-priyamvada-medium', 'Priyamvada Medium', 'hi-IN', 'Hindi', 'female', 'hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx', 'hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx.json', ['reader'], 63516050),
  voice('hi-in-vikas-medium', 'Vikas Medium', 'hi-IN', 'Hindi', 'male', 'hi/hi_IN/vikas/medium/hi_IN-vikas-medium.onnx', 'hi/hi_IN/vikas/medium/hi_IN-vikas-medium.onnx.json', ['live-call']),
  voice('en-gb-alan-medium', 'Alan Medium', 'en-GB', 'English (UK)', 'male', 'en/en_GB/alan/medium/en_GB-alan-medium.onnx', 'en/en_GB/alan/medium/en_GB-alan-medium.onnx.json'),
  voice('en-gb-southern-medium', 'Southern English', 'en-GB', 'English (UK)', 'female', 'en/en_GB/southern_english_female/medium/en_GB-southern_english_female-medium.onnx', 'en/en_GB/southern_english_female/medium/en_GB-southern_english_female-medium.onnx.json'),
  voice('es-es-sharvard-medium', 'Sharvard Medium', 'es-ES', 'Spanish', 'male', 'es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx', 'es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx.json'),
  voice('es-mx-ald-medium', 'Ald Medium', 'es-MX', 'Spanish (Mexico)', 'male', 'es/es_MX/ald/medium/es_MX-ald-medium.onnx', 'es/es_MX/ald/medium/es_MX-ald-medium.onnx.json'),
  voice('fr-fr-siwis-medium', 'Siwis Medium', 'fr-FR', 'French', 'female', 'fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx', 'fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json'),
  voice('de-de-thorsten-medium', 'Thorsten Medium', 'de-DE', 'German', 'male', 'de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx', 'de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx.json'),
  voice('it-it-paola-medium', 'Paola Medium', 'it-IT', 'Italian', 'female', 'it/it_IT/paola/medium/it_IT-paola-medium.onnx', 'it/it_IT/paola/medium/it_IT-paola-medium.onnx.json'),
  voice('pt-br-faber-medium', 'Faber Medium', 'pt-BR', 'Portuguese (Brazil)', 'male', 'pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx', 'pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx.json'),
  voice('nl-nl-rdh-medium', 'RDH Medium', 'nl-NL', 'Dutch', 'male', 'nl/nl_NL/rdh/medium/nl_NL-rdh-medium.onnx', 'nl/nl_NL/rdh/medium/nl_NL-rdh-medium.onnx.json'),
  voice('sv-se-nst-medium', 'NST Medium', 'sv-SE', 'Swedish', 'female', 'sv/sv_SE/nst/medium/sv_SE-nst-medium.onnx', 'sv/sv_SE/nst/medium/sv_SE-nst-medium.onnx.json'),
  voice('da-dk-tales-medium', 'Tales Medium', 'da-DK', 'Danish', 'male', 'da/da_DK/tales/medium/da_DK-tales-medium.onnx', 'da/da_DK/tales/medium/da_DK-tales-medium.onnx.json'),
  voice('no-no-tales-medium', 'Tales Medium', 'no-NO', 'Norwegian', 'male', 'no/no_NO/tales/medium/no_NO-tales-medium.onnx', 'no/no_NO/tales/medium/no_NO-tales-medium.onnx.json'),
  voice('fi-fi-harri-medium', 'Harri Medium', 'fi-FI', 'Finnish', 'male', 'fi/fi_FI/harri/medium/fi_FI-harri-medium.onnx', 'fi/fi_FI/harri/medium/fi_FI-harri-medium.onnx.json'),
  voice('pl-pl-darkman-medium', 'Darkman Medium', 'pl-PL', 'Polish', 'male', 'pl/pl_PL/darkman/medium/pl_PL-darkman-medium.onnx', 'pl/pl_PL/darkman/medium/pl_PL-darkman-medium.onnx.json'),
  voice('cs-cz-jirka-medium', 'Jirka Medium', 'cs-CZ', 'Czech', 'male', 'cs/cs_CZ/jirka/medium/cs_CZ-jirka-medium.onnx', 'cs/cs_CZ/jirka/medium/cs_CZ-jirka-medium.onnx.json'),
  voice('uk-ua-ukrainian-medium', 'Ukrainian Medium', 'uk-UA', 'Ukrainian', 'female', 'uk/uk_UA/ukrainian/medium/uk_UA-ukrainian-medium.onnx', 'uk/uk_UA/ukrainian/medium/uk_UA-ukrainian-medium.onnx.json'),
  voice('ru-ru-irina-medium', 'Irina Medium', 'ru-RU', 'Russian', 'female', 'ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx', 'ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx.json'),
  voice('tr-tr-dfki-medium', 'DFKI Medium', 'tr-TR', 'Turkish', 'female', 'tr/tr_TR/dfki/medium/tr_TR-dfki-medium.onnx', 'tr/tr_TR/dfki/medium/tr_TR-dfki-medium.onnx.json'),
  voice('vi-vn-vivos-medium', 'VIVOS Medium', 'vi-VN', 'Vietnamese', 'female', 'vi/vi_VN/vivos/medium/vi_VN-vivos-medium.onnx', 'vi/vi_VN/vivos/medium/vi_VN-vivos-medium.onnx.json'),
  voice('ko-kr-kss-medium', 'KSS Medium', 'ko-KR', 'Korean', 'female', 'ko/ko_KR/kss/medium/ko_KR-kss-medium.onnx', 'ko/ko_KR/kss/medium/ko_KR-kss-medium.onnx.json'),
  voice('ja-jp-tsukuyomi-medium', 'Tsukuyomi Medium', 'ja-JP', 'Japanese', 'female', 'ja/ja_JP/tsukuyomi/medium/ja_JP-tsukuyomi-medium.onnx', 'ja/ja_JP/tsukuyomi/medium/ja_JP-tsukuyomi-medium.onnx.json'),
];

export const UNIQUE_VOICE_CATALOG = Array.from(new Map(VOICE_CATALOG.map((item) => [item.id, item])).values());
export const VOICE_CATALOG_COUNT = UNIQUE_VOICE_CATALOG.length;
