# Sign PDF — Deferred Reusable Sprint

Status: Deferred. Not exposed in the PDF Tools UI.

## Intended scope
- Handwritten signature drawn on a canvas only. No text-box signature entry.
- Page selection dialog and accessible page navigation.
- Signature preview with move and resize controls before applying.
- Local persistence of the user's saved signature artwork for reuse.
- Optional local visual-consistency check against a previously saved signature pattern. This must be presented only as a convenience check, never as identity proof or biometric authentication.
- Optional on-device hand landmark detection for finger-only drawing assistance may be explored later; no face recognition is required.
- Final PDF overlay must be implemented natively and verified before enabling the feature.

## Safety/product constraints
- The feature must never claim that a handwritten signature is government-certified, legally equivalent to a qualified digital signature, or proof of signer identity.
- No automatic government-document classifier should be relied upon as a legal/compliance gate. Any unsupported-document restriction must be based on explicit product rules and clear user messaging.
- A mismatch check may reject a signature as a local consistency failure, but must not claim to prove forgery or authorship.
- Signature data should remain local unless the product later adds an explicit consented sync design.

## Reusable architecture target
- `SignatureCanvas` component for drawing and accessibility state.
- `SignatureStore` for local persistence and versioned signature records.
- `SignaturePlacementDialog` for page selection and move/resize.
- `PdfSignatureOverlay` native bridge for applying the visual mark to a PDF.
- Shared result workflow: automatic save, Share, Close.

This sprint is intentionally separate from the currently shipped PDF tool set and should not be exposed until native overlay and security review are complete.
