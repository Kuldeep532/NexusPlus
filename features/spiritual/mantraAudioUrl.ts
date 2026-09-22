const FALLBACK='';
/**
 * Cloudflare endpoint. Set this to the Cloudflare Worker/R2 public hostname used
 * by the production deployment. The device requests the asset URL; the app does
 * not ship the audio binaries.
 */
export const MANTRA_AUDIO_CDN_BASE_URL =
  process.env.EXPO_PUBLIC_MANTRA_AUDIO_CDN_URL || FALLBACK;
export function resolveMantraAudioUrl(path:string,fallback:string):string{
  return MANTRA_AUDIO_CDN_BASE_URL ? MANTRA_AUDIO_CDN_BASE_URL.replace(/\/$/,'')+'/'+path.replace(/^\//,'') : fallback;
}