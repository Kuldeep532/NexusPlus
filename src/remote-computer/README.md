# Remote Computer Access — Stages 1–6

Android-first remote computer access for a paired Windows, Ubuntu/Linux, or macOS desktop agent.

Stage 6 adds a first-time Protection Password gate, secure paired-agent state, Android SecureStore persistence, and protected control-session routing. First-time activation requires a reachable desktop agent and a human-confirmed pairing code. The password is never sent to the agent.

The Android native signing boundary is `NexusRemoteKeyModule`. Its private key stays in Android Keystore; the JavaScript layer only receives public-key material or signatures. Protected remote commands continue to use fresh challenges and phone user authentication.

The Protection Password is an app-access gate, not a desktop OS-password replacement and does not bypass Windows, macOS, or Ubuntu security policy.

Production work still required includes TLS/mutual authentication, signed desktop installers, Windows Credential Provider, macOS authorization helper, Linux AT-SPI/Orca helper, NVDA/VoiceOver integration, and consent-based screen streaming.
