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
      ids.map(async (id: string) => {
        const { data } = await admin.auth.admin.getUserById(id);
        const authUser = data?.user;

        if (!authUser) return null;

        return {
          id: authUser.id,
          email: authUser.email ?? undefined,
          nombre:
            (authUser.user_metadata?.full_name as string) ||
            (authUser.user_metadata?.name as string) ||
            authUser.email?.split("@")[0] ||
            "Usuario",
          avatarUrl:
            (authUser.user_metadata?.avatar_url as string) ||
            (authUser.user_metadata?.picture as string) ||
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
