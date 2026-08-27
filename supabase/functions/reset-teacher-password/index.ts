import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, teacherId, newPassword } = await req.json();
    if (!teacherId || !newPassword || String(newPassword).length < 4) {
      return jsonResponse({ error: "Dados inválidos: a nova senha deve ter pelo menos 4 caracteres." }, 400);
    }

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode alterar a senha de outro professor." }, 403);

    const { data: target, error: targetError } = await admin
      .from("users")
      .select("id")
      .eq("id", teacherId)
      .eq("role", "teacher")
      .maybeSingle();
    if (targetError || !target) return jsonResponse({ error: "Professor não encontrado." }, 404);

    const { data: hashed, error: hashError } = await admin.rpc("hash_password", { plain: newPassword });
    if (hashError) return jsonResponse({ error: "Erro ao gerar hash da senha." }, 500);

    const { error: updateError } = await admin.from("users").update({ password: hashed }).eq("id", teacherId);
    if (updateError) return jsonResponse({ error: "Erro ao atualizar senha." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
