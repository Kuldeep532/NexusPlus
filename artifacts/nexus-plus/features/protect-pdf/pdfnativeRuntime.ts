import 'pdfnative';

/**
 * pdfnative expects TextEncoder/TextDecoder in React Native.
 * The project already carries @stardazed/streams-text-encoding; this module
 * installs the standards-compatible implementations once when available.
 */
import { TextEncoder, TextDecoder } from '@stardazed/streams-text-encoding';

const globalObject = globalThis as typeof globalThis & {
  TextEncoder?: typeof TextEncoder;
  TextDecoder?: typeof TextDecoder;
};

if (!globalObject.TextEncoder) globalObject.TextEncoder = TextEncoder;
if (!globalObject.TextDecoder) globalObject.TextDecoder = TextDecoder;
