import { NativeModules } from 'react-native';

type TvAppNative = {
  isAppInstalled?: (packageName: string) => Promise<boolean>;
  launchLocalApp?: (packageName: string) => Promise<boolean>;
};

const native = NativeModules.NexusTvRemote as TvAppNative | undefined;

export async function isTvAppInstalled(packageHints: string[]): Promise<string | null> {
  if (!native?.isAppInstalled) return null;
  for (const packageName of packageHints) {
    try {
      if (await native.isAppInstalled(packageName)) return packageName;
    } catch {
      // Continue checking alternate package IDs.
    }
  }
  return null;
}

export async function launchTvApp(packageHints: string[], requireRemoteTarget = true): Promise<{ launched: boolean; installedPackage?: string; localOnly?: boolean }> {
  const installedPackage = await isTvAppInstalled(packageHints);
  if (!installedPackage) throw new Error('APP_NOT_INSTALLED');
  if (!native?.launchLocalApp) throw new Error('APP_LAUNCH_UNAVAILABLE');
  await native.launchLocalApp(installedPackage);
  return { launched: true, installedPackage };
}
