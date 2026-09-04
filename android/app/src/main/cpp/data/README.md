# Nexus local protection datasets

These directories contain offline, build-time source datasets for Nexus protection.

The raw lists are intentionally kept out of generated/native source files. Build tooling should consume them as local inputs and emit a compact, read-only runtime representation.

Expected dataset layout:

- `stevenblack/porn-only/hosts` — StevenBlack `porn-only` hosts snapshot.
- `stevenblack/social-only/hosts` — StevenBlack `social-only` hosts snapshot (optional).

For each dataset, keep a small `SOURCE.txt` beside the raw file with:

- upstream URL
- snapshot date
- source revision or version when available
- SHA-256 of the downloaded raw file
- declared domain count when available

Do not expose these files through Android resources, HTTP endpoints, React Native bridges, or user-facing settings. They are build inputs only.

The runtime representation should be generated under `../generated/` and embedded in native code as a compact lookup structure. Runtime code must only expose a boolean/classification result, never the source list.
