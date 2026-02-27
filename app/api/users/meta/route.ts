import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pickAvatarFromMetadata } from "../../../lib/avatar";
import { logSecurityEvent } from "../../../lib/security/logger";
import { checkRateLimit } from "../../../lib/security/rate-limit";
import { getRequestContext } from "../../../lib/security/request";
import { usersMetaSchema } from "../../../lib/security/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BasicUser = {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
};

type RoomParticipantsRow = {
  participant_1: string;
  participant_2: string | null;
};

export async function POST(req: Request) {
  const { requestId, ipHash } = getRequestContext(req);

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceRoleKey) {
      logSecurityEvent(
        "config_error",
        {
          requestId,
          route: "/api/users/meta",
          hasUrl: Boolean(url),
          hasAnonKey: Boolean(anonKey),
          hasServiceRoleKey: Boolean(serviceRoleKey),
        },
        "error",
      );
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
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
      logSecurityEvent("auth_fail", { requestId, route: "/api/users/meta", ipHash }, "warn");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const rl = await checkRateLimit({
      namespace: "users_meta",
      userId: user.id,
      ipHash,
    });

    if (!rl.ok && "misconfigured" in rl) {
      logSecurityEvent(
        "config_error",
        { requestId, route: "/api/users/meta", reason: "missing_upstash_env" },
        "error",
      );
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    if (!rl.ok && "retryAfter" in rl) {
      logSecurityEvent(
        "rate_limited",
        {
          requestId,
          route: "/api/users/meta",
          userId: user.id,
          ipHash,
          retryAfter: rl.retryAfter,
        },
        "warn",
      );

      return NextResponse.json(
        { error: "Demasiadas solicitudes, intenta mas tarde" },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryAfter),
          },
        },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = usersMetaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
    }

    const requestedIds = [...new Set(parsed.data.ids)];

    const { data: roomsData, error: roomsError } = await authClient
      .from("rooms")
      .select("participant_1, participant_2")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

    if (roomsError) {
      logSecurityEvent(
        "improve_error",
        {
          requestId,
          route: "/api/users/meta",
          stage: "load_rooms",
          userId: user.id,
          message: roomsError.message,
        },
        "error",
      );
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    const authorizedIds = new Set<string>([user.id]);
    (roomsData as RoomParticipantsRow[] | null)?.forEach((room) => {
      if (room.participant_1) authorizedIds.add(room.participant_1);
      if (room.participant_2) authorizedIds.add(room.participant_2);
    });

    const authorizedRequestedIds = requestedIds.filter((id) => authorizedIds.has(id));
    const unauthorizedCount = requestedIds.length - authorizedRequestedIds.length;

    if (unauthorizedCount > 0) {
      logSecurityEvent(
        "meta_unauthorized_ids",
        {
          requestId,
          route: "/api/users/meta",
          userId: user.id,
          requested: requestedIds.length,
          rejected: unauthorizedCount,
        },
        "warn",
      );
    }

    if (!authorizedRequestedIds.length) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results = await Promise.all(
      authorizedRequestedIds.map(async (id: string) => {
        const { data, error } = await admin.auth.admin.getUserById(id);

        if (error) {
          logSecurityEvent(
            "improve_error",
            {
              requestId,
              route: "/api/users/meta",
              stage: "admin_get_user",
              userId: user.id,
              targetId: id,
              message: error.message,
            },
            "error",
          );
          return null;
        }

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
          avatarUrl: pickAvatarFromMetadata(authUser.user_metadata as Record<string, unknown>),
        } satisfies BasicUser;
      }),
    );

    return NextResponse.json({ users: results.filter(Boolean) }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown_error";

    logSecurityEvent(
      "improve_error",
      {
        requestId,
        route: "/api/users/meta",
        message,
      },
      "error",
    );

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
