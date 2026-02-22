import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// ============================================
// RUTA GET - Callback de autenticacion
// ============================================

export async function GET(request: Request) {
  // Obtiene la URL del request
  const requestUrl = new URL(request.url);

  // Extrae el codigo de la URL
  const code = requestUrl.searchParams.get("code");

  // Obtiene el origen de la URL
  const origin = requestUrl.origin;

  // Si no hay codigo, redirige a login con error
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Obtiene las cookies
  const cookieStore = await cookies();

  // Prepara la respuesta de redireccion
  const response = NextResponse.redirect(`${origin}/`);

  // Crea el cliente de Supabase para el servidor
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Intercambia el codigo por una sesion
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // Si hay error, redirige a login con mensaje
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_failed&reason=${encodeURIComponent(error.message)}`,
    );
  }

  // Retorna la respuesta exitosa
  return response;
}
