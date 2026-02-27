# AGENTS.md - Textly Chat Development Guide

## Project Overview
- **Stack**: Next.js 16.1.6, React 19.2.3, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (Auth, Postgres, Realtime)
- **AI**: Google Gemini via `app/api/improve/route.ts`
- **Security (App Layer)**: Zod, Upstash Redis, Upstash Ratelimit
- **Package Manager**: pnpm

---

## Build / Lint / Test Commands

```bash
# Development
pnpm dev          # Start Next.js dev server (http://localhost:3000)

# Production
pnpm build        # Production build
pnpm start        # Start production server

# Linting
pnpm lint         # Run ESLint on entire project
pnpm lint <path>  # Lint specific file/directory
```

**Tests**: No test framework is currently configured.

Recommended smoke checks before merge:
- `pnpm lint`
- `pnpm build`

---

## Code Style Guidelines

### General
- Use ESLint with `eslint-config-next` (core-web-vitals + typescript)
- Run `pnpm lint` before committing
- TypeScript strict mode is enabled

### Imports
- Third-party imports first, then local imports
- Use relative imports for local modules (no tsconfig path alias configured)

### Formatting
- 2-space indentation
- Prettier defaults
- Tailwind utility classes for styling

### Naming Conventions
- **Components**: PascalCase (`Sidebar.tsx`, `Modal.tsx`)
- **Hooks**: camelCase with `use` prefix (`useChat.ts`)
- **Types/Interfaces**: PascalCase (`UserSettings`, `Sala`)
- **Variables/Functions**: camelCase
- **Files**: kebab-case for utilities, PascalCase for components

### TypeScript
- Type all function parameters and return values
- Prefer explicit types for Supabase data contracts
- Avoid `any`; use `unknown` when uncertain

### API Route Handling (Security)
- Validate payloads with Zod using `safeParse`
- Return neutral error messages (do not leak internal details)
- Use structured security logs for sensitive route events
- Apply rate limiting to sensitive endpoints:
  - `/api/improve`
  - `/api/users/meta`

### Next.js Security Patterns
- Global security headers configured in `next.config.ts`:
  - CSP
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - HSTS in production
- Route protection via `middleware.ts` with public exceptions:
  - `/login`
  - `/auth/callback`

### Supabase Patterns
- `@supabase/ssr` for server/client SSR-aware auth clients
- `@supabase/supabase-js` for admin/service role access where needed
- Handle nullable queries explicitly (`maybeSingle`)
- Cleanup realtime channels in `useEffect` return

---

## Project Structure

```text
app/
  api/
    improve/route.ts         # AI improve/translate endpoint
    users/meta/route.ts      # User metadata endpoint (room-scoped authorization)
  auth/callback/route.ts     # OAuth callback
  components/                # UI components
  hooks/                     # useAuth, useChat, useMensajes, useRooms
  lib/
    avatar.ts
    supabaseClient.ts
    utils.ts
    security/
      schemas.ts             # Zod schemas for route payloads
      request.ts             # Request context (ip hash, request id)
      rate-limit.ts          # Upstash rate limiter wrapper
      logger.ts              # Structured security event logging
  types/database.ts          # TypeScript DB contracts
  layout.tsx
  login/page.tsx
  page.tsx

middleware.ts                # Route protection / auth redirects
next.config.ts               # Security headers + image config
```

---

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

Security / Rate limiting:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional:
- `GEMINI_MODEL` (default `gemini-2.5-flash`)
- `RATE_LIMIT_IMPROVE_MAX` (default `20`)
- `RATE_LIMIT_META_MAX` (default `60`)

---

## Database Schema (Supabase)

### Tables

#### `profiles`
| Column     | Type                     |
|------------|--------------------------|
| id         | uuid                     |
| username   | text                     |
| email      | text                     |
| created_at | timestamp with time zone |

#### `rooms`
| Column        | Type                     |
|---------------|--------------------------|
| id            | uuid                     |
| room_name     | text                     |
| share_code    | text                     |
| participant_1 | uuid                     |
| participant_2 | uuid                     |
| created_at    | timestamp with time zone |

#### `messages`
| Column     | Type                     |
|------------|--------------------------|
| id         | uuid                     |
| room_id    | uuid                     |
| sender_id  | uuid                     |
| content    | text                     |
| created_at | timestamp with time zone |

#### `user_settings`
| Column               | Type                     |
|----------------------|--------------------------|
| user_id              | uuid                     |
| assistant_enabled    | boolean                  |
| writing_mode         | text                     |
| translation_language | text                     |
| created_at           | timestamp with time zone |
| updated_at           | timestamp with time zone |

### RLS Policies (exact names)

- `rooms_delete` (DELETE): `(auth.uid() = participant_1) OR (auth.uid() = participant_2)`
- `rooms_insert` (INSERT, WITH CHECK): `auth.uid() = participant_1`
- `rooms_select` (SELECT): `(auth.uid() = participant_1) OR (auth.uid() = participant_2)`
- `rooms_select_open_for_join` (SELECT): `participant_2 IS NULL`
- `rooms_update_unirse` (UPDATE):
  - USING: `(participant_2 IS NULL) AND (participant_1 <> auth.uid())`
  - WITH CHECK: `(participant_2 = auth.uid()) AND (participant_1 <> auth.uid())`
- `messages_insert` (INSERT, WITH CHECK): `auth.uid() = sender_id`
- `messages_select` (SELECT): participant must belong to message room
- `Users can insert own settings` (INSERT, WITH CHECK): `auth.uid() = user_id`
- `Users can update own settings` (UPDATE): `auth.uid() = user_id`
- `Users can view own settings` (SELECT): `auth.uid() = user_id`

### Functions
- `handle_new_user()`
- `handle_new_user_settings()`
- `set_updated_at_user_settings()`

### Triggers
- `on_update_user_settings`
  - Table: `user_settings`
  - Timing: `BEFORE UPDATE`
  - Definition: `EXECUTE FUNCTION set_updated_at_user_settings()`

---

## API Contracts (current)

### `POST /api/improve`
- Input: `{ action: "improve" | "translate", text: string (1..1500) }`
- Validation: Zod
- Possible status codes: `200`, `400`, `401`, `403`, `429`, `500`

### `POST /api/users/meta`
- Input: `{ ids: string[] }` where `ids` are UUID, max 50
- Authorization: only returns users that share room scope with requester
- Possible status codes: `200`, `400`, `401`, `429`, `500`

---

## Notes for Agents
- App language is Spanish
- Some code identifiers are Spanish (`crearSala`, `mensajes`, etc.)
- Keep naming conventions consistent with existing code
- Do not document DB objects not confirmed in project context
