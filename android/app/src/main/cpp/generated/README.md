# Generated protection data

This directory is reserved for generated native lookup data.

Do not upload or edit generated domain tables manually.

Build pipeline contract:

1. Read local raw datasets from `../data/stevenblack/**/hosts`.
2. Validate format and compute SHA-256.
3. Generate a compact native lookup representation into this directory.
4. Fail the build if a declared dataset is missing or its digest does not match metadata.
5. Link the generated representation into `nexus_security`.
6. Keep the runtime API classification-only: blocked/allowed, with no domain-list enumeration API.

The generated output must be deterministic for the same raw inputs and must not be written back into the source dataset directories.
