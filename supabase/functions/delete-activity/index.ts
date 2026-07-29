// Chamada pelo professor para excluir uma atividade.
import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, activityId } = await req.json();
    if (!activityId) return jsonResponse({ error: "activityId é obrigatório." }, 400);

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode excluir atividades." }, 403);

    const { error } = await admin.from("activities").delete().eq("id", activityId);
    if (error) return jsonResponse({ error: "Erro ao excluir atividade." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
