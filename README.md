# Textly Chat: Chat Dual con IA Asistida.

Este documento describe la logica, la arquitectura de datos y el flujo de trabajo de la aplicacion.

## 1. Stack tecnologico

- **Framework:** Next.js 15 (App Router)
- **Estilos:** Tailwind CSS
- **Base de datos y tiempo real:** Supabase
- **IA:** Google Gemini 1.5 Flash (via Route Handler seguro)
- **Autenticacion:** Supabase Auth (Google Provider)

## 2. Arquitectura de datos (Supabase)

Se usan tres tablas principales con **RLS (Row Level Security)** activado para garantizar que cada usuario solo acceda a sus datos.

### `profiles` (perfiles de usuario)

- `id`: UUID (FK a auth.users, PK)
- `email`: email del usuario (UNIQUE NOT NULL)
- `username`: nombre de usuario
- `created_at`: fecha de creacion

### `rooms` (salas de chat)

- `id`: UUID unico
- `room_name`: nombre de la sala (opcional)
- `participant_1`: UUID del primer participante (FK a profiles)
- `participant_2`: UUID del segundo participante (FK a profiles)
- `created_at`: fecha de creacion

**Restricciones:**
- UNIQUE(participant_1, participant_2)
- CHECK (participant_1 != participant_2)

### `messages` (mensajes)

- `id`: UUID unico
- `room_id`: clave foranea hacia la sala
- `sender_id`: ID del usuario que envia (FK a profiles)
- `content`: texto del mensaje
- `created_at`: timestamp con zona horaria

### Funciones y Triggers

- **handle_new_user()**: Funcion que crea automaticamente un perfil al registrarse el usuario en auth.users
- **Trigger on_auth_user_created**: Ejecuta handle_new_user() despues de cada INSERT en auth.users

### Politicas de seguridad (RLS)

**profiles:**
- SELECT: cualquier usuario autenticado puede ver perfiles
- UPDATE: solo puedes actualizar tu propio perfil

**rooms:**
- SELECT: solo participantes de la sala pueden ver
- INSERT: cualquier usuario autenticado puede crear
- DELETE: solo participantes pueden borrar

**messages:**
- SELECT: solo participantes de la sala pueden leer
- INSERT: solo puedes enviar con tu propio sender_id

## 3. Funciones principales y flujos logicos

### A) Comunicacion en tiempo real

- **Envio optimista:** al presionar "Enviar", el mensaje aparece de inmediato en UI mientras se persiste en la base de datos.
- **Suscripcion realtime:** la app escucha nuevos `INSERT` en `messages`; si `sender_id` no coincide con el usuario actual, renderiza el mensaje entrante.
- **Indicador de escritura:** se utiliza Supabase Broadcast para eventos efimeros de "esta escribiendo..." sin escribir en base de datos.

### B) Funcion de mejora de redaccion (IA)

1. El usuario escribe en el input y activa la mejora con boton "IA" (o atajo).
2. El texto se envia a un Route Handler interno de Next.js para proteger la API Key.
3. Se guarda un respaldo temporal del texto original (`backup state`).
4. La IA devuelve una sugerencia de redaccion.
5. El usuario puede:
   - **Aceptar:** reemplaza el input por la sugerencia.
   - **Rechazar / `Esc`:** descarta la sugerencia y restaura el texto original.

## 4. Configuracion de IA (Prompt Engineering)

El sistema usa un prompt oculto para que Gemini actue como herramienta de correccion, no como chat:

```text
Eres un corrector de estilo profesional. Tu unica tarea es recibir un mensaje y devolver una version mas clara, profesional y sin errores gramaticales. NO respondas con saludos ni explicaciones. Solo devuelve el texto corregido. Si el texto no puede mejorarse, devuelvelo exactamente igual.
```

## 5. Medidas de seguridad clave

- **Proteccion de API Key:** la clave de Gemini nunca se expone al navegador; permanece en servidor.
- **Validacion de sesion:** antes de procesar texto con IA, el backend verifica sesion activa en Supabase.
- **RLS en base de datos:** las politicas SQL impiden leer mensajes ajenos sin credenciales validas de participante.
- **Rate limiting distribuido:** Upstash Redis limita abuso en `/api/improve` y `/api/users/meta`.
- **Validacion de payloads:** Zod valida entradas en endpoints sensibles.
- **Autorizacion de metadata:** `/api/users/meta` solo devuelve usuarios que comparten sala con el solicitante.

## 6. Variables de entorno

Requeridas:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

Nuevas para seguridad/rate limit:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Opcionales:
- `GEMINI_MODEL` (default: `gemini-2.5-flash`)
- `RATE_LIMIT_IMPROVE_MAX` (default: `20`)
- `RATE_LIMIT_META_MAX` (default: `60`)

## 7. Experiencia de usuario (UX)

- **Bloqueo preventivo:** mientras la IA genera sugerencia, el input se bloquea para evitar conflictos de edicion.
- **Manejo de errores:** si la IA falla, el input se desbloquea y el usuario puede enviar el texto original sin perdida.
