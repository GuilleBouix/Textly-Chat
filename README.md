# Informe de Proyecto: Chat Dual con Redaccion Asistida (IA)

Este documento describe la logica, la arquitectura de datos y el flujo de trabajo de la aplicacion.

## 1. Stack tecnologico

- **Framework:** Next.js 15 (App Router)
- **Estilos:** Tailwind CSS
- **Base de datos y tiempo real:** Supabase
- **IA:** Google Gemini 1.5 Flash (via Route Handler seguro)
- **Autenticacion:** Supabase Auth (Google Provider)

## 2. Arquitectura de datos (Supabase)

Se usan dos tablas principales con **RLS (Row Level Security)** activado para garantizar que cada usuario solo acceda a sus datos.

### `rooms` (salas de chat)

- `id`: identificador unico (`UUID`)
- `created_at`: fecha de creacion
- `participant_1`: ID del primer usuario
- `participant_2`: ID del segundo usuario

**Politica de seguridad:** solo los participantes de la sala pueden leer su fila.

### `messages` (mensajes)

- `id`: identificador unico
- `room_id`: clave foranea hacia la sala
- `sender_id`: ID del usuario que envia
- `content`: texto del mensaje
- `created_at`: timestamp con zona horaria

**Politica de seguridad:** un usuario solo puede insertar mensajes con su propio `sender_id`.

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

## 6. Experiencia de usuario (UX)

- **Bloqueo preventivo:** mientras la IA genera sugerencia, el input se bloquea para evitar conflictos de edicion.
- **Manejo de errores:** si la IA falla, el input se desbloquea y el usuario puede enviar el texto original sin perdida.
