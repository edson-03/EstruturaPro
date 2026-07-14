// Chamada pelo aluno ao iniciar ou concluir um módulo. Só grava progresso do próprio
// aluno autenticado (studentId vem do token, nunca do corpo da requisição) — isso
// impede que um aluno grave/forje nota ou progresso de outro aluno via console.
import { adminClient, corsHeaders, getSessionUser, jsonResponse } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, moduleId, started, completed, score } = await req.json();
    if (!moduleId) return jsonResponse({ error: "moduleId é obrigatório." }, 400);

    const admin = adminClient();
    const student = await getSessionUser(admin, token);
    if (!student || student.role !== "student") return jsonResponse({ error: "Sessão inválida." }, 401);

    const { data: existing } = await admin
      .from("progress")
      .select("*")
      .eq("student_id", student.id)
      .eq("module_id", moduleId)
      .maybeSingle();

    const now = new Date().toISOString();
    const row = {
      student_id: student.id,
      module_id: moduleId,
      started: started ?? existing?.started ?? false,
      started_at: started && !existing?.started_at ? now : existing?.started_at ?? null,
      completed: completed ?? existing?.completed ?? false,
      completed_at: completed ? now : existing?.completed_at ?? null,
      score: typeof score === "number" ? Math.max(0, Math.min(100, Math.round(score))) : existing?.score ?? 0,
    };

    const { error } = await admin.from("progress").upsert(row);
    if (error) return jsonResponse({ error: "Erro ao salvar progresso." }, 500);

    return jsonResponse({ ok: true, progress: row });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
