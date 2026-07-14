import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, studentId, name, email, password, avatarColor } = await req.json();
    if (!studentId || !name || !email) return jsonResponse({ error: "Dados incompletos." }, 400);

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode editar alunos." }, 403);

    const normalizedEmail = String(email).trim().toLowerCase();
    const { data: duplicate } = await admin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .neq("id", studentId)
      .maybeSingle();
    if (duplicate) return jsonResponse({ error: "E-mail já cadastrado por outro usuário." }, 409);

    const initials = String(name).trim().split(" ").filter(Boolean).map((w: string) => w[0].toUpperCase()).slice(0, 2).join("");
    const update: Record<string, unknown> = {
      name: String(name).trim(),
      email: normalizedEmail,
      avatar: initials || undefined,
      avatar_color: avatarColor || undefined,
    };

    if (password) {
      const { data: hashed, error: hashError } = await admin.rpc("hash_password", { plain: password });
      if (hashError) return jsonResponse({ error: "Erro ao gerar hash da senha." }, 500);
      update.password = hashed;
    }

    const { error: updateError } = await admin.from("users").update(update).eq("id", studentId);
    if (updateError) return jsonResponse({ error: "Erro ao atualizar aluno." }, 500);

    return jsonResponse({ ok: true });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
