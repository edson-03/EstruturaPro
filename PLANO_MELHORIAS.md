# Plano de Melhorias — EstruturaPRO

Baseado em [ANALISE.md](ANALISE.md). Organizado em fases independentes — dá para executar uma fase sem esperar a outra, exceto onde marcado como dependência.

---

## Fase 1 — Segurança crítica (bloqueador para produção com dados reais de alunos)

**Status: aplicado e testado no projeto Supabase (`estruturaPro`, ambiente de teste).** Decisão tomada: manter login/sessão atuais (inclusive modo offline sem Supabase), fechar os buracos via Edge Functions (Opção B) + RLS mais restrita.

Testado via curl direto contra o projeto ao vivo, 2026-07-14:
- Login com senha certa → token emitido. Login com senha errada → rejeitado.
- `SELECT * FROM users` direto com anon key → `permission denied` (antes vazava tudo, inclusive senha).
- `users_public` (sem coluna password) → funciona normalmente.
- `add-student` sem token → rejeitado ("Apenas o professor..."). Com token de professor → cria aluno.
- `save-progress` como aluno → grava só o próprio progresso (studentId vem do token, nunca do corpo da requisição).
- `set-module-access` com token de **aluno** → rejeitado (só professor pode).
- Achado extra durante o `get_advisors`: `hash_password`/`verify_password` estavam expostas via `/rest/v1/rpc/` para `anon`/`authenticated` mesmo com `REVOKE ALL FROM PUBLIC` (o Supabase concede EXECUTE a essas roles por padrão em funções novas — `REVOKE FROM PUBLIC` não é suficiente). Corrigido com `REVOKE EXECUTE ... FROM anon, authenticated` explícito, reaplicado e reconfirmado bloqueado. `supabase_schema.sql` já atualizado com a correção.

O que foi implementado:
1. `supabase_schema.sql`: extensão `pgcrypto`, tabela `sessions` (tokens de sessão), view `users_public` (sem a coluna `password`), funções `hash_password`/`verify_password` (bcrypt via pgcrypto, só a service_role executa), RLS travando escrita direta em `users`, `sessions`, `progress`, `student_answers`, `module_access` — só sobra leitura pública nessas 3 últimas.
2. `supabase/functions/`: 8 Edge Functions (`login`, `verify-password`, `change-password`, `add-student`, `update-student`, `remove-student`, `save-progress`, `set-module-access`, `save-student-answer`) + helper compartilhado `_shared/session.ts`.
3. `js/data.js`: `callEdgeFunction()`, sessão agora carrega um `token` emitido pelo login, `syncFromSupabase` lê de `users_public` (nunca mais baixa senha para o browser), `addStudent`/`updateStudent`/`removeStudent`/`setStudentModuleAccess`/`setModuleProgress`/`saveStudentAnswer` chamam a Edge Function correspondente quando o Supabase está configurado (mantendo o comportamento local antigo quando não está).
4. `js/auth.js`: login dual-mode — com Supabase configurado, chama a Edge Function `login` (senha nunca comparada no client); sem Supabase, mantém o modo local/offline de demonstração como estava.
5. `js/teacher.js`: troca de senha e o modal "Danger Zone" agora verificam a senha no servidor (`change-password`/`verify-password`) quando o Supabase está configurado.

**Falta** (não implementado nesta rodada, ainda `USING (true)` para leitura e escrita): `modules`, `activities`, `bank_questions`, `activity_log`, `settings`, `student_bank_scores`. Fraude de progresso/nota e leak de senha já estão fechados; um aluno ainda pode, em tese, escrever module/activity/bank_questions arbitrários via console (menos crítico que os itens já corrigidos, mas é o próximo passo natural de uma Fase 1b).

Verificação recomendada agora pelo navegador (não só via curl): abrir o app com `js/config.js` apontando para o projeto, logar como professor e aluno, cadastrar aluno, liberar módulo, responder quiz, trocar senha, testar a Danger Zone.

---

## Fase 2 — XSS e hardening do frontend

**Status: feito, exceto o item 4.**

1. ✅ `escapeHtml()`/`escapeDangerousHtml()` únicas em `js/data.js`, duplicatas removidas de `teacher.js`/`student.js`.
2. ✅ `escapeHtml` aplicado nos pontos que interpolam dado de módulo/atividade/questão/usuário em `innerHTML` (student.js e teacher.js).
3. ✅ `exportReportPDF` escapando os campos antes de montar o HTML do relatório.
4. ⏳ **Não feito** — Remover `'unsafe-inline'` do `script-src` da CSP (`student.html:5`, `teacher.html:5`, `nginx.conf:21`). Adiado: exige converter ~14 handlers `onclick`/`onmouseenter` (CodeMirror, quiz, teste de código) para `addEventListener`, e isso não foi validado em navegador nesta sessão — risco de quebrar a experiência de responder quiz/atividade sem visualizar rodando.

Verificação: cadastrar um módulo/atividade com título `<img src=x onerror=alert(1)>` como professor e confirmar que não executa ao visualizar como aluno.

---

## Fase 3 — Infraestrutura / deploy

**Status: feito.**

1. ✅ `docker-compose.yml`: `127.0.0.1:8080:80` por padrão.
2. ✅ `Dockerfile`: `nginx:1.27-alpine` pinado + `HEALTHCHECK`.
3. ✅ `nginx.conf`: `server_tokens off;`, header HSTS, bloqueio de dotfiles.
4. ✅ `deploy.sh`: `set -euo pipefail`, checagem de exit code em cada etapa, confirmação antes de `docker compose down`.

Verificação: `docker compose up` e checar headers de resposta (`curl -I`) e que a porta 80 não fica acessível externamente sem proxy.

---

## Fase 4 — Qualidade e manutenção

**Status: item 3 parcialmente feito (via Fase 1); itens 1, 2, 4, 5 pendentes.**

1. ⏳ Unificar o motor de teste de código do aluno (hoje duplicado em `student.js:1027-1300` e `teacher.js:~1692-1780`) em uma função só, em `data.js`.
2. ⏳ Unificar `showToast` (duplicada em `student.js`/`teacher.js` — hoje ambas já escapam a mensagem, mas o código ainda está duplicado).
3. ✅ (parcial) `addStudent`/`updateStudent`/`removeStudent`/`setStudentModuleAccess`/`setModuleProgress`/`saveStudentAnswer` agora propagam erro de sincronização via `showToast` quando a Edge Function falha. Ainda falta para `logActivity`, `saveActivity`, `saveCustomModule`, `saveBankQuestion` e outras escritas que continuam `USING (true)`.
4. ⏳ Adicionar debounce nas buscas que re-renderizam tabela inteira a cada tecla (`teacher.js:662`).
5. ✅ CSV import agora valida formato de e-mail antes de chamar `addStudent` (feito como parte da Fase 1, já que a função virou async).

---

## Ordem sugerida

Progresso atual: **Fase 3 ✅ → Fase 2 (quase completa, falta unsafe-inline) → Fase 1 (código pronto, falta aplicar no Supabase) → Fase 4 (pendente)**.

Próximo passo: aplicar `supabase_schema.sql` + deploy das Edge Functions no projeto Supabase ao vivo (dev/teste), depois testar login/cadastro/quiz na prática.
