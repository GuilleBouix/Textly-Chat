# Textly Chat - Chat dual con IA asistida

Documentacion tecnica del proyecto: stack, arquitectura de datos, seguridad aplicada en capa app y flujos funcionales.

## 1) Stack actual

- **Frontend/SSR**: Next.js 16.1.6 (App Router)
- **UI**: React 19.2.3 + Tailwind CSS v4
- **Backend de datos**: Supabase (Auth, Postgres, Realtime)
- **IA**: Google Gemini via route handler (`/api/improve`)
- **Seguridad app**: Zod + Upstash Redis + Upstash Ratelimit
- **Gestor de paquetes**: pnpm

## 2) Arquitectura de datos (Supabase)

### Tablas y columnas

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

## 3) Politicas RLS (exactas)

### `rooms`
- `rooms_delete` (DELETE): `(auth.uid() = participant_1) OR (auth.uid() = participant_2)`
- `rooms_insert` (INSERT, WITH CHECK): `auth.uid() = participant_1`
- `rooms_select` (SELECT): `(auth.uid() = participant_1) OR (auth.uid() = participant_2)`
- `rooms_select_open_for_join` (SELECT): `participant_2 IS NULL`
  - Esta policy permite descubrir salas abiertas para unirse.
- `rooms_update_unirse` (UPDATE):
  - USING: `(participant_2 IS NULL) AND (participant_1 <> auth.uid())`
  - WITH CHECK: `(participant_2 = auth.uid()) AND (participant_1 <> auth.uid())`

### `messages`
- `messages_insert` (INSERT, WITH CHECK): `auth.uid() = sender_id`
- `messages_select` (SELECT): solo si el usuario autenticado participa en la sala del mensaje

### `user_settings`
- `Users can insert own settings` (INSERT, WITH CHECK): `auth.uid() = user_id`
- `Users can update own settings` (UPDATE): `auth.uid() = user_id`
- `Users can view own settings` (SELECT): `auth.uid() = user_id`

## 4) Funciones y triggers

### Funciones
- `handle_new_user()`
- `handle_new_user_settings()`
- `set_updated_at_user_settings()`

### Trigger confirmado
- Tabla: `user_settings`
- Nombre: `on_update_user_settings`
- Evento: `UPDATE`
- Momento: `BEFORE`
- Definicion: `EXECUTE FUNCTION set_updated_at_user_settings()`

## 5) Hardening aplicado (Fase 1 - capa app)

- Validacion de payloads con Zod en endpoints sensibles.
- Rate limiting distribuido con Upstash en:
  - `POST /api/improve`
  - `POST /api/users/meta`
- Trazabilidad de request con `requestId`.
- Hash de IP para observabilidad sin exponer IP cruda.
- Logging estructurado de eventos de seguridad.
- Control de acceso en `/api/users/meta` por pertenencia de salas compartidas.
- Headers de seguridad globales en `next.config.ts`:
  - CSP
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - HSTS en produccion
- Proteccion de rutas con `middleware.ts` y excepciones de acceso publico.

## 6) Variables de entorno

### Requeridas
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

### Seguridad / Rate limit
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Opcionales
- `GEMINI_MODEL` (default: `gemini-2.5-flash`)
- `RATE_LIMIT_IMPROVE_MAX` (default: `20`)
- `RATE_LIMIT_META_MAX` (default: `60`)

## 7) Flujos funcionales actuales

### Chat en tiempo real
- Carga de salas y mensajes desde Supabase.
- Suscripciones realtime para nuevos mensajes.
- Envio de mensajes con validacion de sala activa.

### IA asistida
- Acciones soportadas: mejorar redaccion o traducir.
- Configuracion por usuario en `user_settings`:
  - `assistant_enabled`
  - `writing_mode`
  - `translation_language`
- Respuestas de error esperables:
  - `400` payload invalido
  - `401` no autenticado
  - `403` operacion no permitida
  - `429` limite excedido
  - `500` error interno

## 8) Endpoints principales

### `POST /api/improve`
- Input: `{ action: "improve" | "translate", text: string }`
- Reglas: `text` entre 1 y 1500 chars
- Seguridad: auth + zod + rate limit + logs estructurados

### `POST /api/users/meta`
- Input: `{ ids: string[] }` (UUID, max 50)
- Seguridad: auth + zod + rate limit + filtro por alcance de sala
- Devuelve solo usuarios autorizados por contexto de chat

## 9) Limitaciones / siguiente fase

Esta documentacion cubre el hardening aplicado en la capa app (frontend + route handlers).

El reforzamiento adicional en capa DB (fase 2), como endurecimiento extra de politicas o funciones SQL complementarias, se documentara cuando se implemente.
