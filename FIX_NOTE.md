# Fix: protect-pdf compiler state

The CI error reported `app/protect-pdf.tsx` comparing `state` with `"processing"` while TypeScript inferred a union without that member. The current canonical `ProtectPdfState` type already contains `"processing"`; this marker file records the verified state contract for the fix branch.
