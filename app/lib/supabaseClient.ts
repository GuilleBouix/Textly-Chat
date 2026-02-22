import { createBrowserClient } from "@supabase/ssr";

// ============================================
// CONFIGURACION
// ============================================

// URL del proyecto Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Clave publica anonima de Supabase
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Validacion de variables de entorno
if (!supabaseUrl || !supabasePublicKey) {
  throw new Error(
    "Missing Supabase env vars. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
  );
}

// ============================================
// EXPORT DEL CLIENTE
// ============================================

export const supabase = createBrowserClient(supabaseUrl, supabasePublicKey, {
  global: {
    headers: {
      apikey: supabasePublicKey,
    },
  },
});
