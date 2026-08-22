# Geeta Nexus Firebase Asset Guide

## Goal
Keep the Android app bundle below the requested 100–200 MB range while supporting the complete Bhagavad Gita library, chapter audio, and optional verse-level recitations.

## Keep inside the app bundle
- `chapters.json`-derived normalized chapter metadata (18 chapters).
- Compact chapter summaries required for Home/Chapters UI.
- Lightweight chapter artwork only where size remains acceptable.
- App-owned schema/manifests and the offline cache/bootstrap code.

## Put in Firebase Storage
Recommended Storage root:

`geeta-nexus/`

### 1. Chapter summary audio — upload
`geeta-nexus/audio/chapters-summary/1.mpga`
...
`geeta-nexus/audio/chapters-summary/18.mpga`

These are the 18 chapter-summary audio files from the source repository.

### 2. Verse recitation audio — upload progressively
`geeta-nexus/audio/verse-recitation/<chapter>/<verse>.mp3`

Use chapter folders so the app can download only the chapter/verse the user requests.
Do not create one large ZIP for these assets in production; chapter/verse level addressing gives better caching, retry, and storage control.

### 3. Large text packs — recommended Firebase option
`geeta-nexus/data/gita-text-v1.json.gz`
`geeta-nexus/data/gita-manifest-v1.json`

The compressed data pack can contain normalized verse text, transliteration, translations, chapter summaries, and supported metadata. The manifest should include version, SHA-256, byte size, language availability, and schema version.

### 4. Optional commentary pack
`geeta-nexus/data/commentary-v1.json.gz`

Upload only after confirming redistribution/licensing rights for the exact commentary dataset.

## Do not upload raw GitHub repository layout directly
Normalize the upstream repository into the app's own stable schema and Firebase paths. This prevents UI code from depending on third-party filenames/folder structure.

## Recommended app behavior
1. App ships with compact chapter metadata and no large audio files.
2. First Gita Nexus launch downloads one versioned text pack if it is newer than the bundled schema/cache.
3. Chapter-summary audio downloads on demand and is cached locally.
4. Verse-recitation audio downloads only when a user requests it, then remains cached.
5. A manifest prevents repeated downloads when SHA/version is unchanged.

## Important rights check
The presence of a file in the upstream repository does not by itself grant redistribution rights. Verify the repository LICENSE and the licensing/rights for each translation, commentary, image, and audio collection before placing them in Firebase Storage and distributing them through the app.
