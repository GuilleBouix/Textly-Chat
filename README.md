# Textly Chat

Aplicacion de chat 1:1 con flujo de contactos por solicitud, tiempo real con Supabase y mejora de redaccion con IA.

## Stack

- Next.js (App Router)
- React + Tailwind CSS
- Supabase (Auth, Postgres, Realtime, RLS)
- Gemini via route handler interno (`/api/improve`)

## Funcionalidades implementadas

- Busqueda de usuarios por `username`.
- Envio de solicitud de contacto (estado `pending`).
- Aceptacion de solicitud por el receptor (pasa a `accepted`).
- Creacion de chat (`rooms`) solo cuando la solicitud se acepta.
- Mensajeria en tiempo real por sala (`messages`).
- Insercion visible inmediata al enviar mensaje + deduplicacion por Realtime.
- Perfiles enriquecidos con metadata de `auth.users` (nombre/foto) mediante `/api/users/meta`.
- Avatares en:
  - Sidebar (usuario actual, solicitudes y lista de chats)
  - Header del chat
  - Burbujas de mensajes (alineado arriba del globo)
- Indicador flotante de IA sobre el input con spinner + puntos animados.
- Scrollbar de chat estilizada (`.custom-scrollbar`).

## Flujo de contactos y chat

1. Usuario A busca a Usuario B en el modal de contactos.
2. Al pulsar `Solicitar`, se inserta una fila en `friendships` con `status='pending'`.
3. Usuario B ve la solicitud en Sidebar > `Solicitudes`.
4. Usuario B pulsa `Aceptar`.
5. Se actualiza `friendships.status='accepted'`.
6. Se crea (o recupera) la `room` 1:1 y se activa en UI.
7. Ambos usuarios pueden enviar/recibir mensajes en `messages`.

## Arquitectura actual de cliente

### Hook principal

- `app/hooks/useChat.ts`
  - Estado global de chat (usuario, salas, sala activa, mensajes, perfiles, solicitudes).
  - Carga de perfiles de `profiles` + metadata de `auth.users` (`/api/users/meta`).
  - Suscripciones realtime para:
    - `messages` por sala activa
    - `friendships` recibidas por usuario
  - Acciones principales:
    - `buscarUsuarios`
    - `agregarAmigo` (envia solicitud `pending`)
    - `aceptarSolicitud`
    - `enviarMensaje`
    - `eliminarSala`
    - `mejorarMensajeIA`
    - `cerrarSesion`

### UI principal

- `app/page.tsx`
  - Layout principal del chat.
  - Header con avatar/nombre del contacto activo.
  - Lista de mensajes con avatar por emisor.
  - Footer con input, envio y boton IA.
  - Banner flotante de carga cuando IA corrige mensaje.

### Sidebar

- `app/components/Sidebar.tsx`
  - Perfil del usuario logueado.
  - Seccion `Solicitudes` con boton `Aceptar`.
  - Seccion `Mis Chats`.

### Busqueda

- `app/components/UserSearch.tsx`
  - Busca por username.
  - Boton `Solicitar` para enviar request de amistad.

## API routes internas

- `app/api/improve/route.ts`
  - Recibe texto y devuelve `improvedText` usando Gemini.
  - La API key se mantiene del lado servidor.

- `app/api/users/meta/route.ts`
  - Recibe lista de IDs.
  - Devuelve metadata de auth (`nombre`, `avatarUrl`, `email`) para enriquecer UI.

## Esquema de base de datos (actual)

```sql
-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  username text,
  created_at timestamptz default now()
);

-- FRIENDSHIPS
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'blocked')) default 'pending',
  created_at timestamptz default now(),
  unique (sender_id, receiver_id)
);

-- ROOMS
create table if not exists public.rooms (
  id uuid default gen_random_uuid() primary key,
  participant_1 uuid references public.profiles(id) on delete cascade not null,
  participant_2 uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (participant_1, participant_2)
);

-- MESSAGES
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamptz default now()
);
```

## RLS (politicas)

```sql
-- PROFILES
alter table public.profiles enable row level security;

drop policy if exists "Perfiles visibles para todos" on public.profiles;
drop policy if exists "Dueño edita perfil" on public.profiles;

create policy "Perfiles visibles para todos"
on public.profiles
for select
to authenticated
using (true);

create policy "Dueño edita perfil"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- FRIENDSHIPS
alter table public.friendships enable row level security;

drop policy if exists "Ver mis solicitudes" on public.friendships;
drop policy if exists "Enviar solicitud" on public.friendships;
drop policy if exists "Gestionar solicitud" on public.friendships;

create policy "Ver mis solicitudes"
on public.friendships
for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Permite crear solicitudes pending (y accepted si luego decides flujo directo)
create policy "Enviar solicitud"
on public.friendships
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and status in ('pending', 'accepted')
);

create policy "Gestionar solicitud"
on public.friendships
for update
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id)
with check (auth.uid() = sender_id or auth.uid() = receiver_id);

-- ROOMS
alter table public.rooms enable row level security;

drop policy if exists "Ver mis chats" on public.rooms;
drop policy if exists "Crear sala" on public.rooms;
drop policy if exists "Eliminar sala propia" on public.rooms;

create policy "Ver mis chats"
on public.rooms
for select
to authenticated
using (auth.uid() = participant_1 or auth.uid() = participant_2);

create policy "Crear sala"
on public.rooms
for insert
to authenticated
with check (auth.uid() = participant_1 or auth.uid() = participant_2);

create policy "Eliminar sala propia"
on public.rooms
for delete
to authenticated
using (auth.uid() = participant_1 or auth.uid() = participant_2);

-- MESSAGES
alter table public.messages enable row level security;

drop policy if exists "Ver mensajes de mis salas" on public.messages;
drop policy if exists "Enviar mensaje" on public.messages;

create policy "Ver mensajes de mis salas"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    where r.id = room_id
      and (r.participant_1 = auth.uid() or r.participant_2 = auth.uid())
  )
);

create policy "Enviar mensaje"
on public.messages
for insert
to authenticated
with check (auth.uid() = sender_id);
```

## Trigger de perfiles

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
```

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

## Scripts

```bash
pnpm dev
pnpm lint
pnpm exec tsc --noEmit
```
