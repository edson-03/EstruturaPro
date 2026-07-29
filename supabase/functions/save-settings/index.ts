// Chamada pelo professor para salvar as configurações gerais da plataforma.
import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, settings } = await req.json();
    if (!settings || typeof settings !== "object") {
      return jsonResponse({ error: "Configurações inválidas." }, 400);
    }

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode alterar configurações." }, 403);

    const { error } = await admin.from("settings").upsert({ key: "general", value: settings });
    if (error) return jsonResponse({ error: "Erro ao salvar configurações." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
