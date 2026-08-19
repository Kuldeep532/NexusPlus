# Nexus Plus

An accessible, offline-first Android reading companion with eBook/PDF playback, voice discovery, auto-TTS controls, and document utilities.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nexus-plus` — Expo Router mobile app and its local theme.
- `artifacts/nexus-plus/app/(tabs)/index.tsx` — home library and utility hub.
- `artifacts/nexus-plus/app/reader.tsx` — accessible playback screen.
- `artifacts/nexus-plus/app/voices.tsx` — offline voice library surface.
- `artifacts/nexus-plus/app/utilities.tsx` — document and audio utility surface.
- `artifacts/nexus-plus/app/(tabs)/settings.tsx` — voice and privacy settings.

## Architecture decisions

- The first build is frontend-only and offline-first; AsyncStorage/native device APIs are preferred for local persistence and processing.
- The package identifier is `com.nexuswavetech.nexusplus` and should not be changed without an explicit request.
- Dark, high-contrast teal/navy tokens are the product identity and are shared through the Expo local theme.

## Product

Nexus Plus helps people read and listen to local documents with large, TalkBack-friendly controls. The current app includes a home hub, playback controls, offline voice library UI, smart utility hub, settings, privacy messaging, and support contact.

## User preferences

The user wants a lightweight, strictly accessible Android app with zero data collection and support contact `kuldeepky538@gmail.com`.

## Gotchas

- Run `pnpm --filter @workspace/nexus-plus run typecheck` after Expo changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
