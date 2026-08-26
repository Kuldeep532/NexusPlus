# Geeta Nexus — Stage 5 Sources

Stage 5 uses a verified source hierarchy.

## Primary text source
- `ChiragMirani/gita-quotes` provides the original Sanskrit, IAST transliteration, and an English translation described by its README as public-domain. The dataset is intended to be redistributed as a JSON file. 
- `vedicscriptures/bhagavad-gita-api` is retained as an API/reference source for chapter/verse metadata and future refreshes.

## Offline-first rule
- The app must ship only data that is verified for redistribution.
- After first successful hydration, verse data is stored locally and reused without repeated network requests.
- API refresh is optional and must never block offline reading.
- Unverified translations/commentaries/audio are not bundled.

## Audio rule
Gita audio is represented as `MediaItemModel` items and handed to the existing `NexusMediaPlayer`. A separate audio-player implementation is prohibited.
