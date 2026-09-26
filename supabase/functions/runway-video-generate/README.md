# Runway Video Generator

Set the Supabase Edge Function secret to either:

- RUNWAY_API_KEY
- RUNWAYML_API_SECRET

The mobile app never receives the Runway secret. It calls this authenticated Edge Function with the user's Supabase access token.

The function validates the session, creates a Runway task, polls the task until completion, and returns the generated video URL.
