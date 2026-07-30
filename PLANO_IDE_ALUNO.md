# Plano — IDE de JavaScript para o Aluno

Pedido: adicionar uma página no sidebar do aluno (`student.html`) onde ele escreve e executa código **JavaScript**, pode importar um arquivo `.js` do computador ou celular, e "compila" (executa) o código. O código do aluno deve poder ser salvo.

Decisões já tomadas com o usuário antes deste plano:
- **Um único espaço de código por aluno** (autosave, tipo rascunho) — não uma lista de vários arquivos salvos.
- **Execução em `<iframe sandbox="allow-scripts">` isolado** do resto da página, em vez de rodar o código direto no documento principal.

Este plano ainda não foi implementado — é só o levantamento/desenho, conforme pedido.

---

## Achados do levantamento (contexto que molda o plano)

- O sidebar do aluno não tem uma função central `showView()`: cada tela (`#view-dashboard`, `#view-module`, `#view-activity`, `#view-question-bank`) é escondida/mostrada manualmente em ~4 lugares diferentes de `js/student.js`. A nova `#view-ide` vai seguir esse mesmo padrão manual (não é uma refatoração ideal, mas é consistente com o resto do arquivo — não vamos introduzir um padrão novo isolado).
- Já existe um item de sidebar fixo, fora dos módulos/atividades dinâmicos: "❓ Banco de Questões" (`student.html:67-71`, `js/student.js:858-861`). É o molde exato pro item novo "💻 IDE JavaScript".
- CodeMirror com modo `javascript`/tema `dracula` já está em uso em `js/teacher.js` e `js/student.js`, incluindo atalho `Ctrl-Enter` para "rodar" no editor de questão prática do professor. O `student.html` hoje só carrega o core do CodeMirror (falta os addons de `show-hint`/`closebrackets`/`comment` que o professor já tem) — vamos adicionar esses `<script>`/`<link>` (mesmo CDN `cdnjs` já liberado na CSP, só path novo, sem mudança de CSP).
- **Não existe hoje nenhuma tabela para "conteúdo livre do aluno" sem vínculo a módulo/atividade.** A tabela mais próxima (`progress`) é por módulo; `student_answers` é por questão de atividade. Precisa de tabela nova.
- O projeto já executa código do aluno hoje (questões práticas, `testStudentCode` em `js/student.js`) com `new Function('console','prompt','alert','confirm', codigo)` **direto no documento principal**, sem isolamento real — o código do aluno tem acesso de fato a `window`/`document`/`fetch`/`localStorage` da página. Isso é aceitável no contexto de uma questão fechada, mas para uma IDE de propósito geral (onde o aluno pode colar qualquer coisa, inclusive baixada de um arquivo) o usuário já decidiu ir para `iframe sandbox` — **não vamos alterar o comportamento das questões práticas existentes**, só a IDE nova usa o padrão isolado.
- A CSP atual (`student.html:5`) não tem `frame-src 'self'` nem `blob:` — só `youtube.com`. Comportamento de `srcdoc` em iframe varia entre navegadores quanto a exigir `frame-src`; para não depender disso, a Fase C inclui adicionar `'self'` a `frame-src` (mudança mínima, não libera embutir sites externos).

---

## Fase A — Schema e Edge Functions (backend)

**Status: concluída em 2026-07-30.**

1. ✅ Nova tabela `student_code_snippets`: `student_id` (text, PK, um registro por aluno, FK pra `users`), `code` (text), `updated_at` (timestamptz). Sem policy pública de leitura/escrita — mesmo padrão de `sessions`: só acessível via Edge Function com service role, porque é conteúdo pessoal do aluno (diferente de `modules`, que é público de propósito). Documentada também em `supabase_schema.sql` (seção 7.8), incluindo o `REVOKE ALL ON student_code_snippets FROM anon, authenticated`.
2. ✅ Edge Function `get-code-snippet` (`supabase/functions/get-code-snippet/index.ts`): recebe `token`, resolve `student_id` do token via `requireRole(admin, token, "student")` (nunca do body), retorna `code` salvo (ou vazio se nunca salvou).
3. ✅ Edge Function `save-code-snippet` (`supabase/functions/save-code-snippet/index.ts`): recebe `token` + `code`, `requireRole(admin, token, "student")`, upsert por `student_id` do token.
4. ✅ Em `js/data.js`: `getCodeSnippet(studentId)` (leitura local síncrona), `saveCodeSnippet(studentId, code)` (grava local + sincroniza via Edge Function) e `syncCodeSnippetFromSupabase(studentId)` (busca a versão do servidor ao carregar a IDE) — mesmo molde de `getStudentProgress`/`setModuleProgress`: cache em `localStorage` (`DB_KEYS.CODE_SNIPPETS`, funciona offline) + sync no Supabase quando configurado. O autosave debounced (pra não salvar a cada tecla) fica pra Fase B, junto com o editor que vai chamar essas funções.

**Testado direto contra o projeto Supabase ao vivo** (`estruturaPro`, via curl nas Edge Functions, sessões de teste temporárias para `student1`/`student2` criadas e removidas depois): confirmado que sem sessão válida as duas functions retornam 403; que salvar e ler devolve exatamente o código salvo; e que **o isolamento entre alunos funciona** — a sessão de `student2` não enxerga o código salvo por `student1` (cada um só acessa o próprio, resolvido pelo token, nunca por um id vindo do client). Dados e sessões de teste apagados ao final, 0 sobras confirmadas via SQL.

---

## Fase B — Editor (CodeMirror + importar arquivo)

**Status: concluída em 2026-07-30.**

1. ✅ Nova view `#view-ide` em `student.html`, com o item de sidebar "💻 IDE JavaScript" (molde: item do Banco de Questões, `#nav-item-ide`). Os 4 pontos que escondem/mostram views manualmente em `js/student.js` (`openModule`, `backToDashboard`, `openActivity`, `openQuestionBank`) foram atualizados pra também esconder `#view-ide`. De quebra, corrigido um `<div>` de `#view-question-bank` que nunca era fechado explicitamente (dependia do parser do navegador fechar implicitamente no `</main>`) — agora tem fechamento próprio, já que a view da IDE precisava ser irmã dela no HTML.
2. ✅ CodeMirror (`mode:'javascript'`, `theme:'dracula'`, `autoCloseBrackets`, `matchBrackets`, `styleActiveLine`) com os mesmos atalhos do editor do professor: `Ctrl-Space` (autocomplete), `Ctrl-/` (comentar linha). `student.html` só carregava o core do CodeMirror — adicionados os addons `closebrackets`/`matchbrackets`/`show-hint`/`javascript-hint`/`active-line`/`comment` (mesmo CDN `cdnjs` já liberado, sem mudança de CSP).
3. ✅ Botão "📂 Importar Arquivo": `<input type="file" accept=".js,text/javascript">` oculto, acionado pelo botão. Lê o conteúdo via `FileReader.readAsText`, com confirmação (`confirm()`) se já houver código diferente do template padrão no editor.
4. ✅ Autosave debounced (800ms, `js/data.js:debounce`) chamando `saveCodeSnippet(studentId, code)`; `Ctrl-S`/`Cmd-S` no CodeMirror salva na hora. Indicador textual "Salvando..."/"✓ Salvo" ao lado do botão de importar.
5. ✅ Ao abrir a view, carrega o código local (`getCodeSnippet`) e, em seguida, busca a versão mais recente do Supabase (`syncCodeSnippetFromSupabase`) — cobre o caso de o aluno ter salvo de outro dispositivo. Sem nada salvo, mostra o template padrão (`// Escreva seu código aqui\nconsole.log("Olá!");`).

**Testado com Playwright real** (offline, `js/config.js` movido temporariamente e restaurado ao final): login como aluno → abrir "💻 IDE JavaScript" → editor carrega com o template padrão (screenshot conferida) → digitar código novo → indicador muda para "✓ Salvo" após o debounce (confirmado por texto, não só visual) → **recarregar a página de verdade** (`page.reload()`, não simulado) e confirmar que o código digitado persistiu, lendo o valor real do CodeMirror via `getValue()` → importar um arquivo `.js` de verdade via seletor de arquivos do SO (`filechooser` do Playwright, não simulado): apareceu a confirmação esperada e o conteúdo do editor foi substituído corretamente pelo conteúdo do arquivo → `Ctrl+S` confirmado salvando na hora. Console do navegador checado: nenhum erro relacionado ao CodeMirror/IDE (os únicos avisos capturados são pré-existentes e não relacionados — `frame-ancestors` via `<meta>` sendo ignorado, que é uma limitação conhecida de CSP via meta tag em todo o app, e um 404 esperado do próprio `js/config.js` renomeado de propósito pro teste offline).

---

## Fase C — Execução isolada ("compilar") + console de saída

**Status: concluída em 2026-07-30 — arquitetura mudou de iframe sandboxed para Web Worker (motivo abaixo).**

### Achado importante: por que não ficou em `<iframe sandbox>` como o plano original previa

1. Ao tentar rodar o código do aluno via `srcdoc` num `<iframe sandbox="allow-scripts">`, a CSP de `student.html` (herdada por documentos `srcdoc`/`about:blank`) bloqueou o `<script>` inline (`script-src` sem `'unsafe-inline'`). Contornado servindo o runner como um arquivo estático separado (`ide-sandbox.html`, sem CSP própria) carregado via `iframe.src` em vez de `srcdoc` — um documento `src` normal não herda a CSP do pai.
2. Nesse processo, descobri (e não é bug meu, é **pré-existente**) que o "Playground de Código Interativo" que já existe dentro de cada módulo (aba "💻 Código", botão "▶️ Executar" em `js/student.js:runPlaygroundCode`) está **quebrado hoje em produção**: ele usa `new Function(...)` direto no documento principal, e a CSP do site não tem `'unsafe-eval'` — clicar "Executar" ali gera `EvalError: Evaluating a string as JavaScript violates... 'unsafe-eval' is not an allowed source`. Confirmado com Playwright real contra esse playground existente, fora do escopo desta tarefa. **Não mexi nele** (fora do pedido), mas fica registrado — vale um aviso separado ao usuário.
3. Depois de resolver a CSP (arquivo estático + `postMessage`, sem depender de `unsafe-eval`/`unsafe-inline`), testes repetidos mostraram instabilidade: às vezes a mensagem "ready" do sandbox nunca chegava ao pai. Isolando a causa, era um bug real e determinístico (não flakiness): um **comentário explicativo** dentro do `<script>` do sandbox continha o texto literal `"</script>"` (citando a própria tag como exemplo) — o parser HTML fecha a tag `<script>` ao encontrar esse literal em qualquer lugar do seu conteúdo, JS comment ou não, cortando o resto do arquivo (incluindo o aviso de "pronto"). Corrigido reescrevendo o comentário sem a sequência literal.
4. Com isso resolvido, testei o botão "⏹️ Parar" contra um loop **de verdade infinito** (`while(true){}`) — e o iframe sandboxed não segurou: no navegador de teste, o frame não foi isolado em processo próprio, então o loop travou a thread principal da página inteira, tornando o clique em "Parar" inútil (nem um `getAttribute` simples respondia). Isso derrubaria a proteção contra loop infinito prometida no plano original.
5. **Decisão**: trocar o executor de `<iframe sandbox>` para um **Web Worker dedicado** (`js/ide-worker.js`). Um Worker roda numa thread de verdade, sempre, garantido pela spec — não depende de o navegador decidir isolar em processo próprio. `worker.terminate()` também é garantido pela spec e interrompe a execução **mesmo em loop infinito**, o que resolveu exatamente o problema do item 4. Como bônus, um Worker não tem acesso a `document`/`window`/`localStorage` (nem existem esses globais lá) — isolamento pelo menos tão forte quanto o iframe, sem precisar de `sandbox`/CSP nenhuma. `ide-sandbox.html` foi removido; a mudança de CSP (`frame-src 'self'`) foi revertida por não ser mais necessária.

### O que foi implementado de fato

1. ✅ Botão "▶️ Executar" + atalho `Ctrl-Enter` no CodeMirror (mesmo padrão do editor de questão prática do professor); botão "⏹️ Parar" (desabilitado até ter uma execução em andamento).
2. ✅ `js/ide-worker.js`: Worker dedicado, reaproveitado entre execuções (só é destruído/recriado no "Parar" ou se não avisar "pronto" a tempo — vigia com até 2 tentativas de recriação). `console.log`/`console.error`/`console.warn` sobrescritos lá dentro pra mandar `postMessage` de volta em vez de escrever no console real; `self.onerror`/`unhandledrejection` capturam erro de runtime; o código do aluno roda via `new Function(codigo)()` dentro de um `try/catch`.
3. ✅ Painel "💻 Console de Saída" abaixo do editor, populado via `textContent` (não `innerHTML`) a partir das mensagens do Worker — sendo `textContent`, não precisa de `escapeHtml()` pra evitar XSS (diferente do plano original, que prometia `escapeHtml` + `innerHTML`; `textContent` é mais simples e já é seguro por padrão).
4. ✅ Erros de sintaxe/runtime aparecem como linha de erro no console, sem derrubar a página do aluno nem o Worker (cada erro só encerra a execução atual; o Worker antigo é sempre descartável e um novo é criado no próximo "Executar").
5. ❌ Não foi necessário mexer na CSP (a mudança `frame-src 'self'` foi revertida — Worker não usa `<iframe>`).
6. ✅ Proteção contra loop infinito: aviso "código pode estar travado" depois de 3s sem resposta; botão "⏹️ Parar" chama `worker.terminate()` — **testado e confirmado interrompendo um `while(true){}` de verdade**, diferente do que a Fase C original (iframe) conseguia garantir.

**Testado com Playwright real** (offline): `console.log` com string/objeto/número formatados corretamente; erro de runtime (`naoExiste.foo()`) capturado e mostrado sem quebrar nada; **teste de isolamento real** — código do aluno tentando ler `parent`/`window` recebe `ReferenceError` (esses globais nem existem num Worker), confirmando isolamento efetivo, até mais forte que o do iframe original; loop longo que termina sozinho mostra o aviso de demora corretamente; **`while(true){}` interrompido com sucesso pelo botão "Parar"** (a prova decisiva da mudança de arquitetura); atalho `Ctrl-Enter` confirmado. Nenhum erro de console relacionado à feature (só os pré-existentes `frame-ancestors`/404 do teste offline, já vistos nas fases anteriores).

---

## Fase D — Polimento (nice-to-have, mesmo espírito da Fase D do editor de módulo)

**Status: concluída em 2026-07-30.**

1. ✅ Modo tela cheia (botão "⛶ Tela Cheia", Esc pra sair): mesmo padrão de `toggleTheoryFullscreen` do professor — reparenta `#ide-editor-block` pra `document.body` enquanto ativo (mesmo motivo: `backdrop-filter` em ancestrais do layout cria um novo *containing block* pra elementos `position:fixed`, também presente em `student.css`). CSS novo em `student.css` (`.ide-editor-block.fullscreen-mode`).
2. ✅ Contador de linhas/caracteres (`#ide-line-count`, atualiza a cada mudança no editor via `ideEditorInstance.on('change', ...)`).
3. ✅ Botão "🗑️ Limpar" (esvazia o editor, com `confirm()`, e salva o vazio — não deixa o rascunho antigo "voltar" na próxima visita).
4. Indicador "Salvando..."/"✓ Salvo" já tinha sido implementado na Fase B (não precisou de trabalho adicional aqui).

**Testado com Playwright real** (offline): digitar 3 linhas → contador mostra "3 linhas · 20 caracteres" corretamente; tela cheia confirmada cobrindo exatamente a viewport (1280×720, top/left 0) e o código digitado sobrevive ao reparent; `Esc` sai da tela cheia corretamente; botão "Limpar" mostra a confirmação esperada, esvazia o editor e o contador some junto.

---

## Ordem sugerida

**A → B → C → D**, nessa ordem: sem a Fase A (backend) não há o que salvar; sem a Fase B (editor) não há onde escrever; a Fase C (execução segura) é o "compilar" pedido e depende do editor existir; a Fase D é polimento puro, fica pra quando sobrar tempo — igual foi feito no plano do editor de módulo.

---

## Fase E — Exportar código como arquivo (pedido depois das Fases A-D)

**Status: concluída em 2026-07-30.**

Pedido adicional: um botão pra salvar/baixar o código do editor como arquivo, com escolha de formato (`.js`, `.txt`, `.json` ou PDF).

1. ✅ `<select id="ide-save-format">` (js/txt/json/pdf, mesmo padrão do dropdown "Usar modelo..." do editor de módulo) + botão "💾 Salvar Arquivo" na toolbar da IDE, ao lado de "Importar Arquivo".
2. ✅ `.js`/`.txt`: baixa o código cru (`Blob` + link `<a download>` temporário), só muda a extensão/MIME.
3. ✅ `.json`: empacota como `{ code, savedAt }` (ISO date), não é só o código cru — dá pra saber quando foi exportado.
4. ✅ PDF: **decisão tomada com o usuário** — em vez de adicionar uma biblioteca de geração de PDF (mais uma dependência no projeto), usa o diálogo de impressão nativo do navegador: abre uma janela nova só com o código formatado (`white-space:pre-wrap`, fonte monoespaçada) e chama `window.print()`; o aluno escolhe "Salvar como PDF" ali. Sem mudança de CSP (a janela nova só tem `<style>` inline, que já é permitido; nenhum `<script>` inline é usado).

**Testado com Playwright real** (offline): os 4 formatos exportados de verdade (`page.waitForEvent('download')`, não simulado) — nome de arquivo e conteúdo conferidos para `.js`/`.txt`/`.json`; para PDF, confirmado que abre a janela com título e conteúdo corretos e que `window.print()` é chamado (stubado no teste pra não depender do diálogo real do SO).
