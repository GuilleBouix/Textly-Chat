import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type BasicUser = {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
};

const getIdentityData = (authUser: any) => {
  const identities = Array.isArray(authUser?.identities) ? authUser.identities : [];
  for (const identity of identities) {
    const identityData = identity?.identity_data;
    if (identityData && typeof identityData === "object") {
      return identityData as Record<string, unknown>;
    }
  }
  return null;
};

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Faltan variables de Supabase en servidor." },
        { status: 500 },
      );
    }

    const cookieStore = await cookies();
    const authClient = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const idsRaw = Array.isArray(body?.ids) ? body.ids : [];
    const ids = idsRaw
      .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
      .slice(0, 20);

    if (!ids.length) {
      return NextResponse.json({ users: [] });
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

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
  } catch (error: any) {
    return NextResponse.json(
      { error: "No se pudo obtener metadata de usuarios", details: error?.message },
      { status: 500 },
    );
  }
}
