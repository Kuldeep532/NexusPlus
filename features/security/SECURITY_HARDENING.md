# Device and Account Security Hardening

## Device trust

The app uses Google Play Integrity as the authoritative hardware-backed signal for:

- Play-recognized app integrity.
- Play licensing / legitimate installation.
- Certified-device integrity.
- Optional strong-integrity enforcement.
- Play Protect state.
- App-access-risk signals for apps that can capture or control the screen.
- Device Recall for reuse detection after reinstall/reset when enabled in Play Console.

A Play Integrity token must be verified by a backend service. The app must never decrypt or verify the token locally.

## Developer options and debugging

Android third-party apps cannot reliably read the global ADB/developer-option flags. Therefore the implementation does not pretend that a local `Settings.Global` value is a security boundary. Device integrity and Play Integrity verdicts are the authoritative enforcement signals.

## Install source and tampering

Play-recognized app integrity is required for protected backend operations. The production backend is the security authority: it verifies the Play Integrity token and rejects protected operations when the installed binary, licensing state, or device integrity does not satisfy policy. A modified/re-signed build may still display limited local UI, but it must not receive protected backend data or privileged API access.

The app never intentionally corrupts, deletes, or degrades user data because a binary was modified. Tamper handling is fail-closed: protected reads/writes and privileged operations are denied, while ordinary local UI remains usable where possible. This prevents an attacker from turning the integrity control itself into a data-destruction mechanism.

## One account per device

The policy is enforced in Supabase using a unique device binding and a unique active account binding. Client-side storage is not the authority.

- A device can have only one active account binding.
- An account can be bound to only one device binding.
- A second account on the same device is rejected server-side.
- Uninstalling the app does not clear the server binding.
- Device Recall can preserve reuse detection across reinstall/reset where enabled by Google Play.

## Account deletion

A deletion request enters a pending-delete state with a 30-day cooldown before the device binding can be recycled. This prevents rapid account churn and abuse.

## IP abuse control

The app does not implement a permanent IP ban. Mobile carrier NAT, shared Wi-Fi, VPNs, and changing addresses make permanent IP blocking unsafe and prone to false positives. IP address signals may be used as a secondary server-side abuse/risk signal with bounded retention and rate limits. Device/account binding is the durable control.

## User-facing block

When the backend denies access because the installation/device is not trusted, the client should render:

> Please uninstall this app to use this app.

No payment, profile, account, or business UI should be accessible while blocked.
