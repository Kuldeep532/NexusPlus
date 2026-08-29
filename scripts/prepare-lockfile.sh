#!/usr/bin/env bash
set -euo pipefail

# Regenerate the pnpm lockfile from the repository's actual manifests.
# This is intentionally NOT a manual lockfile editor: pnpm calculates every
# package version, dependency edge, and integrity record.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm is required. Install the repository's pinned pnpm version first." >&2
  exit 1
fi

EXPECTED_PNPM="9.15.4"
ACTUAL_PNPM="$(pnpm --version)"
if [[ "$ACTUAL_PNPM" != "$EXPECTED_PNPM" ]]; then
  echo "ERROR: Expected pnpm $EXPECTED_PNPM, found $ACTUAL_PNPM." >&2
  echo "Run: corepack prepare pnpm@$EXPECTED_PNPM --activate" >&2
  exit 1
fi

echo "Regenerating pnpm-lock.yaml from package manifests..."
pnpm install --lockfile-only --no-frozen-lockfile

# Verify the newly generated lockfile is acceptable to CI's frozen install.
echo "Validating frozen lockfile installation..."
pnpm install --frozen-lockfile --ignore-scripts

echo "SUCCESS: pnpm-lock.yaml is synchronized and passes frozen-lockfile validation."
