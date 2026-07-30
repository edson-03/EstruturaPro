// Chamada pelo professor para listar as versões anteriores salvas de um módulo.
import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, moduleId } = await req.json();
    if (!moduleId) return jsonResponse({ error: "moduleId é obrigatório." }, 400);

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode ver o histórico de módulos." }, 403);

    const { data, error } = await admin
      .from("module_history")
      .select("id, snapshot, created_at")
      .eq("module_id", moduleId)
      .order("created_at", { ascending: false });
    if (error) return jsonResponse({ error: "Erro ao buscar histórico." }, 500);

    return jsonResponse({ ok: true, history: data });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
