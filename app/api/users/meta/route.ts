// ---------------- IMPORTACIONES ----------------
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pickAvatarFromMetadata } from "../../../lib/avatar";
import { registrarEventoSeguridad } from "../../../lib/security/logger";
import { verificarLimiteSolicitudes } from "../../../lib/security/rate-limit";
import { obtenerContextoSolicitud } from "../../../lib/security/request";
import { esquemaMetaUsuarios } from "../../../lib/security/schemas";

// ---------------- CONSTANTES ----------------
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---------------- TIPOS ----------------
type UsuarioBasico = {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
};

type FilaParticipantesSala = {
  participant_1: string;
  participant_2: string | null;
};

// ---------------- HANDLER ----------------
export async function POST(req: Request) {
  // Obtiene contexto base para logs y rate limit
  const { idSolicitud, hashIp } = obtenerContextoSolicitud(req);

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceRoleKey) {
      registrarEventoSeguridad(
        "config_error",
        {
          requestId: idSolicitud,
          route: "/api/users/meta",
          hasUrl: Boolean(url),
          hasAnonKey: Boolean(anonKey),
          hasServiceRoleKey: Boolean(serviceRoleKey),
        },
        "error",
      );
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    // Crea cliente autenticado de Supabase para evaluar sesión y alcance
    const almacenamientoCookies = await cookies();
    const clienteAuth = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return almacenamientoCookies.getAll();
        },
        setAll() {},
      },
    });

    const {
      data: { user },
    } = await clienteAuth.auth.getUser();

    if (!user) {
      registrarEventoSeguridad("auth_fail", { requestId: idSolicitud, route: "/api/users/meta", ipHash: hashIp }, "warn");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Aplica límite de solicitudes por usuario e IP hasheada
    const limite = await verificarLimiteSolicitudes({
      espacio: "users_meta",
      idUsuario: user.id,
      hashIp,
    });

    if (!limite.permitido && "malConfigurado" in limite) {
      registrarEventoSeguridad(
        "config_error",
        { requestId: idSolicitud, route: "/api/users/meta", reason: "missing_upstash_env" },
        "error",
      );
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    if (!limite.permitido && "reintentarEn" in limite) {
      registrarEventoSeguridad(
        "rate_limited",
        {
          requestId: idSolicitud,
          route: "/api/users/meta",
          userId: user.id,
          ipHash: hashIp,
          retryAfter: limite.reintentarEn,
        },
        "warn",
      );

      return NextResponse.json(
        { error: "Demasiadas solicitudes, intenta mas tarde" },
        {
          status: 429,
          headers: {
            "Retry-After": String(limite.reintentarEn),
          },
        },
      );
    }

    // Valida el payload y limita tamaño de ids permitidos
    const cuerpo = await req.json().catch(() => null);
    const entradaValidada = esquemaMetaUsuarios.safeParse(cuerpo);

    if (!entradaValidada.success) {
      return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
    }

    const idsSolicitados = [...new Set(entradaValidada.data.ids)];

    // Carga salas donde participa el usuario para calcular alcance autorizado
    const { data: datosSalas, error: errorSalas } = await clienteAuth
      .from("rooms")
      .select("participant_1, participant_2")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

    if (errorSalas) {
      registrarEventoSeguridad(
        "improve_error",
        {
          requestId: idSolicitud,
          route: "/api/users/meta",
          stage: "load_rooms",
          userId: user.id,
          message: errorSalas.message,
        },
        "error",
      );
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    // Construye conjunto de usuarios autorizados por salas compartidas
    const idsAutorizados = new Set<string>([user.id]);
    (datosSalas as FilaParticipantesSala[] | null)?.forEach((sala) => {
      if (sala.participant_1) idsAutorizados.add(sala.participant_1);
      if (sala.participant_2) idsAutorizados.add(sala.participant_2);
    });

    const idsAutorizadosSolicitados = idsSolicitados.filter((id) => idsAutorizados.has(id));
    const cantidadNoAutorizados = idsSolicitados.length - idsAutorizadosSolicitados.length;

    if (cantidadNoAutorizados > 0) {
      registrarEventoSeguridad(
        "meta_unauthorized_ids",
        {
          requestId: idSolicitud,
          route: "/api/users/meta",
          userId: user.id,
          requested: idsSolicitados.length,
          rejected: cantidadNoAutorizados,
        },
        "warn",
      );
    }

    if (!idsAutorizadosSolicitados.length) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Consulta metadatos solo para ids autorizados
    const resultados = await Promise.all(
      idsAutorizadosSolicitados.map(async (id: string) => {
        const { data, error } = await admin.auth.admin.getUserById(id);

        if (error) {
          registrarEventoSeguridad(
            "improve_error",
            {
              requestId: idSolicitud,
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
        } satisfies UsuarioBasico;
      }),
    );

    return NextResponse.json({ users: resultados.filter(Boolean) }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown_error";

    registrarEventoSeguridad(
      "improve_error",
      {
        requestId: idSolicitud,
        route: "/api/users/meta",
        message,
      },
      "error",
    );

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
