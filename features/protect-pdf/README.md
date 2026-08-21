# Protect PDF

Expo/React Native feature boundary for password-protected PDF workflows.

The feature UI and storage integration are intentionally separated from PDF encryption implementation. A native-compatible PDF encryption engine must be wired into `protectPdfEngine.ts`; the current app dependency set does not include one.

Security requirements:
- Never log PDF passwords.
- Never persist plaintext passwords outside the explicit Nexus Vault save action.
- Clear password state after completion or screen unmount.
- Use user password as the PDF open password.
- Prefer a distinct owner password generated locally when the chosen engine supports it.
