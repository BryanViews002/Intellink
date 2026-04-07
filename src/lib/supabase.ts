import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const fallbackSupabaseUrl = "https://placeholder.supabase.co";
const fallbackSupabaseAnonKey =
  "placeholder-anon-key-placeholder-anon-key-placeholder";

const missingPublicSupabaseEnv = !supabaseUrl || !supabaseAnonKey;

if (missingPublicSupabaseEnv) {
  console.warn(
    "Supabase public environment variables are missing. Authenticated flows will not work until they are configured.",
  );
}

function createCookieAdapter(
  getAll: () => { name: string; value: string }[],
  setAll?: (
    cookiesToSet: {
      name: string;
      value: string;
      options: CookieOptions;
    }[],
  ) => void,
) {
  return {
    getAll,
    setAll:
      setAll ??
      (() => {
        // Server Components may create a Supabase client in a read-only cookie
        // context. Supabase will still work for reading the session.
      }),
  };
}

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    supabaseUrl || fallbackSupabaseUrl,
    supabaseAnonKey || fallbackSupabaseAnonKey,
    {
    cookies: createCookieAdapter(
      () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
      (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components can read cookies but cannot always write them.
        }
      },
    ),
    },
  );
}

export function createRouteHandlerSupabaseClient() {
  return createServerSupabaseClient();
}

export function createMiddlewareSupabaseClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl || fallbackSupabaseUrl,
    supabaseAnonKey || fallbackSupabaseAnonKey,
    {
    cookies: createCookieAdapter(
      () => request.cookies.getAll().map(({ name, value }) => ({ name, value })),
      (cookiesToSet) => {
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    ),
    },
  );

  return { supabase, response };
}

export const supabaseAdmin = createClient(
  supabaseUrl || fallbackSupabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey || fallbackSupabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export const supabaseAuthServer = createClient(
  supabaseUrl || fallbackSupabaseUrl,
  supabaseAnonKey || fallbackSupabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey);
}
