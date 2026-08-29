import { cctvCredentialStore, CctvBackendError, getCctvAdapter, assertCapability, type CctvCameraRecord } from './cctvBackend';
import { updateCctvCameraStatus } from './cctvRepository';

export async function changeCctvCameraPassword(
  camera: CctvCameraRecord,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (!camera.host || !camera.port) {
    throw new CctvBackendError({
      code: 'NETWORK_UNAVAILABLE',
      message: 'A local network address is required for password change.',
      retryable: false,
    });
  }

  assertCapability(camera, 'passwordChange');

  const credentials = await cctvCredentialStore.read(camera.id);
  if (!credentials || credentials.password !== currentPassword) {
    throw new CctvBackendError({
      code: 'AUTH_FAILED',
      message: 'The current camera password is incorrect.',
      retryable: false,
    });
  }

  if (newPassword.trim().length < 6) {
    throw new CctvBackendError({
      code: 'INVALID_INPUT',
      message: 'The new camera password is too short.',
      retryable: false,
    });
  }

  const adapter = getCctvAdapter(camera.protocol);
  const session = await adapter.connect(camera);
  try {
    await adapter.changePassword(session, currentPassword, newPassword);
    await cctvCredentialStore.save(camera.id, camera.username, newPassword);
    await updateCctvCameraStatus(camera.id, { connectionState: 'connected', lastErrorCode: undefined });
  } catch (error) {
    const code = error instanceof CctvBackendError ? error.code : 'OPERATION_FAILED';
    await updateCctvCameraStatus(camera.id, { connectionState: 'error', lastErrorCode: code });
    throw error;
  } finally {
    await adapter.disconnect(session);
  }
}
