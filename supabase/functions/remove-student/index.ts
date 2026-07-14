import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, studentId } = await req.json();
    if (!studentId) return jsonResponse({ error: "studentId é obrigatório." }, 400);

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode remover alunos." }, 403);

    // ON DELETE CASCADE nas tabelas filhas (module_access, progress, activity_log,
    // student_answers, sessions) cuida da limpeza dos dados relacionados.
    const { error } = await admin.from("users").delete().eq("id", studentId).eq("role", "student");
    if (error) return jsonResponse({ error: "Erro ao remover aluno." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
