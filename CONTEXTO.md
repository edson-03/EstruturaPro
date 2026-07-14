# Contexto do projeto EstruturaPRO — para retomar depois

Última atualização: 2026-07-14.

## O que é o projeto

EstruturaPRO — plataforma de ensino de Estrutura de Dados (professor/aluno). Frontend estático (JS puro, sem bundler): `js/data.js` (camada de dados), `js/auth.js` (login), `js/student.js`, `js/teacher.js`, `student.html`, `teacher.html`. Backend Supabase (`supabase_schema.sql`). Deploy via Docker (`Dockerfile`, `docker-compose.yml`, `nginx.conf`, `deploy.sh` — adicionados recentemente, ainda não commitados).

## O que já foi feito nesta sessão

1. **Auditoria completa** do sistema (segurança, qualidade, infra) via 3 sub-agentes em paralelo (schema/Supabase, JS frontend, deploy/infra). Resultado consolidado em [ANALISE.md](ANALISE.md).
2. **Plano de melhorias faseado** criado em [PLANO_MELHORIAS.md](PLANO_MELHORIAS.md) — 4 fases (segurança crítica, XSS/hardening, infra, qualidade), nenhuma ainda implementada.

## Achados críticos (resumo — detalhes em ANALISE.md)

- RLS do Supabase com `USING (true)` em todas as 10 tabelas → leitura/escrita pública irrestrita, inclusive senha de usuários.
- Senha armazenada em texto puro (`users.password`), inclusive exibida na UI do professor.
- Sessão/autenticação 100% client-side, forjável via `localStorage` (sem Supabase Auth, sem JWT).
- Notas, progresso e liberação de módulo gravados por funções globais sem validação server-side — fraude trivial via console.
- XSS armazenado: 137 usos de `innerHTML` sem escape consistente, agravado por CSP com `unsafe-inline`.

## Atualização 2026-07-14 (mesma sessão): Fases 3, 2 e 1 implementadas no código

Decisão tomada: Fase 1 = Opção B (Edge Functions + tabela `users` atual, preservando login offline). Implementado:
- Fase 3 (infra Docker/nginx/deploy.sh): completa.
- Fase 2 (XSS/escapeHtml): completa, exceto remoção do `unsafe-inline` da CSP (adiada por não ter como testar em navegador nesta sessão).
- Fase 1 (segurança crítica): código pronto — `supabase_schema.sql` com tabela `sessions`, view `users_public`, hash bcrypt via pgcrypto, RLS travada em `users`/`sessions`/`progress`/`student_answers`/`module_access`; 9 Edge Functions em `supabase/functions/`; `js/data.js`, `js/auth.js`, `js/teacher.js` religados para usar as Edge Functions quando o Supabase está configurado (mantendo fallback local/offline).
- **Aplicado e testado** no projeto Supabase ao vivo (`lsxmjahaplnblhqciljl.supabase.co`, "estruturaPro", ambiente de teste): schema reaplicado (limpo do zero, projeto estava vazio), 9 Edge Functions em ACTIVE, testado via curl (login certo/errado, RLS bloqueando leitura direta de `users`, add-student exigindo token de professor, save-progress só grava o próprio usuário, set-module-access rejeita token de aluno). `get_advisors` pegou um problema real (hash_password/verify_password expostas via RPC para anon/authenticated apesar do REVOKE) — corrigido e reconfirmado. Falta testar pelo navegador de verdade (login/cadastro/quiz na UI), só foi testado via curl direto.
- Tabelas ainda com RLS `USING (true)` total (não mexidas nesta rodada): `modules`, `activities`, `bank_questions`, `activity_log`, `settings`, `student_bank_scores`.

Ver [PLANO_MELHORIAS.md](PLANO_MELHORIAS.md) para o detalhamento fase a fase atualizado.

## Estado do git no início da sessão

Branch `main`. Modificados (não commitados): `css/teacher.css`, `js/data.js`, `js/student.js`, `js/teacher.js`, `student.html`, `supabase_schema.sql`, `teacher.html`. Novos arquivos não rastreados: `.dockerignore`, `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `deploy.sh`, `DEPLOY.md`, e agora `ANALISE.md`, `PLANO_MELHORIAS.md`, `CONTEXTO.md`. Nada foi commitado por mim nesta sessão.

## Próximo passo natural

Perguntar ao usuário por qual fase do PLANO_MELHORIAS.md quer começar, e se for a Fase 1, qual das duas opções (A ou B) prefere.
