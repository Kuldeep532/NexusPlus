# CCTV Module — Stage 3

Stage 3 hardens the CCTV path around a fail-closed security boundary and Google Play transparency requirements.

## Security model

1. LAN discovery is untrusted input. Discovery results are candidates only and are never treated as authenticated devices.
2. A managed ONVIF camera must have an HTTPS endpoint, local credentials stored through device-protected SecureStore, and a successful authenticated ONVIF handshake.
3. Stored capability flags are hints only. Runtime authorization is refreshed from the native protocol handshake before privileged operations are enabled.
4. Native CCTV sessions are short-lived, single-owner sessions. Expired sessions are removed and their native transport is closed.
5. Network and authentication failures are classified separately so retry behavior does not accidentally turn an authorization failure into a blind reconnect loop.
6. Credentials, endpoint details, tokens, and stream URIs are not rendered in the normal CCTV UI.
7. CCTV tools are restricted to cameras and connected devices the user owns or is expressly authorized to operate. Unauthorized third-party camera access/control is prohibited.

## ONVIF boundary

Live streaming uses the authenticated ONVIF Media/Media2 `GetStreamUri` operation. Recording search/playback must use the ONVIF Recording Search and Replay services and real recording tokens. Recording creation/start/stop must use the ONVIF Recording Control job model; deleting a recording is never a substitute for stopping a recording.

Unsupported device-specific operations remain unavailable unless the authenticated native adapter proves them. The app must not infer features from manufacturer names, QR capability claims, or WS-Discovery metadata alone.

## Play Store transparency boundary

The first-launch CCTV Responsible-Use Notice is shown before the user can proceed to the normal app flow when CCTV policy acceptance has not yet been recorded. The user must affirmatively check the acknowledgement. Acceptance is persisted locally so the same notice does not appear on every launch.

The notice is supplemental to the in-app Privacy Policy, Terms & Conditions, Play Console Data safety disclosure, and any permission-specific disclosures required by Android/Google Play. The store listing must accurately describe the CCTV feature and must not market secret surveillance, spying, covert monitoring, or unauthorized camera access.

No policy text can guarantee Google Play approval. The shipped build, store listing, declared permissions, Data safety answers, SDK behavior and actual data flows must all be truthful and consistent.

## Abuse response

Unauthorized camera use is prohibited. Where reliable evidence of misuse through Nexus Plus services exists, the service may begin security review and appropriate account/feature action as soon as reasonably practicable, including within 24 hours where operationally feasible. This is an operational target, not a guaranteed response deadline.

## Validation

Stage 3 is not complete until the native Android implementation and CI build validate together. A missing or incompatible native capability must fail closed rather than produce a fake success state. Play Console review should use the production APK/AAB and current store listing, privacy policy, terms and Data safety declarations as the source of truth.
