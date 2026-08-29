# CCTV Module — Stage 2

Stage 2 integrates the local-first CCTV feature into Nexus Plus without requiring an online CCTV database.

## Included

- Camera domain/capability model.
- Secure local persistence using Expo SecureStore.
- Camera onboarding screen with QR scan, serial number, and manual modes.
- Camera username/password capture without exposing credentials in normal UI.
- Camera list screen.
- Separate live-view, recordings, search/playback, erase, and security screens.
- Capability-driven controls; unsupported camera operations stay disabled instead of pretending to work.
- CCTV registered as a major Nexus Plus Home feature.

## Security boundary

Camera passwords and local erase-protection material are kept in SecureStore. IP addresses, ports, and streaming URLs are intentionally not shown in the normal UI.

Destructive erase and camera-password mutation are fail-closed until a verified model/protocol adapter exists for the target camera. Stage 2 does not claim universal ONVIF/RTSP/HTTP control support.

## Network boundary

The app architecture is local-first. Same-LAN discovery and protocol-specific control belong in future adapters; no cloud CCTV database is introduced.
