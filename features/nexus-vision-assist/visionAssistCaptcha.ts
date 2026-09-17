export type CaptchaAssistResult = {
  detected: boolean;
  text?: string;
  copyable: boolean;
  message: string;
};

/**
 * CAPTCHA accessibility helper. It may read text that an app explicitly
 * exposes as accessibility semantics, but it never solves, bypasses, or
 * fabricates CAPTCHA answers.
 */
export function readCaptchaText(description: string): CaptchaAssistResult {
  const text = description.trim();
  if (!text) return { detected: false, copyable: false, message: 'No readable CAPTCHA text is available.' };
  const detected = /captcha|verification|security code|verification code|security check|कैप्चा|सत्यापन/i.test(text);
  if (!detected) return { detected: false, copyable: false, message: 'No CAPTCHA was identified in the accessible screen content.' };

  const candidates = text
    .split(/\n|\r/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/captcha|verification|security code|verification code|security check|कैप्चा|सत्यापन/i.test(line));
  const likelyCode = candidates.find((line) => /^[A-Za-z0-9][A-Za-z0-9 -]{3,15}$/.test(line) && /\d/.test(line));
  if (!likelyCode) return { detected: true, copyable: false, message: 'A CAPTCHA or verification control was identified, but no accessible code text was exposed.' };
  return { detected: true, text: likelyCode, copyable: true, message: 'Accessible CAPTCHA text found. The user can copy it manually; automatic CAPTCHA solving remains disabled.' };
}
