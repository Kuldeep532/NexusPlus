const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*_-+=?';

function randomInt(max: number): number {
  if (max <= 0) throw new Error('Invalid random range.');
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.getRandomValues) {
    const buf = new Uint32Array(1);
    cryptoApi.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function pick(pool: string): string {
  return pool[randomInt(pool.length)];
}

function shuffle(value: string): string {
  const chars = value.split('');
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export interface PasswordGeneratorOptions {
  length?: number;
  includeSymbols?: boolean;
  includeDigits?: boolean;
  includeUppercase?: boolean;
}

export function generateSecurePassword(options: PasswordGeneratorOptions = {}): string {
  const length = Math.min(64, Math.max(12, options.length ?? 20));
  const includeSymbols = options.includeSymbols ?? true;
  const includeDigits = options.includeDigits ?? true;
  const includeUppercase = options.includeUppercase ?? true;

  let pools = LOWER;
  if (includeUppercase) pools += UPPER;
  if (includeDigits) pools += DIGITS;
  if (includeSymbols) pools += SYMBOLS;

  const required: string[] = [pick(LOWER)];
  if (includeUppercase) required.push(pick(UPPER));
  if (includeDigits) required.push(pick(DIGITS));
  if (includeSymbols) required.push(pick(SYMBOLS));

  while (required.length < length) required.push(pick(pools));
  return shuffle(required.join(''));
}
