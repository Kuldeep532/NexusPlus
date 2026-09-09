# Google Play CCTV / Privacy Compliance Notes

Last Updated: September 9, 2026

This document is the source-of-truth checklist for the Google Play submission of Nexus Plus regarding camera/CCTV functionality.

## Product positioning

Nexus Plus is not presented as spyware, stalkerware, a secret-surveillance product, or a tool for covert monitoring. CCTV functionality is intended for cameras, DVRs, NVRs, and connected devices that the user owns or is expressly authorized to operate.

The app must not provide a feature, link, hidden flow, or alternate download that enables unauthorized surveillance or camera access.

## In-app disclosure

Before CCTV-related sensitive access or camera functionality is requested, the app presents a clear in-app responsible-use disclosure and obtains affirmative user action. The disclosure explains:

- only cameras the user owns or is expressly authorized to use may be connected or controlled;
- third-party or unauthorized camera access is prohibited;
- CCTV data and credentials are handled only for the declared feature;
- unsupported or unverified camera capabilities are disabled; and
- suspected misuse may lead to security review and account/feature restrictions.

The first-launch notice is an additional safety disclosure; it does not replace the Privacy Policy, Terms & Conditions, Google Play Data safety declarations, or any permission-specific disclosure that may be required.

## Technical anti-abuse boundary

Supported CCTV integrations use authenticated transport and device-identity verification before privileged operations are enabled. LAN discovery data is treated as untrusted input and is not itself authorization. The app does not treat a QR code, serial number, network address, or advertised capability as sufficient proof of authority.

Privileged functions are gated by the authenticated native protocol session and verified device capabilities. Unsupported controls fail closed.

## Privacy Policy and Terms

The in-app Privacy Policy and Terms & Conditions explicitly state that users must have lawful authorization for camera access, recording, monitoring, control, or deletion. They describe the categories of camera-related information processed, local security storage, third-party-provider boundaries, and abuse-response measures.

The 24-hour language is intentionally framed as an operational target where reasonably feasible rather than as an absolute promise. This avoids implying that the company can guarantee a fixed security-response deadline for every incident.

## Play Console Data safety

The Play Console Data safety form must be completed to match the production APK/AAB exactly. Declare camera, video, microphone, device/network, authentication, and other data categories only where the shipped build actually accesses, collects, shares, or processes them. Do not claim that data is never shared if any enabled SDK or backend transmits it.

## Store listing requirements

The store listing should describe CCTV functionality accurately, for example as authorized CCTV/device management for equipment the user owns or is authorized to operate. Do not use marketing language suggesting secret surveillance, spying, covert monitoring, hidden tracking, or access to cameras belonging to other people.

Store screenshots and video must show the same disclosure and the same user-facing CCTV flow implemented in the APK.

## Review positioning

Google Play review should be able to verify the following directly in the build:

1. CCTV is a declared user-facing feature rather than a hidden behavior.
2. The user is informed before sensitive access is requested where applicable.
3. Camera access and controls require user action and authorization.
4. Unauthorized third-party camera use is prohibited.
5. Unsupported or unverified controls are blocked rather than simulated.
6. Privacy Policy and Terms are available inside the app and are consistent with the store declarations.

This checklist cannot guarantee approval. Google Play makes its own policy determination during review, and the final Data safety and permission declarations must match the actual shipped build.
