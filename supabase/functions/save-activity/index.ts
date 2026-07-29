// Chamada pelo professor para criar uma atividade (lista de exercícios).
import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, activity } = await req.json();
    if (!activity || !activity.id || !activity.title) {
      return jsonResponse({ error: "Dados da atividade incompletos." }, 400);
    }

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode criar atividades." }, 403);

    const { error } = await admin.from("activities").insert({
      id: activity.id,
      title: activity.title,
      description: activity.description || "",
      created_by: teacher.id,
      questions: activity.questions || [],
      created_at: activity.createdAt || new Date().toISOString(),
    });
    if (error) return jsonResponse({ error: "Erro ao salvar atividade." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
