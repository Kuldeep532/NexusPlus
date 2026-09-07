# Cloudflare video backend contract

The Cloudflare Worker is maintained outside NexusPlus. This document records the expected server-side contract only; it is not bundled or executed by the Android app.

## Required endpoints

### POST /v1/media/upload
Authenticated raw media upload.

Request headers:
- Authorization: Bearer <Supabase access token>
- X-File-Mime-Type: video/*
- Content-Type: video/*

Response:
```json
{
  "success": true,
  "file": {
    "name": "files/…",
    "uri": "https://…"
  }
}
```

### POST /v1/media/understand
Authenticated multimodal video understanding request. The Worker should accept a previously uploaded Gemini file reference and a user prompt, then call the configured Gemini model server-side.

Request:
```json
{
  "file": "files/…",
  "prompt": "Summarize this video and list the important events with timestamps."
}
```

Recommended Worker-side provider call shape:
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "file_data": {
            "mime_type": "video/mp4",
            "file_uri": "files/…"
          }
        },
        {
          "text": "Summarize this video and list the important events with timestamps."
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.2,
    "maxOutputTokens": 1500
  }
}
```

The exact Gemini REST model path/version is a Worker configuration detail and must not be hard-coded into the Android app.

## Safety requirements

- Keep Gemini API keys and provider credentials exclusively in Cloudflare Worker secrets/vars.
- Authenticate the caller against Supabase before accepting upload or understanding requests.
- Enforce a media size limit and validate `video/*` MIME types server-side.
- Apply both client/IP and authenticated-user rate limits.
- Do not log raw video content or full prompts containing user-private media unnecessarily.
- Return only the generated text plus optional provider metadata to the app.
- Use timeouts and explicit upstream error mapping.

## Important distinction

This contract belongs to the external Cloudflare Worker. NexusPlus only calls the public Gateway contract. The Worker source itself is intentionally not copied into the mobile repository.
