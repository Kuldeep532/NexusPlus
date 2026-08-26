# Expense Tracker — Stage 3

Stage 3 continues on the existing `feature/expense-tracker-stage-2` branch and therefore stays inside PR #32. No new PR is created.

## Integration

- Payment Announcer and Expense Tracker are registered together through `features/home/financialFeatureRegistry.ts`.
- Both routes are marked as biometric-protected financial features.
- Home UI integration must consume this registry rather than duplicating route metadata.

## Financial flow

1. Trusted Payment Announcer event is normalized.
2. SMS transaction parser produces the same normalized shape.
3. Merchant/category engine assigns a category and confidence score.
4. Low-confidence or unknown merchants fall back to `Other` / saved-category handling.
5. Transaction deduplication prevents duplicate expense records.
6. Only normalized expense fields are eligible for cloud sync.

## Security

- Expense Tracker uses the Android Biometric Vault strong biometric gate.
- Device-credential fallback is disabled for the financial feature.
- Background and timeout locking remain mandatory.
- Screen/recent-app protection remains active while unlocked.
- Raw SMS message bodies are not persisted to Supabase.

## Remaining integration boundary

The exact Home presentation component still needs to be connected to the registry after the repository's home component path is verified. This stage does not invent or replace an unknown Home screen file.
