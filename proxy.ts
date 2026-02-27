// ---------------- IMPORTACIONES ----------------
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ---------------- CONSTANTES ----------------
// Define rutas públicas que no requieren sesión activa
const RUTAS_PUBLICAS = new Set(["/login"]);

// ---------------- HANDLER ----------------
// Protege rutas privadas y redirige según estado de autenticación
export async function proxy(request: NextRequest) {
  // Obtiene la ruta solicitada para decidir reglas de acceso
  const rutaSolicitada = request.nextUrl.pathname;

  // Inicializa la respuesta base y mantiene headers de la solicitud
  let respuesta = NextResponse.next({
    request: { headers: request.headers },
  });

  // Crea cliente SSR de Supabase para validar sesión con cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Sincroniza cookies entrantes en el request actual
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          // Reconstituye respuesta para propagar cookies actualizadas
          respuesta = NextResponse.next({ request });

          // Aplica cookies de sesión en la respuesta final
          cookiesToSet.forEach(({ name, value, options }) => {
            respuesta.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Consulta usuario autenticado actual desde Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Determina si la ruta es callback de auth o pública
  const esCallbackAuth = rutaSolicitada.startsWith("/auth/callback");
  const esRutaPublica = RUTAS_PUBLICAS.has(rutaSolicitada) || esCallbackAuth;

  // Redirige a login cuando no hay sesión y la ruta es privada
  if (!user && !esRutaPublica) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Evita volver al login cuando el usuario ya está autenticado
  if (user && rutaSolicitada === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Devuelve respuesta normal cuando la ruta cumple reglas de acceso
  return respuesta;
}

// ---------------- CONFIGURACION ----------------
// Excluye rutas técnicas y assets para aplicar protección solo donde corresponde
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)"],
};
