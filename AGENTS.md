# AGENTS.md - Textly Chat Development Guide

## Project Overview
- **Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (auth, database, realtime)
- **AI**: Google Gemini API for message improvement
- **Package Manager**: pnpm (see pnpm-lock.yaml)

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

**Running a single test**: No test framework is currently configured. To add tests:
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

## Code Style Guidelines

### General
- Use ESLint with `eslint-config-next` (core-web-vitals + typescript)
- Run `pnpm lint` before committing
- TypeScript strict mode is enabled

### Imports
- Use path aliases from `tsconfig.json` (none configured currently)
- Relative imports for local modules: `../lib/supabaseClient`
- Third-party imports first, then local:
```typescript
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Mensaje, Sala } from "../types/database";
```

### Formatting
- 2-space indentation
- Use Prettier defaults (single quotes, trailing commas)
- Tailwind CSS classes for all styling (see Tailwind v4 syntax)

### Naming Conventions
- **Components**: PascalCase (`Sidebar.tsx`, `Modal.tsx`)
- **Hooks**: camelCase with `use` prefix (`useChat.ts`)
- **Types/Interfaces**: PascalCase (`UsuarioSupabase`, `Sala`)
- **Variables/Functions**: camelCase
- **Files**: kebab-case for utilities, PascalCase for components

### TypeScript
- Always type function parameters and return values
- Use explicit types for interfaces matching Supabase schema
- Use `any` sparingly; prefer `unknown` when type is uncertain

### React Patterns
- Use `"use client"` directive for client components (see `app/components/Sidebar.tsx`)
- Prefer function components with hooks over class components
- Use `ref` for mutable values that don't trigger re-renders
- Handle loading/error states explicitly

### Error Handling
- API routes: Return `NextResponse.json({ error: "..." }, { status: ... })`
- Client-side: Use try/catch with user-friendly error messages
- Supabase errors: Check `error` object from destructured responses
- Log errors to console with context: `console.error("ACTION:", { detail: error })`

### Next.js App Router
- Route handlers in `app/api/[route]/route.ts`
- Server components by default, `"use client"` for interactivity
- Use Next.js middleware (`middleware.ts`) for auth redirects

### Supabase Patterns
- Use `@supabase/ssr` for server-side client
- Use `@supabase/supabase-js` for client-side
- Always handle potential `null` from queries (`.maybeSingle()`, `.or()`)
- Subscribe to realtime channels with proper cleanup in `useEffect` return

---

## Project Structure

```
app/
├── api/                  # Next.js API routes
│   ├── improve/         # AI message improvement
│   └── users/meta/      # User profile fetching
├── auth/callback/        # OAuth callback handler
├── components/          # React components (Sidebar, Modal)
├── hooks/               # Custom hooks (useChat)
├── lib/                 # Utilities (supabaseClient)
├── types/               # TypeScript interfaces (database.ts)
├── layout.tsx           # Root layout
├── login/page.tsx       # Login page
└── page.tsx             # Main chat page

middleware.ts            # Auth protection middleware
```

---

## Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional, defaults to `gemini-2.5-flash`)

---

## Database Schema (Supabase)

### Tables

#### `profiles`
| Column     | Type      | Description                    |
|------------|-----------|--------------------------------|
| id         | uuid      | FK to auth.users (PK)         |
| email      | text      | User email (UNIQUE NOT NULL)  |
| username   | text      | Username                      |
| created_at | timestamptz | Creation timestamp          |

#### `rooms`
| Column         | Type      | Description                          |
|----------------|-----------|--------------------------------------|
| id             | uuid      | Primary key (gen_random_uuid)        |
| room_name      | text      | Optional room name                   |
| participant_1  | uuid      | FK to profiles (first participant)   |
| participant_2  | uuid      | FK to profiles (second participant)  |
| created_at     | timestamptz | Creation timestamp                |

**Constraints:** UNIQUE(participant_1, participant_2), CHECK (participant_1 != participant_2)

#### `messages`
| Column    | Type      | Description                    |
|-----------|-----------|--------------------------------|
| id        | uuid      | Primary key                    |
| room_id   | uuid      | FK to rooms (CASCADE delete)   |
| sender_id | uuid      | FK to profiles                 |
| content   | text      | Message text                   |
| created_at| timestamptz | Creation timestamp          |

### Functions & Triggers
- **handle_new_user()**: Creates profile automatically on user registration
- **Trigger on_auth_user_created**: Executes after INSERT on auth.users

### RLS Policies

- **profiles SELECT**: All authenticated users can view
- **profiles UPDATE**: Only own profile
- **rooms SELECT**: Only participants can view
- **rooms INSERT**: Any authenticated user
- **rooms DELETE**: Only participants
- **messages SELECT**: Only room participants can read
- **messages INSERT**: Only with your own sender_id

---

## Common Patterns

### Client Component with Props
```typescript
"use client";
import { TypeA, TypeB } from "../types/database";

interface Props {
  propA: TypeA;
  propB: TypeB;
}

export default function Component({ propA, propB }: Props) {
  // component code
}
```

### API Route Handler
```typescript
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // validation
    // logic
    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error("ROUTE_ERROR:", error);
    return NextResponse.json(
      { error: "User-friendly message" },
      { status: 500 }
    );
  }
}
```

### Supabase Query with Error Handling
```typescript
const { data, error } = await supabase
  .from("table")
  .select("*")
  .eq("field", value);

if (error) {
  console.error("Query error:", error);
  return;
}
```

---

## Notes for Agents
- This is a Spanish-language chat application
- Some variables/functions use Spanish names (e.g., `crearSala`, `mensajes`)
- Maintain existing naming conventions when modifying code
- Tailwind v4 uses CSS-native `@import "tailwindcss"` instead of `@tailwind` directives
