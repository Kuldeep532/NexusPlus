# Premium Payment — Archived

Premium membership and payment integration are intentionally disabled from the active Nexus Plus frontend for the current release.

## Retained backend foundation

The repository retains the Supabase billing/UPI migrations and entitlement contracts as archived backend infrastructure. These must not be exposed as active purchase UI until a future release explicitly re-enables them.

## Active frontend state

- Buy Premium is not exposed from Settings.
- No payment gateway is invoked by the active app UI.
- No UPI intent is launched by the active app UI.
- Premium plan pricing is not sourced into active screens.

## Re-enable requirements

Before re-enabling, complete trusted UTR/payment reconciliation, entitlement activation, cancellation/refund handling, audit logging, and production testing.
