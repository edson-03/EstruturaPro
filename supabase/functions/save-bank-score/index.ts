// Chamada pelo aluno ao concluir um simulado do Banco de Questões. Só grava a pontuação
// do próprio aluno autenticado (studentId vem do token, nunca do corpo da requisição).
import { adminClient, corsHeaders, getSessionUser, jsonResponse } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, id, moduleId, score, totalQuestions, correctAnswers } = await req.json();
    if (!id || !moduleId) return jsonResponse({ error: "Dados do score incompletos." }, 400);

    const admin = adminClient();
    const student = await getSessionUser(admin, token);
    if (!student || student.role !== "student") return jsonResponse({ error: "Sessão inválida." }, 401);

    const { error } = await admin.from("student_bank_scores").insert({
      id,
      student_id: student.id,
      module_id: moduleId,
      score: typeof score === "number" ? Math.max(0, Math.min(100, Math.round(score))) : 0,
      total_questions: totalQuestions || 0,
      correct_answers: correctAnswers || 0,
      completed_at: new Date().toISOString(),
    });
    if (error) return jsonResponse({ error: "Erro ao salvar pontuação." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
