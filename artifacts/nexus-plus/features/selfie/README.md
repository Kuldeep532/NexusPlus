# Nexus Plus Selfie

The Selfie feature is registered on Home and available at `/selfie`.

## Shutter sound asset

Place the real shutter sound at:

`assets/selfie_shutter_nexus_01.mp3`

The screen imports this exact asset name, so no code change is required after replacing the placeholder with a valid audio file.

## Behavior

- Opens the front camera.
- Detects a face and evaluates position, size, and head angle.
- Gives spoken guidance such as “Move left”, “Move right”, “Move up”, “Move down”, “Move closer”, “Move back”, and “Hold still”.
- Requires several consecutive ready frames before taking the photo automatically, reducing accidental captures caused by single-frame detections.
- Saves the captured image to the device photo library after permission is granted.
- Announces the capture state and saved state through the screen-reader accessibility channel and native device TTS.
- TTS is performed locally through Expo Speech; no cloud voice service is required.

## Build note

The project must include the `expo-camera` native module in its installed dependency lockfile before producing an APK. Run the workspace package manager's install step after pulling this change so the lockfile matches `package.json`.
