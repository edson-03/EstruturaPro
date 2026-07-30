// Chamada pelo aluno para salvar o código da IDE (um único espaço por aluno, sobrescrito a cada save).
import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, code } = await req.json();
    if (typeof code !== "string") return jsonResponse({ error: "code é obrigatório." }, 400);

    const admin = adminClient();
    const student = await requireRole(admin, token, "student");
    if (!student) return jsonResponse({ error: "Apenas o aluno pode salvar seu código." }, 403);

    const { error } = await admin
      .from("student_code_snippets")
      .upsert({ student_id: student.id, code, updated_at: new Date().toISOString() });
    if (error) return jsonResponse({ error: "Erro ao salvar código." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
