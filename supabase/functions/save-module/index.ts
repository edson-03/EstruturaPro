// Chamada pelo professor para criar/editar um módulo de aula.
import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, module } = await req.json();
    if (!module || !module.id || !module.title) {
      return jsonResponse({ error: "Dados do módulo incompletos." }, 400);
    }

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode criar/editar módulos." }, 403);

    // Guarda a versão anterior (se existir) no histórico antes de sobrescrever.
    const { data: previous } = await admin.from("modules").select("*").eq("id", module.id).maybeSingle();
    if (previous) {
      await admin.from("module_history").insert({ module_id: module.id, snapshot: previous });

      const { data: history } = await admin
        .from("module_history")
        .select("id")
        .eq("module_id", module.id)
        .order("created_at", { ascending: false });
      const excess = (history || []).slice(5).map((h) => h.id as number);
      if (excess.length > 0) {
        await admin.from("module_history").delete().in("id", excess);
      }
    }

    const { error } = await admin.from("modules").upsert({
      id: module.id,
      title: module.title,
      subtitle: module.subtitle || "",
      icon: module.icon || "",
      emoji: module.emoji || "",
      color: module.color || "",
      gradient: module.gradient || "",
      description: module.description || "",
      duration: module.duration || "",
      difficulty: module.difficulty || "",
      complexity: module.complexity || {},
      theory: module.theory || "",
      code_example: module.codeExample || "",
      quiz: module.quiz || [],
      video: module.video || {},
    });
    if (error) return jsonResponse({ error: "Erro ao salvar módulo." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
