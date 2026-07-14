import { adminClient, corsHeaders, createSession, jsonResponse } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return jsonResponse({ error: "E-mail e senha são obrigatórios." }, 400);
    }

    const admin = adminClient();
    const { data: user, error } = await admin
      .from("users")
      .select("id, name, email, password, role, avatar, avatar_color")
      .eq("email", String(email).trim().toLowerCase())
      .maybeSingle();

    if (error || !user) {
      return jsonResponse({ error: "E-mail ou senha incorretos." }, 401);
    }

    const { data: match, error: verifyError } = await admin.rpc("verify_password", {
      plain: password,
      hashed: user.password,
    });
    if (verifyError || !match) {
      return jsonResponse({ error: "E-mail ou senha incorretos." }, 401);
    }

    const { token, expiresAt } = await createSession(admin, user.id, user.role);

    return jsonResponse({
      token,
      expiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        avatarColor: user.avatar_color,
      },
    });
  } catch (_e) {
    return jsonResponse({ error: "Erro interno ao processar login." }, 500);
  }
});
