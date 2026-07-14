import { adminClient, corsHeaders, getSessionUser, jsonResponse } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, oldPassword, newPassword } = await req.json();
    if (!newPassword || String(newPassword).length < 4) {
      return jsonResponse({ error: "A nova senha deve ter pelo menos 4 caracteres." }, 400);
    }

    const admin = adminClient();
    const sessionUser = await getSessionUser(admin, token);
    if (!sessionUser) return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);

    const { data: user, error } = await admin
      .from("users")
      .select("password")
      .eq("id", sessionUser.id)
      .maybeSingle();
    if (error || !user) return jsonResponse({ error: "Usuário não encontrado." }, 404);

    const { data: match } = await admin.rpc("verify_password", { plain: oldPassword, hashed: user.password });
    if (!match) return jsonResponse({ error: "Senha atual incorreta." }, 401);

    const { data: hashed, error: hashError } = await admin.rpc("hash_password", { plain: newPassword });
    if (hashError) return jsonResponse({ error: "Erro ao gerar hash da senha." }, 500);

    const { error: updateError } = await admin.from("users").update({ password: hashed }).eq("id", sessionUser.id);
    if (updateError) return jsonResponse({ error: "Erro ao atualizar senha." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
