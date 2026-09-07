# External Gemini Video Gateway Contract

This repository does not contain the Cloudflare Worker implementation or provider credentials.

NexusPlus expects an external authenticated Gateway endpoint:

`POST /ai/video/understand`

Request JSON:

```json
{
  "media": {
    "uri": "<provider-accessible media URI>",
    "mimeType": "video/mp4",
    "displayName": "NexusPlus video"
  },
  "prompt": "Describe the important events in this video and answer the user's question.",
  "multimodal": true,
  "processing": "agentic",
  "responseFormat": "text"
}
```

Expected JSON response:

```json
{
  "text": "<grounded multimodal answer>",
  "mediaName": "optional provider media name"
}
```

The external Worker is responsible for:

1. Authenticating the Supabase bearer token.
2. Enforcing IP and user rate limits.
3. Accepting or staging the media upload without exposing provider API keys.
4. Uploading the media to the configured Gemini Files/media API.
5. Waiting for provider media processing when required.
6. Calling the Gemini multimodal generation endpoint with the uploaded media reference plus the prompt.
7. Returning only the generated text and non-secret media metadata to NexusPlus.
8. Deleting or expiring temporary provider media according to the provider retention policy.
9. Returning actionable 4xx/5xx errors rather than fabricating a transcript or answer.

The client must not send Gemini API keys, Cloudflare secrets, or provider-specific credentials.

For large videos, the Worker should prefer provider-side file/media references over repeatedly embedding the binary in generation requests. The app-facing contract intentionally remains provider-neutral while the Worker owns Gemini-specific details.
