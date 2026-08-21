# Payment Announcer — Stage 1

Stage 1 establishes the security and architecture boundary for Payment Announcer.

## Security requirements

- Payment Announcer requires an enrolled Android `BIOMETRIC_STRONG` authenticator.
- Device PIN/pattern/password fallback is intentionally not accepted for this feature.
- The feature must not expose payment content before successful authentication.
- Screen capture and recent-apps preview protection are enabled while the protected feature is active.
- Payment transaction/network logic is not included in Stage 1.

## TTS architecture

The feature uses a provider abstraction with this priority:

1. `pytts-voice-sheet` when the supported in-app voice sheet is actually available.
2. Android default TTS as fallback.

No provider is treated as available until its adapter reports availability.

## Settings

Payment Announcer settings belong to the normal app settings surface. They are not designed as a separate Tools-specific settings page.

Stage 1 defines the persisted settings model but does not yet wire a new UI screen or persistence implementation.

## Not included yet

- Real incoming-payment data model.
- Notification receiver/service.
- Sender/recipient identity handling.
- Transaction verification or anti-spoofing protocol.
- TTS engine implementation.
- Dedicated settings UI.
- Background announcement scheduling.

These are reserved for later stages after the security boundary is reviewed.
