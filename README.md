# Textly Chat

Aplicacion de chat en tiempo real con salas privadas de 2 participantes y asistente de IA para mejorar o traducir mensajes.

## Caracteristicas

- Chat en tiempo real con Supabase Realtime.
- Salas con `share_code` para unirse facilmente.
- Autenticacion con Google (Supabase Auth).
- Asistente de IA por usuario:
  - Mejorar redaccion.
  - Traducir mensajes.
  - Configuracion persistente en `user_settings`.
- Seguridad de capa app implementada:
  - Validacion de payloads con Zod.
  - Rate limiting distribuido (Upstash) en endpoints sensibles.
  - Control de acceso en `/api/users/meta` por alcance de sala.
  - Security headers globales (CSP, XFO, nosniff, etc.).

## Tecnologias

- Next.js 16.1.6 (App Router)
- React 19.2.3
- TypeScript
- Tailwind CSS v4
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Google Gemini (`@google/generative-ai`)
- Zod
- Upstash Redis + Upstash Ratelimit

## Requisitos previos

- Node.js 18+
- pnpm
- Proyecto en Supabase
- Cuenta/credenciales de Google OAuth configuradas en Supabase
- (Produccion recomendada) Upstash Redis

## Instalacion

1. Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/textly-chat.git
cd textly-chat
```

2. Instala dependencias:

```bash
pnpm install
```

3. Crea `.env.local` en la raiz y agrega variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=

# opcional
GEMINI_MODEL=gemini-2.5-flash
RATE_LIMIT_IMPROVE_MAX=20
RATE_LIMIT_META_MAX=60

# recomendado para rate limit distribuido
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Scripts

| Comando | Descripcion |
|---|---|
| `pnpm dev` | Inicia entorno local |
| `pnpm build` | Build de produccion |
| `pnpm start` | Ejecuta build de produccion |
| `pnpm lint` | Ejecuta ESLint |

## Uso

Inicia desarrollo:

```bash
pnpm dev
```

App disponible en `http://localhost:3000`.

Flujo principal:
- Login con Google.
- Crear sala o unirse con codigo.
- Enviar mensajes en tiempo real.
- Usar IA para mejorar/traducir segun `user_settings`.

## Estructura del proyecto

```text
app/
  api/
    improve/route.ts
    users/meta/route.ts
  auth/callback/route.ts
  components/
    chat/
    sidebar/
    skeletons/
    ui/
  hooks/
    useAuth.ts
    useChat.ts
    useMensajes.ts
    useRooms.ts
  lib/
    avatar.ts
    supabaseClient.ts
    utils.ts
    security/
      logger.ts
      rate-limit.ts
      request.ts
      schemas.ts
  types/database.ts
  layout.tsx
  login/page.tsx
  page.tsx

middleware.ts
next.config.ts
```

## Endpoints principales

### `POST /api/improve`

Input:

```json
{ "action": "improve" | "translate", "text": "..." }
```

Reglas:
- `text`: 1..1500 caracteres.
- Requiere sesion.
- Aplica rate limit.

Respuestas comunes:
- `200`, `400`, `401`, `403`, `429`, `500`.

### `POST /api/users/meta`

Input:

```json
{ "ids": ["uuid", "uuid"] }
```

Reglas:
- Maximo 50 IDs.
- UUID valido.
- Solo devuelve usuarios autorizados por alcance de sala compartida.
- Aplica rate limit.

Respuestas comunes:
- `200`, `400`, `401`, `429`, `500`.

## Supabase (schema actual)

### Tablas

- `profiles`: `id`, `username`, `email`, `created_at`
- `rooms`: `id`, `room_name`, `share_code`, `participant_1`, `participant_2`, `created_at`
- `messages`: `id`, `room_id`, `sender_id`, `content`, `created_at`
- `user_settings`: `user_id`, `assistant_enabled`, `writing_mode`, `translation_language`, `created_at`, `updated_at`

### Policies RLS (nombres exactos)

- `rooms_delete`
- `rooms_insert`
- `rooms_select`
- `rooms_select_open_for_join`
- `rooms_update_unirse`
- `messages_insert`
- `messages_select`
- `Users can insert own settings`
- `Users can update own settings`
- `Users can view own settings`

### Funciones y trigger confirmados

- `handle_new_user()`
- `handle_new_user_settings()`
- `set_updated_at_user_settings()`
- Trigger: `on_update_user_settings` (`BEFORE UPDATE` en `user_settings`)

## Seguridad

Hardening de capa app ya aplicado:
- Zod en validacion de inputs sensibles.
- Rate limiting distribuido con Upstash.
- Hash de IP + request ID para trazabilidad.
- Logging estructurado para eventos de seguridad.
- Security headers globales.
- Middleware de rutas privadas/publicas.

## Capturas

## Licencia

Este proyecto se distribuye como proyecto personal de practica.
