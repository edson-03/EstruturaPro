// Chamada pelo aluno para carregar o código salvo na IDE (um único espaço por aluno).
import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token } = await req.json();

    const admin = adminClient();
    const student = await requireRole(admin, token, "student");
    if (!student) return jsonResponse({ error: "Apenas o aluno pode acessar seu código salvo." }, 403);

    const { data, error } = await admin
      .from("student_code_snippets")
      .select("code, updated_at")
      .eq("student_id", student.id)
      .maybeSingle();
    if (error) return jsonResponse({ error: "Erro ao buscar código salvo." }, 500);

    return jsonResponse({ ok: true, code: data?.code ?? "", updatedAt: data?.updated_at ?? null });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
