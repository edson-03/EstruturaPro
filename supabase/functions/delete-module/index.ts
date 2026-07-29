// Chamada pelo professor para excluir um módulo de aula personalizado.
import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, moduleId } = await req.json();
    if (!moduleId) return jsonResponse({ error: "moduleId é obrigatório." }, 400);

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode excluir módulos." }, 403);

    const { error } = await admin.from("modules").delete().eq("id", moduleId);
    if (error) return jsonResponse({ error: "Erro ao excluir módulo." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
