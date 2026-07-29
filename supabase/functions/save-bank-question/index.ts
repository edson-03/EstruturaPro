// Chamada pelo professor para criar/editar uma questão do banco de questões.
import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, question } = await req.json();
    if (!question || !question.id || !question.statement) {
      return jsonResponse({ error: "Dados da questão incompletos." }, 400);
    }

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode criar/editar questões." }, 403);

    const { error } = await admin.from("bank_questions").upsert({
      id: question.id,
      module_id: question.module_id,
      type: question.type,
      statement: question.statement,
      options: question.options || [],
      correct_answer: question.correct_answer,
    });
    if (error) return jsonResponse({ error: "Erro ao salvar questão." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
