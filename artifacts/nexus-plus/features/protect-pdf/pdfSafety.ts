import * as FileSystem from 'expo-file-system/legacy';

export interface PdfSafetyAssessment {
  isSigned: boolean;
  isSensitive: boolean;
  reasons: Array<'digital-signature' | 'embedded-signature' | 'sensitive-name'>;
}

const SENSITIVE_NAME_PATTERNS = [
  /aadhaar/i,
  /aadhar/i,
  /passport/i,
  /pan(?:\s|-)?card/i,
  /driving(?:\s|-)?licen[cs]e/i,
  /voter/i,
  /bank/i,
  /statement/i,
  /medical/i,
  /health/i,
  /insurance/i,
  /tax/i,
  /itr/i,
  /salary/i,
  /payroll/i,
  /legal/i,
  /agreement/i,
  /contract/i,
  /certificate/i,
];

export async function assessPdfSafety(uri: string, name: string): Promise<PdfSafetyAssessment> {
  const file = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const decoded = decodePdfText(file);
  const reasons: PdfSafetyAssessment['reasons'] = [];

  if (/\/ByteRange\s*\[|\/Contents\s*<(?:[0-9A-Fa-f]{20,})>[^\n]*\/SubFilter/i.test(decoded)) {
    reasons.push('digital-signature');
  }

  if (/adbe\.pkcs7(?:\.detached)?|ETSI\.CAdES\.detached|adbe\.pkcs7\.sha1/i.test(decoded)) {
    reasons.push('embedded-signature');
  }

  if (SENSITIVE_NAME_PATTERNS.some((pattern) => pattern.test(name))) {
    reasons.push('sensitive-name');
  }

  return {
    isSigned: reasons.includes('digital-signature') || reasons.includes('embedded-signature'),
    isSensitive: reasons.includes('sensitive-name'),
    reasons,
  };
}

function decodePdfText(base64: string): string {
  try {
    const binary = globalThis.atob(base64);
    let output = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < binary.length; offset += chunkSize) {
      output += String.fromCharCode(...binary.slice(offset, offset + chunkSize).split('').map((character) => character.charCodeAt(0)));
    }
    return output;
  } catch {
    return '';
  }
}
