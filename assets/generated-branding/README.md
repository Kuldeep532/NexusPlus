# Generated Nexus Plus branding

The canonical Nexus Plus brand is authored as code/vector primitives in `features/branding/NexusBrandMark.tsx`.

Use `pnpm brand:assets` to generate deterministic PNG exports from the same vector design. Generated files are intended for:

- Expo/Android app icon packaging
- Android adaptive-icon inputs
- Play Store icon upload
- Other store or marketing surfaces that require PNG

Do not hand-edit the PNG files. Re-run the generator after changing the source vector design so every exported size remains consistent.

Required generator dependency: `rsvg-convert` must be available on the machine performing asset generation.
