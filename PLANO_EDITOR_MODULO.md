# Plano de Melhorias — Editor de Módulo (Criar/Editar)

Levantamento feito em cima do código atual (`teacher.html` seção "Criar Novo Módulo", `js/teacher.js`, e o lado do aluno em `js/student.js`) para responder ao pedido: "criar módulo está muito simples" e "editar o texto está muito limitado".

---

## Achado crítico — não é só "limitado", tem bug real

O editor já tem mais estrutura do que parece à primeira vista: CodeMirror com modo Markdown, toolbar com 10 botões, layout Split/Editor/Prévia, prévia ao vivo. O problema é que **a barra de ferramentas promete recursos que o renderizador não entrega**:

- Botão **Itálico** (`*texto*`) → não vira itálico em lugar nenhum (renderer não trata `*...*` de item único, só `**negrito**`).
- Botão **Código inline** (`` `code` ``) → não vira `<code>`, fica com os crases literais.
- Botão **Link** (`[texto](url)`) → não vira `<a>`, fica com a sintaxe markdown crua.
- Botão **Lista** (`- item`) → não vira `<ul><li>`, fica como texto com hífen.
- Botão **Bloco de código** (` ```js `) → **é apagado inteiro** pelo renderer (`.replace(/\`\`\`[\s\S]*?\`\`\`/g, '')` remove o conteúdo, não formata). Qualquer exemplo de código colocado dentro da teoria via esse botão some.

Isso acontece **duas vezes de forma independente**: existe um `renderMarkdownLocal()` em `teacher.js` (usado na prévia do editor) e um `renderMarkdown()` quase idêntico em `student.js` (usado na tela real do aluno) — os dois têm exatamente as mesmas lacunas, então o que o professor vê na prévia já reflete fielmente o que quebra pro aluno (pelo menos são consistentes um com o outro), mas ambos precisam ser corrigidos e hoje é preciso lembrar de corrigir nos dois lugares.

**Ação recomendada**: antes de qualquer polimento de UX, verificar se módulos já publicados usam bloco de código / link / lista na teoria — esses alunos já estão vendo conteúdo cortado sem ninguém perceber, porque não dá erro nenhum, o texto simplesmente some.

---

## Fase A — Corrigir o motor de Markdown (prioridade alta, é bug)

**Status: concluída em 2026-07-30.**

1. ✅ Parser manual por regex (`renderMarkdownLocal` em `teacher.js` e `renderMarkdown` em `student.js`, ambos removidos) substituído por `marked.js@4.3.0` (CDN `cdnjs`, já liberado na CSP). Cobre itálico, código inline, links, listas, blocos de código com linguagem, tabelas — tudo que a toolbar já prometia.
2. ✅ Unificado num único `renderMarkdown(text)` em `js/data.js`, chamado por `teacher.js` (prévia ao vivo + modal "Prévia do Módulo") e `student.js` (tela real de teoria do aluno) — mesmo padrão já usado para `escapeHtml`/`showToast`/`debounce`.
3. ✅ Sanitização trocada de `escapeDangerousHtml` (denylist manual, rodava *antes* da conversão) para `DOMPurify@3.1.6` rodando *depois* do `marked.parse()` — abordagem padrão da indústria (converte primeiro, sanitiza a saída). `escapeDangerousHtml` foi removido de `data.js` por ficar órfão.
4. ✅ Destaque de sintaxe nos blocos de código via `highlight.js@11.9.0` (tema `dracula`, consistente com o tema já usado no CodeMirror), integrado via `marked.setOptions({ highlight: ... })`.
5. ✅ CSS ajustado: `.theory-content` (student.css) não tinha nenhuma regra para `code`, `pre`, `a`, `blockquote` — como o parser antigo nunca produzia essas tags direito, ninguém tinha notado. Adicionado estilo dark-theme consistente com o que já existia em `.preview-pane` (teacher.css), que por sinal já estava preparado para essas tags (só faltavam `a` e `blockquote`).

**Testado com Playwright real** (offline, `js/config.js` movido temporariamente): escrito um texto de teoria usando todos os recursos (negrito, itálico, código inline, lista, link, bloco de código, tabela) — confirmado visualmente (screenshot) e via HTML gerado que tudo renderiza corretamente na prévia do professor. Confirmado também que `renderMarkdown` (agora compartilhado) produz o mesmo resultado do lado do aluno. **Teste de XSS**: `<script>` e `onerror=` injetados via markdown malicioso são removidos pelo DOMPurify, sem execução — a troca de sanitizador não abriu brecha.

**Pendente do "achado crítico"** (não feito nesta rodada, precisa decisão do usuário): verificar se algum módulo já publicado no Supabase usa bloco de código / link / lista na teoria — esse conteúdo pode ter sido salvo "quebrado" (blocos de código, por exemplo, eram apagados no save antigo? não — o texto markdown cru é o que fica salvo no banco, só a *renderização* estava quebrada, então o conteúdo em si não foi perdido; só não aparecia direito. Com o novo parser, deve passar a renderizar corretamente automaticamente, sem precisar editar os módulos existentes de novo.

---

---

## Fase B — Editor de texto em si (o que foi pedido: "editar texto muito limitado")

**Status: concluída em 2026-07-30.**

1. ✅ Toolbar completada: lista numerada, citação (`>`), linha horizontal, botão "limpar formatação" (remove `**`, `*`, `` ` ``, `#`, `>`, `-`, `1.`, `[]()` da seleção).
2. ✅ Modo tela cheia (botão "⛶ Tela Cheia" ao lado do Split/Editor/Prévia, também sai com Esc). **Achado durante a implementação**: `position:fixed` sozinho não funcionava — um ancestral do formulário usa `backdrop-filter` (efeito de vidro fosco already usado no visual da UI), que cria um novo "containing block" pra elementos fixed e prendia a tela cheia dentro do layout normal em vez de cobrir a viewport. Corrigido reparentando o bloco pra `document.body` enquanto ativo (e de volta ao lugar original ao sair ou ao reabrir o formulário).
3. ✅ Atalhos de teclado reais: Ctrl+B, Ctrl+I, Ctrl+K (link), Ctrl+Shift+K (bloco de código) — com equivalentes Cmd para Mac. **Achado**: os títulos dos botões já diziam "Negrito (Ctrl+B)" e "Itálico (Ctrl+I)" há tempos, mas esses atalhos nunca tinham sido de fato ligados no CodeMirror — outro caso do mesmo padrão "promete e não entrega" achado na Fase A.
4. ✅ Suporte a imagem via toolbar (`![alt](url)`, mesmo padrão de URL do vídeo do YouTube — sem upload/Storage, para manter simples). O marked.js da Fase A já renderiza `<img>` corretamente, incluindo em ambos os lados (prévia do professor e tela do aluno).
5. ✅ Contador de palavras / tempo estimado de leitura (~200 palavras/min), atualiza ao digitar, ao lado da toolbar.
6. ✅ Corretor ortográfico ativado (`spellcheck: true` + `inputStyle: 'contenteditable'`, necessário no CodeMirror 5 pro navegador conseguir sublinhar erros) — só no editor de teoria, não no editor de código (correção ortográfica em JavaScript não ajuda em nada).

**Testado com Playwright real** (offline): cada botão novo da toolbar testado isoladamente confirmando a saída correta; atalhos Ctrl+B/Ctrl+K confirmados via teclado de verdade (não só clique); `spellcheck="true"` confirmado no elemento; tela cheia confirmada cobrindo exatamente a viewport (1400×1000) e saindo corretamente com Esc; contador de palavras confirmado ("5 palavras · ~1 min de leitura"). Screenshots conferidas visualmente.

---

## Fase C — Fluxo de criação de módulo (o que foi pedido: "criar módulo muito simples")

**Status: concluída em 2026-07-30.**

1. ✅ **Rascunho automático**: `serializeModuleDraft()`/`saveModuleDraft()` (debounced, 800ms) salvam o formulário inteiro em `localStorage` a cada alteração — só no fluxo de criar módulo novo (`currentEditModuleId === null`), não ao editar um já existente, pra não misturar rascunho com o estado de um módulo real. Ao clicar "Criar Novo Módulo", `checkForModuleDraftRecovery()` oferece recuperar se achar um rascunho com conteúdo. Rascunho é limpo só depois de salvar com sucesso — ficar em "Cancelar"/"Voltar" não apaga, pra cobrir também o caso de clique errado.
2. ✅ **Duplicar módulo**: botão "📋 Duplicar" em cada card da listagem. `duplicateModule(m)` reaproveita o mesmo preenchimento de formulário usado pra editar (`fillModuleFormFields`, extraído do que antes era só `renderModulesCrudForm`), com `id` vazio (destravado, pra exigir um ID novo) e título sufixado " (cópia)".
3. ✅ **Templates prontos**: dropdown "📄 Usar modelo..." acima do editor de teoria, com dois esqueletos ("Estrutura Linear", "Estrutura em Árvore/Grafo"). Pede confirmação antes de substituir se já houver conteúdo digitado.
4. ✅ **Big-O com sugestão**: os 5 campos de complexidade agora são `<select>` com as opções comuns (O(1), O(log n), O(n), O(n log n), O(n²)) + "Outro..." que revela um campo de texto livre. O input de texto original continua existindo (só escondido) como fonte da verdade — `saveModuleCrudForm()` não precisou ser alterado.
5. ✅ **Prévia mais fiel** (escopo ajustado): em vez de importar a folha de estilo inteira de `student.html` pro modal do professor (risco real de colisão de classes entre `teacher.css`/`student.css`, que não foram desenhadas pra conviver na mesma página), reaproveitei a mesma tipografia de markdown já validada na Fase A (`.preview-pane`) aplicando as mesmas regras à classe `.theory-text` (usada pelo modal "Prévia do Módulo", que antes não tinha nenhum estilo pra `code`/`pre`/`a`/`blockquote` — ficavam com a aparência padrão feia do navegador). Resultado visual equivalente, sem o risco de mexer no CSS compartilhado entre as duas páginas.
6. ✅ **Indicador de obrigatórios**: banner no topo do formulário (`#mod-missing-fields`) listando o que falta (ID, Título, Conteúdo Teórico, Código de Exemplo), atualizado ao vivo a cada alteração relevante.

**Testado com Playwright real** (offline): indicador mostra/esconde corretamente; select de Big-O troca pro campo de texto ao escolher "Outro" e volta a esconder ao escolher uma opção conhecida; template popula a teoria; duplicar módulo abre o form com ID vazio e título "(cópia)"; rascunho sobrevive a um `page.reload()` de verdade (não simulado) e é oferecido para recuperação, restaurando ID/título/código corretamente; tipografia da `.theory-text` confirmada via `getComputedStyle` (cor/peso de título, fundo de bloco de código, cor/sublinhado de link).

---

## Fase D — Extras (nice-to-have, menor prioridade)

**Status: concluída em 2026-07-30** (item 2 estava pendente aguardando reconexão do MCP do Supabase; reconectado e implementado nesta rodada).

1. ✅ Atalho Ctrl+S: listener no `document` (uma vez, no `DOMContentLoaded`) que intercepta Ctrl/Cmd+S só quando o formulário de módulo está aberto (`modules-crud-form-sec` visível) e chama `saveModuleCrudForm()` direto, sem precisar rolar até o botão nem depender de qual campo está com foco.
2. ✅ **Histórico simples de versões**: nova tabela `module_history` no Supabase (`module_id`, `snapshot` jsonb, `created_at`), sem policy pública — só acessível via Edge Function com service role, mesmo padrão de `sessions`. `save-module` agora guarda a versão anterior no histórico antes de sobrescrever e poda para as últimas 5 por módulo. Duas Edge Functions novas: `get-module-history` (lista versões) e `restore-module-history` (reverte — e guarda a versão atual no histórico antes de reverter, então a restauração também é desfazível). Botão "🕐 Histórico" em cada card da listagem abre modal com as versões salvas e opção de restaurar.
3. ✅ Modo "Foco" (botão "🎯 Modo Foco" ao lado do "⛶ Tela Cheia"): esconde as seções Informações Básicas, Big-O, Vídeo e Quiz (`.mod-form-section-hideable`), mantendo só a seção de Teoria e Código visível — diferente da tela cheia (que amplia só o editor cobrindo a viewport), aqui o formulário continua no layout normal, só mais enxuto.

**Testado com Playwright real** (offline): Ctrl+S salvou o módulo de verdade e voltou pra listagem (confirmado via `getModuleById`); modo foco escondeu as 4 seções (mantendo a teoria visível) e restaurou corretamente ao desligar.

**Item 2 testado direto contra o projeto Supabase ao vivo** (`estruturaPro`, via curl nas Edge Functions, sessão de teste temporária para `teacher1` criada e removida depois): salvou um módulo de teste 7 vezes seguidas confirmando que cada save guarda a versão anterior no histórico; confirmado que o histórico poda corretamente para as últimas 5 versões (mais antigas descartadas); restauração para uma versão antiga confirmada (módulo voltou ao conteúdo certo) e confirmado que a versão pré-restauração entrou no histórico (dá pra desfazer a restauração também); módulo e sessão de teste apagados ao final — 0 sobras confirmadas via SQL. A parte de UI (modal `mod-history-modal`, botão "🕐 Histórico") segue exatamente o mesmo padrão do modal de prévia já existente e testado (`mod-preview-modal`), não foi testada via browser automatizado nesta rodada.

---

## Ordem sugerida

**Fase A primeiro** — é a única que corrige um bug (conteúdo já publicado potencialmente quebrado para o aluno), as outras são melhoria de experiência pura. Depois, B e C podem ser feitas em paralelo/independentes conforme o que incomoda mais no dia a dia; D fica pra quando sobrar tempo.

Este plano ainda não foi implementado — é só o levantamento, conforme pedido.
