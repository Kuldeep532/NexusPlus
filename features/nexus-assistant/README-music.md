# Nexus Assistant Music Control

Nexus Assistant now recognizes direct music commands such as:

- `play Kesariya`
- `अगला गाना`
- `previous song`
- `pause music`
- `resume music`
- `stop song`

The Android bridge discovers installed apps that advertise the Android music category and sends the standard `MEDIA_PLAY_FROM_SEARCH` intent to the selected compatible app. Playback control uses standard media keys.

The Assistant also exposes a Music Apps attachment panel and reuses the existing Nexus persistent media/player surface for Nexus-owned playback.

## ElizaOS

ElizaOS is integrated as a thin plugin/action contract through `@elizaos/core`. It does not create a second audio engine or bypass Android app/provider restrictions.

The runtime execution path remains:

Eliza action semantics -> Nexus capability planner -> Android-safe native music bridge -> compatible music app / existing Nexus media controller.
