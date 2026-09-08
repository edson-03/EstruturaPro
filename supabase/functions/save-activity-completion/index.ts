// Chamada pelo aluno quando termina de responder todas as questões de uma atividade
// pela primeira vez. Grava o momento da conclusão e se isso foi depois do prazo — usado
// só pra decidir a penalidade de pontos por atraso (Configurações > Pontuação). Como só
// interessa o PRIMEIRO momento em que a atividade ficou completa, não sobrescreve um
// registro já existente (editar respostas depois não muda a data de conclusão original).
import { adminClient, corsHeaders, getSessionUser, jsonResponse } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, activityId, late } = await req.json();
    if (!activityId) return jsonResponse({ error: "activityId é obrigatório." }, 400);

    const admin = adminClient();
    const student = await getSessionUser(admin, token);
    if (!student || student.role !== "student") return jsonResponse({ error: "Sessão inválida." }, 401);

    const { data: existing } = await admin
      .from("activity_completions")
      .select("student_id")
      .eq("student_id", student.id)
      .eq("activity_id", activityId)
      .maybeSingle();
    if (existing) return jsonResponse({ ok: true, alreadyRecorded: true });

    const { error } = await admin.from("activity_completions").insert({
      student_id: student.id,
      activity_id: activityId,
      completed_at: new Date().toISOString(),
      late: !!late,
    });
    if (error) return jsonResponse({ error: "Erro ao registrar conclusão." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
