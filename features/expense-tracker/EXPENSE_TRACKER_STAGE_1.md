# Expense Tracker — Stage 1

Stage 1 establishes the secure financial feature boundary and UX foundation.

## Security

- Strong Android biometric authentication reuses the existing Biometric Vault backend.
- Device credential fallback is disabled.
- Screen capture and recent-app preview protection are enabled while unlocked.
- Expense state auto-locks on app backgrounding and after a short timeout.
- No biometric template is stored by Expense Tracker.

## Expense sources

- Manual entry is supported.
- Payment Announcer events have a trusted-source adapter boundary.
- SMS parsing is implemented as a pure parser only; Android SMS permission/receiver integration is deferred to the native Stage 2 adapter.

## Intelligence

Merchant text is normalized and matched against category patterns. High-confidence matches are categorized automatically. Unknown or low-confidence transactions fall back to `Other` / saved category for later review.

## Categories

The initial model includes groceries, food & dining, tea & coffee, transport, fuel, shopping, bills & utilities, rent & housing, healthcare, education, entertainment, travel, subscriptions, personal care, electronics, gifts, insurance, investments, taxes, fees & charges, cash withdrawal, and other.

## Backend

The Supabase boundary is defined but fail-closed until the real authenticated project configuration is supplied. Records are keyed to the authenticated user ID so the same Google-authenticated account can restore the data across devices.

## Stage 2

Stage 2 should add the native Android SMS receiver/permission flow, connect the trusted Payment Announcer event stream, implement the real Supabase repository/RLS path, add deduplication and transaction history, and improve merchant/category intelligence using user corrections and recurring patterns.
