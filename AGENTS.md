# AGENTS.md - Textly Chat

## Overview

Textly Chat is a 1:1 chat application with contact request flow, real-time messaging via Supabase, and AI-powered text improvement using Gemini. Built with Next.js (App Router), React 19, TypeScript, Tailwind CSS, and Supabase.

## Project Structure

```
textly-chat/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── improve/       # Gemini AI text improvement
│   │   └── users/meta/    # User metadata from auth
│   ├── auth/callback/     # Auth callback handler
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks (useChat orchestrates)
│   ├── lib/               # Utilities (Supabase client, debug)
│   ├── services/          # Business logic (auth, rooms, messages, friendships, profiles)
│   ├── login/             # Login page
│   ├── types/             # TypeScript type definitions
│   └── page.tsx           # Main chat page
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── README.md
```

## Services (Business Logic)

The `app/services/` folder contains pure business logic separated from React:

- **authService.ts**: Authentication (getCurrentUser, signOut)
- **roomsService.ts**: Rooms CRUD (getRooms, createRoom, deleteRoom)
- **messagesService.ts**: Messages CRUD (getByRoom, createMessage, subscribe)
- **friendshipsService.ts**: Friendships CRUD + realtime subscriptions
- **profilesService.ts**: Profiles (public + auth metadata, search)

The `useChat` hook in `app/hooks/useChat.ts` orchestrates these services.

## Commands

```bash
# Development
pnpm dev          # Start Next.js dev server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server

# Linting & Type Checking
pnpm lint         # Run ESLint
pnpm exec tsc --noEmit  # TypeScript type check

# No test framework configured currently
```

### Running a Single Test

Currently there is **no test framework** configured. If you need to add tests:

```bash
# Install Vitest (recommended for Next.js)
pnpm add -D vitest @vitejs/plugin-react

# Run single test file
pnpm vitest run path/to/testfile.test.ts

# Run tests in watch mode
pnpm vitest
```

## Code Style Guidelines

### General

- Use **Spanish** for user-facing strings (e.g., "Buscar Contactos", "Aceptar")
- Use **Spanish** for internal naming (variables, functions) to match existing codebase convention
- Prefer **functional components** with hooks over class components
- Use `"use client"` directive for any component using client-side state/hooks

### TypeScript

- **Always enable strict mode** - keep `strict: true` in tsconfig.json
- **Explicit return types** for functions where beneficial (especially hooks, API routes)
- **Use interfaces** for object shapes, `type` for unions/aliases
- **Avoid `any`** - use `unknown` when type is truly unknown, then narrow with type guards

```typescript
// Good
interface Props {
  usuario: UsuarioSupabase | null;
  onSelect: (id: string) => void;
}

// Error handling with type guards
if (error && typeof error === "object") {
  const maybeError = error as { code?: string; message?: string };
  console.error(maybeError.message);
}
```

### Naming Conventions

- **Components**: PascalCase (`Sidebar.tsx`, `Modal.tsx`)
- **Hooks**: camelCase with `use` prefix (`useChat.ts`)
- **Types/Interfaces**: PascalCase (`UsuarioSupabase`, `Perfil`)
- **Variables/Functions**: camelCase (Spanish: `agregarAmigo`, `solicitudesPendientes`)
- **Files**: kebab-case (except components/hooks)

### Imports

- Use path alias `@/` for internal imports
- Group imports in this order: external → internal → types
- Use explicit named imports

```typescript
// External
import { useEffect, useState } from "react";
import { supabase } from "@supabase/ssr";

// Internal
import { Sala, UsuarioSupabase } from "../types/database";
import { supabase } from "../lib/supabaseClient";

// Components
import Sidebar from "../components/Sidebar";
```

### Formatting

- Use **2 spaces** for indentation
- **Single quotes** for strings in JSX, double quotes for HTML attributes
- **Trailing commas** in arrays and objects
- **No semicolons** at end of statements
- Use **Prettier** for formatting (configure in `.prettierrc`)

```tsx
// Good
const ProfileCard = ({ username, avatarUrl }: Props) => (
  <div className="flex items-center gap-3">
    <img src={avatarUrl} alt={username} className="h-10 w-10 rounded-full" />
    <p className="text-sm font-bold">{username}</p>
  </div>
);
```

### React Patterns

- Destructure props with explicit typing
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive computations
- Prefer early returns for conditionals

```typescript
// Good
export default function ChatRoom({
  usuario,
  salas,
  idSalaActiva,
}: ChatRoomProps) {
  if (!usuario) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="flex h-full">
      {/* content */}
    </div>
  );
}
```

### Error Handling

- Use try/catch for async operations
- Log errors with descriptive scope prefix
- Use user-friendly error messages in UI
- Handle Supabase errors with type guards

```typescript
const debugError = (scope: string, error: unknown) => {
  if (error && typeof error === "object") {
    const maybeError = error as { code?: string; message?: string };
    console.error("[chat-error]", scope, maybeError.message);
    return;
  }
  console.error("[chat-error]", scope, error);
};

// Usage
try {
  const { error } = await supabase.from("messages").insert(payload);
  if (error) throw error;
} catch (err) {
  debugError("messages.insert", err);
  alert("No se pudo enviar el mensaje.");
}
```

### Tailwind CSS

- Use Tailwind v4 syntax (no `@apply` for custom utilities if possible)
- Use **zinc** color palette (matches existing design)
- Use semantic class names for clarity
- Prefer **flex** and **grid** for layouts
- Use `group-*` variants for hover effects on children

```tsx
// Good
<button
  onClick={onClick}
  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-500"
>
  {children}
</button>
```

### API Routes

- Use Next.js App Router conventions (`route.ts`)
- Use `NextResponse` for responses
- Validate input with Zod if needed
- Keep API keys server-side only

```typescript
// app/api/improve/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    // ... implementation
    return NextResponse.json({ improvedText });
  } catch (error) {
    return NextResponse.json({ error: "Failed to improve text" }, { status: 500 });
  }
}
```

### Supabase Patterns

- Use `@supabase/ssr` for client-side Supabase
- Use type-safe queries with TypeScript
- Handle realtime subscriptions with cleanup in `useEffect` return

```typescript
// Subscription cleanup
useEffect(() => {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, handleNewMessage)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}, [roomId]);
```

### ESLint Configuration

The project uses `eslint-config-next` with TypeScript support. Run `pnpm lint` before committing.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

## Known Issues

- `app/api/users/meta/route.ts:73` has an implicit `any` type that should be fixed for full TypeScript compliance
