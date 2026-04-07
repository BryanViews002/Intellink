"use client";

import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

export async function applyBrowserSession(session: {
  access_token: string;
  refresh_token: string;
}) {
  const supabase = getBrowserSupabaseClient();

  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) {
    throw error;
  }

  return supabase;
}

export async function signOutBrowserSession() {
  const supabase = getBrowserSupabaseClient();
  await supabase.auth.signOut();
}
