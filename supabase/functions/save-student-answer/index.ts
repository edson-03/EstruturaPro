// Chamada pelo aluno ao responder uma questão de atividade. Só grava resposta do
// próprio aluno autenticado (studentId vem do token, nunca do corpo da requisição).
import { adminClient, corsHeaders, getSessionUser, jsonResponse } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, activityId, questionId, answerData } = await req.json();
    if (!activityId || !questionId) return jsonResponse({ error: "activityId e questionId são obrigatórios." }, 400);

    const admin = adminClient();
    const student = await getSessionUser(admin, token);
    if (!student || student.role !== "student") return jsonResponse({ error: "Sessão inválida." }, 401);

    const { error } = await admin.from("student_answers").upsert({
      student_id: student.id,
      activity_id: activityId,
      question_id: questionId,
      answer_data: answerData,
      updated_at: new Date().toISOString(),
    });
    if (error) return jsonResponse({ error: "Erro ao salvar resposta." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
