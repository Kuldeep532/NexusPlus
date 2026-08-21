declare global {
  // eslint-disable-next-line no-var
  var NexusFileEncryption?: {
    isAvailable(): boolean;
    lockFile(inputUri: string, outputUri: string, password: string): Promise<string>;
    unlockFile(inputUri: string, outputUri: string, password: string): Promise<string>;
  };
}

export const FileEncryptionNative = {
  isAvailable: () => Boolean(globalThis.NexusFileEncryption?.isAvailable?.()),
  lockFile: (inputUri: string, outputUri: string, password: string) => {
    const bridge = globalThis.NexusFileEncryption;
    if (!bridge) throw new Error('Native file encryption is unavailable in this build.');
    return bridge.lockFile(inputUri, outputUri, password);
  },
  unlockFile: (inputUri: string, outputUri: string, password: string) => {
    const bridge = globalThis.NexusFileEncryption;
    if (!bridge) throw new Error('Native file encryption is unavailable in this build.');
    return bridge.unlockFile(inputUri, outputUri, password);
  },
};
