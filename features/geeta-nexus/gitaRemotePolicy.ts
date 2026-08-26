export interface GitaRemoteManifest {
  schemaVersion: number;
  contentVersion: string;
  sha256: string;
  generatedAt: string;
}

export interface GitaLocalSnapshot {
  schemaVersion: number;
  contentVersion: string;
  sha256: string;
  hydratedAtMs: number;
}

export function shouldRefreshGitaContent(local: GitaLocalSnapshot | null, remote: GitaRemoteManifest | null): boolean {
  if (!remote) return false;
  if (!local) return true;
  return local.schemaVersion !== remote.schemaVersion || local.contentVersion !== remote.contentVersion || local.sha256 !== remote.sha256;
}

export function nextGitaSnapshot(remote: GitaRemoteManifest, now = Date.now()): GitaLocalSnapshot {
  return {
    schemaVersion: remote.schemaVersion,
    contentVersion: remote.contentVersion,
    sha256: remote.sha256,
    hydratedAtMs: now,
  };
}
