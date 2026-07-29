// Chamada pelo professor para excluir uma questão do banco de questões.
import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, questionId } = await req.json();
    if (!questionId) return jsonResponse({ error: "questionId é obrigatório." }, 400);

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode excluir questões." }, 403);

    const { error } = await admin.from("bank_questions").delete().eq("id", questionId);
    if (error) return jsonResponse({ error: "Erro ao excluir questão." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
