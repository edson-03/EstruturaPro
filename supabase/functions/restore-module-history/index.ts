// Chamada pelo professor para reverter um módulo a uma versão anterior do histórico.
import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, historyId } = await req.json();
    if (!historyId) return jsonResponse({ error: "historyId é obrigatório." }, 400);

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode restaurar versões de módulos." }, 403);

    const { data: entry, error: entryError } = await admin
      .from("module_history")
      .select("module_id, snapshot")
      .eq("id", historyId)
      .maybeSingle();
    if (entryError || !entry) return jsonResponse({ error: "Versão do histórico não encontrada." }, 404);

    const moduleId = entry.module_id as string;
    const snapshot = entry.snapshot as Record<string, unknown>;

    // Guarda a versão atual (antes de restaurar) no histórico, pra dar pra desfazer a restauração também.
    const { data: current } = await admin.from("modules").select("*").eq("id", moduleId).maybeSingle();
    if (current) {
      await admin.from("module_history").insert({ module_id: moduleId, snapshot: current });
    }

    const { error: upsertError } = await admin.from("modules").upsert(snapshot);
    if (upsertError) return jsonResponse({ error: "Erro ao restaurar módulo." }, 500);

    const { data: history } = await admin
      .from("module_history")
      .select("id")
      .eq("module_id", moduleId)
      .order("created_at", { ascending: false });
    const excess = (history || []).slice(5).map((h) => h.id as number);
    if (excess.length > 0) {
      await admin.from("module_history").delete().in("id", excess);
    }

    return jsonResponse({ ok: true, module: snapshot });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
