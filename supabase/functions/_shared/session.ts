// Compartilhado entre as Edge Functions do EstruturaPRO.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

const SESSION_TTL_HOURS = 12;

export async function createSession(admin: SupabaseClient, userId: string, role: string) {
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString();
  const { error } = await admin.from("sessions").insert({ token, user_id: userId, role, expires_at: expiresAt });
  if (error) throw error;
  return { token, expiresAt };
}

export interface SessionUser {
  id: string;
  role: string;
  token: string;
}

// O token de sessão do EstruturaPRO vem sempre no corpo da requisição (campo "token"),
// nunca no header Authorization — esse header é usado pelo supabaseClient.functions.invoke()
// para a anon key do Supabase, não para a sessão da aplicação.
export async function getSessionUser(admin: SupabaseClient, token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const { data, error } = await admin
    .from("sessions")
    .select("user_id, role, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  if (new Date(data.expires_at as string).getTime() < Date.now()) return null;
  return { id: data.user_id as string, role: data.role as string, token };
}

export async function requireRole(admin: SupabaseClient, token: string | undefined | null, role: string): Promise<SessionUser | null> {
  const user = await getSessionUser(admin, token);
  if (!user || user.role !== role) return null;
  return user;
}
