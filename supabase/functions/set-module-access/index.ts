// Chamada pelo professor para liberar/bloquear módulos de um aluno. Requer sessão com role=teacher.
import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, studentId, moduleIds } = await req.json();
    if (!studentId || !Array.isArray(moduleIds)) {
      return jsonResponse({ error: "studentId e moduleIds são obrigatórios." }, 400);
    }

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode alterar acesso a módulos." }, 403);

    const { error } = await admin.from("module_access").upsert({ student_id: studentId, module_ids: moduleIds });
    if (error) return jsonResponse({ error: "Erro ao salvar acesso." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
