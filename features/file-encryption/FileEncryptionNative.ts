declare global {
  // eslint-disable-next-line no-var
  var NexusFileEncryption: {
    isAvailable(): boolean;
    lockFile(inputUri: string, outputUri: string, password: string): Promise<string>;
    unlockFile(inputUri: string, outputUri: string, password: string): Promise<string>;
  } | undefined;
}

export const FileEncryptionNative = {
  isAvailable: () => {
    try {
      return Boolean(globalThis.NexusFileEncryption?.isAvailable?.());
    } catch {
      return false;
    }
  },
  lockFile: async (inputUri: string, outputUri: string, password: string) => {
    const bridge = globalThis.NexusFileEncryption;
    if (!bridge?.isAvailable?.()) throw new Error('Native file encryption is unavailable in this build.');
    try {
      const result = await bridge.lockFile(inputUri, outputUri, password);
      if (!result || result.startsWith('ERROR:')) throw new Error('File encryption failed.');
      return result;
    } catch {
      throw new Error('File encryption failed.');
    }
  },
  unlockFile: async (inputUri: string, outputUri: string, password: string) => {
    const bridge = globalThis.NexusFileEncryption;
    if (!bridge?.isAvailable?.()) throw new Error('Native file encryption is unavailable in this build.');
    try {
      const result = await bridge.unlockFile(inputUri, outputUri, password);
      if (!result || result.startsWith('ERROR:')) throw new Error('Wrong password or corrupted file.');
      return result;
    } catch {
      throw new Error('Wrong password or corrupted file.');
    }
  },
};
