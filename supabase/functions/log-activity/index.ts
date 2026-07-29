// Registra uma mensagem no log de atividades de um aluno. Chamada tanto pelo próprio
// aluno (ex.: concluiu um módulo) quanto pelo professor (ex.: liberou um módulo).
// Alunos só podem logar para si mesmos — o studentId do corpo é ignorado nesse caso e
// substituído pelo id do token. Professores podem logar para qualquer aluno.
import { adminClient, corsHeaders, getSessionUser, jsonResponse } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, studentId, message } = await req.json();
    if (!message) return jsonResponse({ error: "message é obrigatório." }, 400);

    const admin = adminClient();
    const sessionUser = await getSessionUser(admin, token);
    if (!sessionUser) return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);

    let targetStudentId: string;
    if (sessionUser.role === "teacher") {
      if (!studentId) return jsonResponse({ error: "studentId é obrigatório." }, 400);
      targetStudentId = studentId;
    } else if (sessionUser.role === "student") {
      targetStudentId = sessionUser.id;
    } else {
      return jsonResponse({ error: "Sessão inválida." }, 401);
    }

    const { error } = await admin.from("activity_log").insert({
      student_id: targetStudentId,
      message,
      timestamp: new Date().toISOString(),
    });
    if (error) return jsonResponse({ error: "Erro ao registrar log." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
