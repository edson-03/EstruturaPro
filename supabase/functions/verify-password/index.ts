// Usado pelo modal de "Danger Zone" do professor para confirmar a senha atual
// antes de uma ação destrutiva, sem trocar a senha.
import { adminClient, corsHeaders, getSessionUser, jsonResponse } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, password } = await req.json();
    const admin = adminClient();

    const sessionUser = await getSessionUser(admin, token);
    if (!sessionUser) return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);

    const { data: user, error } = await admin
      .from("users")
      .select("password")
      .eq("id", sessionUser.id)
      .maybeSingle();
    if (error || !user) return jsonResponse({ ok: false }, 404);

    const { data: match } = await admin.rpc("verify_password", { plain: password, hashed: user.password });
    return jsonResponse({ ok: Boolean(match) });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
