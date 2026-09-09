# CCTV Module — Stage 3

Stage 3 hardens the CCTV path around a fail-closed security boundary.

## Security model

1. LAN discovery is untrusted input. Discovery results are candidates only and are never treated as authenticated devices.
2. A managed ONVIF camera must have an HTTPS endpoint, local credentials stored through device-protected SecureStore, and a successful authenticated ONVIF handshake.
3. Stored capability flags are hints only. Runtime authorization is refreshed from the native protocol handshake before privileged operations are enabled.
4. Native CCTV sessions are short-lived, single-owner sessions. Expired sessions are removed and their native transport is closed.
5. Network and authentication failures are classified separately so retry behavior does not accidentally turn an authorization failure into a blind reconnect loop.
6. Credentials, endpoint details, tokens, and stream URIs are not rendered in the normal CCTV UI.

## ONVIF boundary

Live streaming uses the authenticated ONVIF Media/Media2 `GetStreamUri` operation. Recording search/playback must use the ONVIF Recording Search and Replay services and real recording tokens. Recording creation/start/stop must use the Recording Control job model; deleting a recording is never a substitute for stopping a recording.

Unsupported device-specific operations remain unavailable unless the authenticated native adapter proves them. The app must not infer features from manufacturer names, QR capability claims, or WS-Discovery metadata alone.

## Validation

Stage 3 is not complete until the native Android implementation and CI build validate together. A missing or incompatible native capability must fail closed rather than produce a fake success state.
