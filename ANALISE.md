# Análise do Sistema EstruturaPRO — Falhas e Melhorias

## Contexto

Auditoria do EstruturaPRO — plataforma de ensino (professor/aluno) com frontend estático (JS puro, sem framework/bundler) e backend Supabase, recém-preparada para deploy em produção via Docker (`Dockerfile`, `docker-compose.yml`, `nginx.conf`, `deploy.sh`).

---

## Resumo executivo

O problema central do sistema **não é um bug isolado**: é arquitetural. Não existe backend de autorização. `js/data.js` funciona ao mesmo tempo como modelo de dados e "controlador de permissões", rodando inteiramente no navegador do aluno. Combinado com políticas RLS do Supabase abertas (`USING (true)` em todas as 10 tabelas), isso significa que **qualquer aluno com o DevTools aberto pode**: ler a senha de qualquer usuário (inclusive do professor, em texto puro), se autopromover a professor, fraudar notas e liberar módulos, e gravar HTML/JS malicioso que executa no navegador de outros usuários (XSS persistente).

---

## Achados críticos (segurança — ação recomendada antes de ir a produção)

1. **RLS `USING (true)` em todas as tabelas** — `supabase_schema.sql:203-231`. Toda leitura e escrita (incluindo `DELETE`/`UPDATE` sem filtro) é pública via API REST + anon key, para as 10 tabelas, inclusive `users`. O próprio arquivo já reconhece isso como placeholder de dev (comentário em `supabase_schema.sql:201`).
2. **Senhas em texto puro** — coluna `users.password TEXT` (`supabase_schema.sql:23`), seed com senha literal `'1234'` (`supabase_schema.sql:103-106`, `135`). Exibida em claro na UI do professor (`js/teacher.js:1954`). Baixada por completo para o `localStorage` de qualquer visitante via `syncFromSupabase` (`js/data.js:988-1089`, `select('*')` sem filtro), antes mesmo do login.
3. **Autenticação e sessão 100% client-side, forjável** — `js/auth.js:75-101` compara senha em texto no navegador; `setSession`/`getSession` (`js/data.js:1332-1339`) gravam `{userId, role, name}` em `localStorage` sem token/assinatura. Qualquer usuário pode virar "professor" rodando uma linha no console.
4. **Nenhuma validação server-side de notas/progresso/liberação de módulo** — `markModuleComplete`, `setStudentModuleAccess`, `saveStudentAnswer` (`js/data.js`) são funções globais que qualquer script no console pode chamar com qualquer `studentId`, sem checagem de identidade ou papel no backend.
5. **"Danger Zone" com modal de senha é cosmética** — `js/teacher.js:3199-3221` valida a senha inteiramente no client contra dados já expostos; não impede um atacante de chamar a API do Supabase diretamente.

## Achados altos

6. **XSS armazenado** — 137 usos de `innerHTML` (84 em `teacher.js`, 50 em `student.js`) injetando dados de módulos/atividades/questões/nomes sem `escapeHtml` na maioria dos casos (ex.: `js/student.js:70-74, 636-638, 666-676, 932-947`; `js/teacher.js:206-208`). `exportReportPDF` usa `document.write` com dados não sanitizados (`js/teacher.js:1177`). Agravado porque a CSP permite `script-src 'unsafe-inline'` (`student.html:5`, `teacher.html:5`, `nginx.conf:21`), anulando parte da proteção.
7. **Infra exposta por padrão** — `docker-compose.yml` mapeia `80:80` para `0.0.0.0` (HTTP puro direto na internet) até intervenção manual documentada em `DEPLOY.md:91-101`; nginx sem HSTS, sem `server_tokens off`, sem bloqueio explícito de dotfiles.

## Achados médios

8. **Sincronização Supabase "fire-and-forget"** — escritas atualizam `localStorage` e retornam sucesso antes da promise do Supabase resolver; erros só vão para `console.error`, nunca para a UI (`js/data.js:1221-1270, 1355-1369, 1409-1430, 1528-1547`). Gera divergência silenciosa local↔remoto.
9. **Duplicação de código arriscada** — `escapeHtml` declarada 3x em `teacher.js` com implementações divergentes (`js/teacher.js:1780-1786, 3786-3792, 4398-4404` — as duas primeiras são código morto silencioso); motor de teste de código do aluno duplicado quase por completo entre `student.js:1027-1300` e `teacher.js:~1692-1780`; `showToast` duplicada.
10. **Dockerfile sem pin de versão** (`FROM nginx:alpine` sem tag/digest — rebuilds `--no-cache` podem puxar imagem diferente sem aviso); sem `HEALTHCHECK`.
11. **`deploy.sh`** roda `docker compose down` sem confirmação e sem checar exit code dessa etapa (interrompe produção silenciosamente em caso de falha anterior).

## Achados menores / qualidade

- Funções muito grandes (`testStudentCode` >270 linhas, `exportReportPDF` ~450 linhas) misturando render + cálculo + persistência.
- Acesso a DOM sem checagem de `null` em vários pontos (`js/student.js:664, 854-862`; `js/teacher.js:582`), inconsistente com outros trechos que checam corretamente.
- Mistura de `onclick` inline com `addEventListener` na mesma base de código.
- Re-render completo de tabelas a cada keystroke de busca, sem debounce (`js/teacher.js:662`).
- Import de CSV sem validação de e-mail/escape (`js/teacher.js:1862`).
- `version: '3.8'` obsoleto em `docker-compose.yml:1` (apenas warning).

---

## Recomendações priorizadas

**Antes de qualquer deploy em produção real com dados de alunos:**
- Reescrever as políticas RLS para restringir por identidade real (exige adotar Supabase Auth ou, no mínimo, uma função server-side/Edge Function que valide sessão antes de gravar).
- Parar de armazenar senha em texto puro (hash, ou migrar para Supabase Auth nativo).
- Nunca devolver a coluna `password` em `SELECT *`; nunca baixar a tabela `users` inteira para o client.

**Curto prazo, sem reescrever a arquitetura:**
- Centralizar e corrigir `escapeHtml` (uma única implementação em `data.js`, aplicada em todo `innerHTML` que recebe dado de módulo/atividade/usuário) e remover `'unsafe-inline'` da CSP.
- Trocar `docker-compose.yml` para expor só `127.0.0.1:8080:80` por padrão (documentado, mas hoje o padrão do repo é inseguro).
- Pinar versão da imagem base no Dockerfile; adicionar `server_tokens off` e HSTS no nginx.

**Manutenção/qualidade:**
- Unificar o motor de teste de código e `showToast` em `data.js`.
- Propagar erros de sincronização Supabase para a UI em vez de só `console.error`.

---

## Observações positivas

- Nenhuma `service_role` key exposta em nenhum arquivo (apenas anon key, que é o esperado no client).
- `js/config.js` corretamente listado em `.gitignore`, não versionado.
- `deploy.sh` não expõe credenciais em texto e aborta corretamente se o config ainda tiver placeholder.
- Headers de segurança básicos já presentes no nginx (`X-Frame-Options`, `X-Content-Type-Options`, CSP parcial).
