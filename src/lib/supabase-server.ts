import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return { url, key };
}

export function getSupabaseEnvError(): string | null {
  const { url, key } = getSupabaseEnv();
  if (!url && !key) {
    return "На сервере не заданы SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY (Vercel → Settings → Environment Variables).";
  }
  if (!url) return "Не задан SUPABASE_URL.";
  if (!key) return "Не задан SUPABASE_SERVICE_ROLE_KEY.";
  if (url.includes("/rest/v1")) {
    return "SUPABASE_URL должен быть без /rest/v1/ (например https://xxx.supabase.co).";
  }
  return null;
}

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const envError = getSupabaseEnvError();
  if (envError) throw new Error(envError);

  const { url, key } = getSupabaseEnv();
  client = createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
