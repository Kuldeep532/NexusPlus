# Expense Tracker — Stage 2

Stage 2 builds the live financial data pipeline on the Stage 1 foundation.

## Added
- Dedicated Stage 2 branch isolated from Stage 1 work.
- Trusted Payment Announcer event -> Expense Tracker adapter.
- Android SMS transaction parser boundary with normalized transaction output.
- Merchant/category suggestion integration for detected transactions.
- Duplicate protection using source transaction identifiers.
- Strong biometric-only access reusing Android Biometric Vault.
- Background lock, timeout lock, and screen/recent-app protection.
- Supabase repository adapter and authenticated-user ownership checks.
- Reference Supabase schema with per-user Row Level Security policies.

## Security boundary
- Biometric templates are never stored by Expense Tracker.
- Device credential fallback is not enabled for the financial feature.
- Raw SMS bodies are parsing inputs only; normalized expense records are the cloud payload.
- Backend writes must use the authenticated user's ID and Supabase RLS.
- Unconfigured backend remains fail-closed.

## Deferred
- Exact Android SMS runtime permission/receiver wiring and vendor-specific sender allowlisting.
- Production Supabase client injection from the existing verified auth/session boundary.
- Full live Payment Announcer queue subscription and background orchestration.
- Merchant learning feedback loop and recurring-merchant models.
