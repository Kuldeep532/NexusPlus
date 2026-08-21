# Payment Announcer — Phase 2

Phase 2 adds the protected UI/session layer and connects Payment Announcer to the existing Biometric Vault backend.

## Biometric model

Payment Announcer does not create, store, or enroll a second biometric. It calls the existing Android Vault backend and uses the same Android `BiometricPrompt` enrollment already managed by Biometric Vault.

- Existing strong biometric in Vault: Payment Announcer can use it immediately.
- No strong biometric available: setup remains blocked until the user enrolls one through Biometric Vault.
- Payment Announcer never accepts device credentials as a fallback.
- There is no fingerprint/face template duplication between features.

## First-run setup

The first Payment Announcer open requires biometric verification. Successful verification marks the feature as set up and opens a short-lived protected session.

## Session security

- Locks on backgrounding.
- Auto-locks after the configured timeout.
- Screenshot/recent-app preview protection is enabled while unlocked.
- Payment controls are hidden while locked.

## UI

The new route provides:

- First-run secure setup.
- Locked/unlocked state.
- Biometric protection status.
- Announcement enable/disable control.
- Preferred voice strategy display.
- Voice availability check.
- Explicit lock action.

## Settings

Payment Announcer settings remain feature settings and are intended to be surfaced inside the app's normal Settings surface. They are stored locally with validation and bounded values.

## Payment data boundary

Phase 2 deliberately does not accept arbitrary payment identity, amount, or transaction data from the UI. A real notification/payment source must be authenticated and validated in a later stage before spoken announcements are enabled for production use.
