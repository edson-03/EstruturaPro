import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, teacherId } = await req.json();
    if (!teacherId) return jsonResponse({ error: "teacherId é obrigatório." }, 400);

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode remover professores." }, 403);

    if (teacherId === teacher.id) {
      return jsonResponse({ error: "Você não pode excluir sua própria conta." }, 400);
    }

    const { count, error: countError } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "teacher");
    if (countError) return jsonResponse({ error: "Erro ao verificar professores." }, 500);
    if ((count ?? 0) <= 1) {
      return jsonResponse({ error: "Não é possível remover o último professor do sistema." }, 400);
    }

    // ON DELETE CASCADE nas tabelas filhas (sessions, etc.) cuida da limpeza relacionada.
    const { error } = await admin.from("users").delete().eq("id", teacherId).eq("role", "teacher");
    if (error) return jsonResponse({ error: "Erro ao remover professor." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
