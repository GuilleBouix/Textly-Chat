import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// ============================================
// TIPOS
// ============================================

// Tipo basico de usuario
type BasicUser = {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Extrae datos de identidad del usuario de auth
const getIdentityData = (authUser: unknown) => {
  const identities = Array.isArray((authUser as { identities?: unknown[] })?.identities)
    ? (authUser as { identities: unknown[] }).identities
    : [];
  for (const identity of identities) {
    const identityData = (identity as { identity_data?: Record<string, unknown> })?.identity_data;
    if (identityData && typeof identityData === "object") {
      return identityData as Record<string, unknown>;
    }
  }
  return null;
};

// ============================================
// RUTA POST - Obtener metadata de usuarios
// ============================================

export async function POST(req: Request) {
  try {
    // Obtiene variables de entorno
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Valida que existan las variables necesarias
    if (!url || !anonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Faltan variables de Supabase en servidor." },
        { status: 500 },
      );
    }

    // Obtiene las cookies del request
    const cookieStore = await cookies();

    // Crea cliente de Supabase para el servidor
    const authClient = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    // Obtiene el usuario autenticado desde las cookies
    const {
      data: { user },
    } = await authClient.auth.getUser();

    // Valida que el usuario este autenticado
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtiene los IDs del body
    const body = (await req.json()) as { ids?: unknown };
    const idsRaw: unknown[] = Array.isArray(body?.ids) ? body.ids : [];
    const ids = idsRaw
      .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
      .slice(0, 20);

    // Si no hay IDs, retorna vacio
    if (!ids.length) {
      return NextResponse.json({ users: [] });
    }

    // Crea cliente admin para obtener datos de auth
    const admin = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Obtiene los datos de cada usuario
    const results = await Promise.all(
      ids.map(async (id) => {
        const { data, error } = await admin.auth.admin.getUserById(id);
        if (error) {
          console.error("Error getUserById:", { id, message: error.message });
          return null;
        }
        const authUser = data?.user;

        if (!authUser) return null;
        const identityData = getIdentityData(authUser);
        const identityName =
          (identityData?.full_name as string) || (identityData?.name as string) || null;
        const identityAvatar =
          (identityData?.avatar_url as string) ||
          (identityData?.picture as string) ||
          (identityData?.photoURL as string) ||
          null;

        return {
          id: authUser.id,
          email: authUser.email ?? undefined,
          nombre:
            (authUser.user_metadata?.full_name as string) ||
            (authUser.user_metadata?.name as string) ||
            identityName ||
            authUser.email?.split("@")[0] ||
            "Usuario",
          avatarUrl:
            (authUser.user_metadata?.avatar_url as string) ||
            (authUser.user_metadata?.picture as string) ||
            identityAvatar ||
            null,
        } satisfies BasicUser;
      }),
    );

    return NextResponse.json({ users: results.filter(Boolean) });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: "No se pudo obtener metadata de usuarios", details: err?.message },
      { status: 500 },
    );
  }
}
