---
name: Nexus Plus product direction
description: Durable product and architecture decisions for the Nexus Plus mobile app.
---

Nexus Plus is intended to be a lightweight Android accessibility companion centered on offline reading and listening. The first build should prioritize local processing, large labeled touch targets, TalkBack compatibility, and a zero-data-collection experience over cloud accounts or server persistence.

The product surface should stay professional and tool-oriented: exactly two tabs (Home and Settings), with Home combining the major document and audio utilities as distinct named tools. Avoid generic AI-sounding copy and vague umbrella labels; Book Reader is the preferred name for the reading experience, with OCR presented as part of that flow.

**Why:** The product request explicitly centers independence, accessibility, and private offline playback; adding cloud dependencies too early would undermine the core promise.

**How to apply:** Prefer AsyncStorage and Expo-compatible native capabilities for local state and document workflows. Only add a backend when a feature genuinely needs remote discovery or persistence.