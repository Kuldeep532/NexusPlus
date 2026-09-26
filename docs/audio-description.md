# Audio Description

Nexus Plus now exposes Audio Description as an Audio Editor tool.

## User flow
1. Choose a video.
2. Select Basic or Advanced description.
3. Select language.
4. Optionally add instructions.
5. Generate an accessibility-focused narration.

## AI
The mobile app calls the existing Nexus Gateway. Provider credentials remain server-side. The production gateway should route these requests to Gemini multimodal video understanding.

Basic mode is intended for concise key-scene descriptions. Advanced mode is intended for richer scene-by-scene descriptions and timestamps and should use Gemini agentic video processing.

## Credits
- Basic: 4 AI credits.
- Advanced: 12 AI credits.
- Advanced mode requires an active Premium entitlement.
- Credit authorization should be atomic on the gateway/Supabase side and provider failure should not leave the user charged.

## Catalog
Supabase migration 20260926170000_audio_description_catalog.sql adds:
- audio_description_basic: FREE, 4 credits
- audio_description_advanced: CREDIT_BASED, tier 2+, 12 credits
