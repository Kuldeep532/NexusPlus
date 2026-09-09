# Google Play CCTV / Privacy Compliance Notes

Last Updated: September 9, 2026

This document is a compliance checklist for the Google Play submission of Nexus Plus regarding camera/CCTV functionality. It is not a guarantee of approval and does not replace the Play Console declarations or review process.

## Product positioning

Nexus Plus is not presented as spyware, stalkerware, a secret-surveillance product, or a tool for covert monitoring. CCTV functionality is intended for cameras, DVRs, NVRs, and connected devices that the user owns or is expressly authorized to operate.

The app must not provide a feature, link, hidden flow, or alternate download that enables unauthorized surveillance or camera access.

## In-app disclosure

The first-launch responsible-use notice is a supplemental disclosure. It does not replace feature-specific disclosure immediately before a relevant sensitive permission request or capability request.

When a CCTV feature requests camera permission for QR scanning, the in-app flow should explain before the Android permission request that camera access is used to scan a QR code for the user-initiated CCTV setup. The request must follow the disclosure and require the normal Android user choice.

When a CCTV feature requests or obtains other personal or sensitive data, the in-app flow should clearly describe what is accessed or collected, how it is used, and any sharing that occurs, immediately before the applicable consent or permission step where the Play User Data policy requires it.

The responsible-use disclosure should explain:

- only cameras the user owns or is expressly authorized to use may be connected or controlled;
- third-party or unauthorized camera access is prohibited;
- CCTV data and credentials are handled only for the declared feature;
- unsupported or unverified camera capabilities are disabled; and
- suspected misuse may lead to security review and account/feature restrictions.

## Technical anti-abuse boundary

Supported CCTV integrations use authenticated transport and device-identity verification before privileged operations are enabled. LAN discovery data is treated as untrusted input and is not itself authorization. The app does not treat a QR code, serial number, network address, or advertised capability as sufficient proof of authority.

Privileged functions are gated by the authenticated native protocol session and verified device capabilities. Unsupported controls fail closed.

The app must never claim that it can secretly detect a hacker, infer that someone is using a third-party camera, or guarantee that unauthorized camera activity will be detected unless the shipped product actually implements that capability and the claim is accurate.

## Privacy Policy and Terms

The in-app Privacy Policy and Terms & Conditions explicitly state that users must have lawful authorization for camera access, recording, monitoring, control, or deletion. They describe the categories of camera-related information processed, local security storage, third-party-provider boundaries, and abuse-response measures.

The 24-hour language is intentionally framed as an operational target where reasonably feasible rather than as an absolute promise. This avoids implying that the company can guarantee a fixed security-response deadline for every incident.

## Play Console Data safety

The Play Console Data safety form must be completed to match the production APK/AAB exactly. Declare camera, video, microphone, device/network, authentication, and other data categories only where the shipped build actually accesses, collects, shares, or processes them. Do not claim that data is never shared if any enabled SDK or backend transmits it.

## Store listing requirements

The store listing should describe CCTV functionality accurately, for example as authorized CCTV/device management for equipment the user owns or is authorized to operate. Do not use marketing language suggesting secret surveillance, spying, covert monitoring, hidden tracking, or access to cameras belonging to other people.

Store screenshots and video must show the same user-facing functionality implemented in the APK. Do not present policy text, screenshots, or videos as evidence of a capability the build does not actually provide.

## Review positioning

Google Play review should be able to verify the following directly in the build:

1. CCTV is a declared user-facing feature rather than a hidden behavior.
2. The user is informed before sensitive access is requested where applicable.
3. Camera permission for QR scanning, when requested, is clearly explained immediately before the Android permission prompt.
4. Camera controls require user action and supported authorization checks.
5. Unauthorized third-party camera use is prohibited.
6. Unsupported or unverified controls are blocked rather than simulated.
7. Privacy Policy and Terms are available inside the app and are consistent with the store declarations.

## Approval boundary

No wording, privacy policy, first-launch notice, technical safeguard, or documentation in this repository can guarantee Google Play approval. Approval depends on the complete shipped APK/AAB, all SDKs and permissions, Play Console declarations, store metadata, account status, and Google's review of the actual behavior.

This checklist should be re-checked whenever camera/CCTV behavior, permissions, SDKs, backend data flows, or store metadata change.
