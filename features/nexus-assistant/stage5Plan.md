# Nexus Assistant — Stage 5

## Gateway integration

Nexus Assistant can use the existing authenticated API Gateway client for cloud enrichment. The app does not ship a Gemini API key and does not directly call a Gemini vendor URL.

Gemini responses are requested only when the local agent/action/weather path does not handle the request first. Weather requests are routed to a Gateway-discovered weather endpoint.

## Privacy boundary

Local chat remains stored in SQLite. Cloud Gemini/weather requests are an explicit cloud path and are visibly represented by runtime status. The Gateway remains responsible for vendor credentials.

## Legacy bridge audit

The NexusPlus repository contains the existing centralized `features/api-gateway/apiGatewayClient.ts` and productivity `geminiClient.ts`. Repository-wide search did not find a separate `Nexus Workforce` bridge implementation, so no speculative deletion was made.

## Assistant controls

- Voice Input toggle
- Open Live Mode toggle
- Dynamic primary control: microphone/Voice Input when the text box is empty; Send when text is present

Full native microphone capture, Piper synthesis and interruption/barge-in remain in the dedicated voice/live stage.
