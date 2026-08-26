# Nexus Plus Productivity AI Workflow

A lightweight, pattern-first assistant for email, meetings and calendar tasks.

## Design goals

- No LLM model weights are bundled in the Android APK.
- Natural-language requests are converted into a small typed workflow plan.
- Message writing uses a tiny bilingual template composer (Hindi, English and Hinglish).
- The workflow engine is provider-agnostic: Gmail/Google Calendar or another account provider can be attached without changing the planner.
- Destructive or externally visible actions are confirmation-gated by default.
- Only the minimum structured data needed to compose the message/event is passed to the composer.

## Voice

Use Android's installed speech recognition and Text-to-Speech services through the native layer. This keeps voice assets out of the APK and allows the user's installed/default voice service to supply Hindi and English voices when available. No downloaded Google voice model is bundled by this feature.

A future native adapter should expose:

- `startListening({ locales: ['hi-IN', 'en-IN'] })`
- `stopListening()`
- `speak(text, locale)`

The productivity workflow should consume only the recognized transcript; raw audio should not be persisted.

## Email and calendar automation boundary

True unattended sending and calendar writes require an authenticated account/provider. There is no safe universal "without an API" mechanism for silently sending Gmail mail or modifying Google Calendar. The provider interface therefore remains explicit. An Android intent can be used for user-reviewed handoff, while a connected Google provider can implement unattended actions after OAuth and user consent.

The default provider fails closed until configured. This prevents a workflow from appearing to send an email when it has no account authorization.

## Lightweight AI strategy

The current composer is deliberately deterministic. It provides consistent bilingual output at negligible APK cost. If later you want richer generation, add a remote/provider-backed small model behind the same composer interface rather than shipping model weights in the app. The app should send only the selected context/key points, not the user's entire mailbox or calendar.
