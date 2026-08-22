# Geeta Nexus — Verified Data Sources

## Primary text source
- `ChiragMirani/gita-quotes` is the primary text dataset. Its README states that the code is MIT licensed and the English translations are public domain / free to quote; it contains all 700/701 verses in a redistributable JSON dataset.
- The app normalizes that source into the stable Geeta Nexus schema before use.

## Optional metadata/reference source
- `vedicscriptures/bhagavad-gita-api` may be used for chapter/verse metadata refresh and validation. It is an open-source MIT-licensed API project.
- The app must not call the API repeatedly. A successful hydration is persisted locally with a version/hash manifest and all future reads come from the local cache.

## Removed source
- The earlier `everydaycodings/Bhagavad-Gita` repository is no longer a production data source because GitHub metadata reports no declared license. Its files must not be treated as redistribution-cleared assets.

## Offline-first rule
- First successful hydration creates a local versioned Gita dataset.
- Subsequent launches use the local dataset and do not fetch the API again.
- Refresh is optional, explicit, and version/hash based.
- If network is unavailable, cached data remains fully usable.

## Audio rule
- Gita audio is represented as `MediaItemModel` items and handed to the existing `NexusMediaPlayer`.
- No separate Gita audio-player implementation is permitted.
- Audio assets require a separately verified redistribution license before being bundled or served from Firebase.
