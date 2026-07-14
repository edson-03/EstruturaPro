import { adminClient, corsHeaders, jsonResponse, requireRole } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, name, email, password, avatarColor } = await req.json();
    if (!name || !email) return jsonResponse({ error: "Nome e e-mail são obrigatórios." }, 400);

    const admin = adminClient();
    const teacher = await requireRole(admin, token, "teacher");
    if (!teacher) return jsonResponse({ error: "Apenas o professor pode cadastrar alunos." }, 403);

    const normalizedEmail = String(email).trim().toLowerCase();
    const { data: existing } = await admin.from("users").select("id").eq("email", normalizedEmail).maybeSingle();
    if (existing) return jsonResponse({ error: "E-mail já cadastrado." }, 409);

    const plainPassword = password || "1234";
    const { data: hashed, error: hashError } = await admin.rpc("hash_password", { plain: plainPassword });
    if (hashError) return jsonResponse({ error: "Erro ao gerar hash da senha." }, 500);

    const initials = String(name).trim().split(" ").filter(Boolean).map((w: string) => w[0].toUpperCase()).slice(0, 2).join("");
    const newUser = {
      id: "student_" + Date.now() + "_" + Math.floor(Math.random() * 9999),
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashed,
      role: "student",
      avatar: initials || "AL",
      avatar_color: avatarColor || "#6366f1",
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await admin.from("users").insert(newUser);
    if (insertError) return jsonResponse({ error: "Erro ao criar aluno." }, 500);

    await admin.from("module_access").insert({ student_id: newUser.id, module_ids: [] });

    return jsonResponse({
      ok: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        avatarColor: newUser.avatar_color,
        createdAt: newUser.created_at,
      },
    });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno." }, 500);
  }
});
